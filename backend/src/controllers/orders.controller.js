const { supabase, unwrap } = require('../config/database');
const { sendOrderEmail } = require('../config/email');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'order-images';
const activeStatuses = ['completed', 'cancelled'];
const orderSelect = `*,
  store:stores!orders_store_id_fkey(name,store_code),
  pickup_store:stores!orders_pickup_store_id_fkey(name,store_code)`;

const dateInZone = (dayOffset = 0) => {
  const timeZone = process.env.APP_TIME_ZONE || 'Australia/Adelaide';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const utc = new Date(`${values.year}-${values.month}-${values.day}T00:00:00Z`);
  utc.setUTCDate(utc.getUTCDate() + dayOffset);
  return utc.toISOString().slice(0, 10);
};

const flattenOrder = (order) => {
  if (!order) return order;
  const { store, pickup_store: pickupStore, ...row } = order;
  return {
    ...row,
    ...(store && { store_name: store.name, store_code: store.store_code }),
    ...(pickupStore && {
      pickup_store_name: pickupStore.name,
      pickup_store_code: pickupStore.store_code,
    }),
  };
};

const applyFilters = (builder, { filter, storeId, search, date, tomorrow = false }) => {
  const today = dateInZone();
  const nextDay = dateInZone(1);
  if (storeId) builder = builder.eq('store_id', storeId);
  if (filter === 'today') builder = builder.eq('pickup_date', today);
  if (filter === 'tomorrow') builder = builder.eq('pickup_date', nextDay);
  if (filter === 'upcoming') {
    builder = builder[filters.exclusive ? 'gt' : 'gte']('pickup_date', tomorrow ? nextDay : today)
      .not('status', 'in', `(${activeStatuses.join(',')})`);
  }
  if (filter === 'past') {
    builder = builder.or(`pickup_date.lt.${today},status.in.(${activeStatuses.join(',')})`);
  }
  if (date) builder = builder.eq('pickup_date', date);
  if (filters.activeOnly) builder = builder.not('status', 'in', `(${activeStatuses.join(',')})`);
  if (search) {
    const safe = search.replace(/[(),."']/g, ' ').trim();
    if (safe) builder = builder.or(`customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`);
  }
  return builder;
};

const countOrders = async (filters) => {
  const result = await applyFilters(supabase.from('orders').select('*', { count: 'exact', head: true }), filters);
  return unwrap(result).count || 0;
};

const createOrder = async (req, res) => {
  let uploadedPath;
  try {
    const { customerName, customerPhone, customerEmail, orderDetails, totalDozen, isPaid, pickupStoreId, pickupDate, orderingStoreId } = req.body;
    const orderStoreId = req.user.isAdmin ? orderingStoreId : req.user.storeId;
    const parsedTotalDozen = Number(totalDozen);
    if (!customerName || !customerPhone || !orderDetails || !pickupStoreId || !pickupDate || !orderStoreId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!Number.isInteger(parsedTotalDozen) || parsedTotalDozen <= 0) {
      return res.status(400).json({ message: 'Total dozen must be a whole number greater than 0' });
    }

    if (req.user.isFactory && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Only retail stores and admins can create orders' });
    }
    const { data: orderingStore } = unwrap(await supabase.from('stores').select('id,name')
      .eq('id', orderStoreId).eq('is_active', true).eq('is_factory', false).eq('is_admin', false).maybeSingle());
    if (!orderingStore) return res.status(400).json({ message: 'Invalid ordering store' });
    const { data: pickupStore } = unwrap(await supabase.from('stores').select('name')
      .eq('id', pickupStoreId).eq('is_active', true).maybeSingle());
    if (!pickupStore) return res.status(400).json({ message: 'Invalid pickup store' });

    if (req.file) {
      const extension = path.extname(req.file.originalname).toLowerCase();
      uploadedPath = `${orderStoreId}/${uuidv4()}${extension}`;
      unwrap(await supabase.storage.from(bucket).upload(uploadedPath, req.file.buffer, {
        contentType: req.file.mimetype, upsert: false,
      }));
    }

    const { data: orderNumber } = unwrap(await supabase.rpc('generate_order_number'));
    const { data: order } = unwrap(await supabase.from('orders').insert({
      order_number: orderNumber,
      store_id: orderStoreId,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail?.trim() || null,
      order_details: orderDetails.trim(),
      total_dozen: parsedTotalDozen,
      is_paid: isPaid === true || isPaid === 'true' || isPaid === 'yes',
      reference_image_path: uploadedPath,
      pickup_store_id: pickupStoreId,
      pickup_date: pickupDate,
      created_by: req.user.storeId,
    }).select('*').single());

    order.pickup_store_name = pickupStore.name;
    sendOrderEmail(order, orderingStore.name).then(async () => {
      const { error } = await supabase.from('orders').update({ email_sent: true, email_sent_at: new Date().toISOString() }).eq('id', order.id);
      if (error) console.error('Could not mark order email as sent:', error.message);
    }).catch((error) => console.error('Email failed:', error.message));

    res.status(201).json({
      message: 'Order created successfully',
      order: { id: order.id, orderNumber: order.order_number, customerName: order.customer_name, pickupDate: order.pickup_date, status: order.status },
    });
  } catch (error) {
    console.error('Create order error:', error);
    if (uploadedPath) await supabase.storage.from(bucket).remove([uploadedPath]);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

const getRetailOrders = async (req, res) => {
  try {
    const { filter = 'all', search = '', date = '' } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filters = { filter, search, date, storeId: req.user.storeId };
    const total = await countOrders(filters);
    let request = applyFilters(supabase.from('orders').select(orderSelect), filters);
    const { data } = unwrap(await request.order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1));
    res.json({ orders: data.map(flattenOrder), total, page, limit });
  } catch (error) {
    console.error('Get retail orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

const getRetailDashboard = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const today = dateInZone();
    const [todayPickups, upcoming, total, paid] = await Promise.all([
      countOrders({ filter: 'today', storeId, activeOnly: true }),
      countOrders({ filter: 'upcoming', storeId, exclusive: true }),
      countOrders({ storeId }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('is_paid', true).then(unwrap),
    ]);
    const { data } = unwrap(await supabase.from('orders').select(orderSelect).eq('store_id', storeId)
      .eq('pickup_date', today).not('status', 'in', `(${activeStatuses.join(',')})`).order('created_at'));
    res.json({ stats: { todayPickups, upcoming, total, paid: paid.count || 0 }, todayOrders: data.map(flattenOrder) });
  } catch (error) {
    console.error('Get retail dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};

const getFactoryDashboard = async (req, res) => {
  try {
    const tomorrow = dateInZone(1);
    const [tomorrowPickups, upcoming, total] = await Promise.all([
      countOrders({ filter: 'tomorrow', activeOnly: true }),
      countOrders({ filter: 'upcoming', tomorrow: true, exclusive: true }),
      countOrders({}),
    ]);
    const { data } = unwrap(await supabase.from('orders').select(orderSelect).eq('pickup_date', tomorrow)
      .not('status', 'in', `(${activeStatuses.join(',')})`).order('pickup_store_id').order('created_at'));
    res.json({ stats: { tomorrowPickups, upcoming, total }, tomorrowOrders: data.map(flattenOrder) });
  } catch (error) {
    console.error('Get factory dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch factory dashboard' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { filter = 'all', storeId, search = '', date = '' } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filters = { filter, storeId, search, date };
    const total = await countOrders(filters);
    let request = applyFilters(supabase.from('orders').select(orderSelect), filters);
    const { data } = unwrap(await request.order('pickup_date').order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1));
    res.json({ orders: data.map(flattenOrder), total, page, limit });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const validStatuses = ['pending', 'in_progress', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
    const { data: order } = unwrap(await supabase.from('orders').update({ status: req.body.status })
      .eq('id', req.params.id).select('*').maybeSingle());
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order' });
  }
};

const getOrder = async (req, res) => {
  try {
    const { data } = unwrap(await supabase.from('orders').select(orderSelect).eq('id', req.params.id).maybeSingle());
    const order = flattenOrder(data);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!req.user.isFactory && order.store_id !== req.user.storeId) return res.status(403).json({ message: 'Access denied' });
    if (order.reference_image_path) {
      order.reference_image_url = supabase.storage.from(bucket).getPublicUrl(order.reference_image_path).data.publicUrl;
    }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

module.exports = { createOrder, getRetailOrders, getRetailDashboard, getFactoryDashboard, getAllOrders, updateOrderStatus, getOrder };
