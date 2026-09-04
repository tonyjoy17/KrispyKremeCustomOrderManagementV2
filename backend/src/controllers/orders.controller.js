const { supabase } = require('../config/database');
const { sendOrderEmail, sendOrderUpdatedEmail, sendCustomerReadyEmail } = require('../config/email');
const { uploadOrderImage, removeOrderImages, getSignedImageUrl } = require('../config/storage');

const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'Australia/Adelaide';
const ORDER_SELECT = '*,store:stores!orders_store_id_fkey(name,store_code),pickup_store:stores!orders_pickup_store_id_fkey(name,store_code)';
const asDetailed = ({ store, pickup_store: pickupStore, ...order }) => ({
  ...order,
  store_name: store?.name,
  store_code: store?.store_code,
  pickup_store_name: pickupStore?.name,
  pickup_store_code: pickupStore?.store_code,
});
const adelaideDate = (offset = 0) => {
  const date = new Date(Date.now() + offset * 86400000);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};
const currentWeekStart = () => {
  const [year, month, day] = adelaideDate().split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString();
};
const pageValues = query => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
};
const logHistory = async (orderId, action, description, user) => {
  const { error } = await supabase.from('order_history').insert({ order_id: orderId, action, description, changed_by_id: user.storeId, changed_by_name: user.storeName });
  if (error) throw error;
};
const applyOrderFilters = (request, { filter, storeId, search, date }, factory = false) => {
  if (storeId) request = request.eq('store_id', storeId);
  const today = adelaideDate();
  const tomorrow = adelaideDate(1);
  if (filter === 'today') request = request.eq('pickup_date', today);
  else if (filter === 'tomorrow') request = request.eq('pickup_date', tomorrow);
  else if (filter === 'upcoming') request = request.gte('pickup_date', today).not('status', 'in', '(completed,cancelled)');
  else if (filter === 'past') request = request.or(`pickup_date.lt.${today},status.in.(completed,cancelled)`);
  if (date) request = request.eq('pickup_date', date);
  if (search) request = request.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
  return request;
};

const createOrder = async (req, res) => {
  let uploadedImagePath = null;
  try {
    const { customerName, customerPhone, customerEmail, orderDetails, isPaid, pickupStoreId, pickupDate } = req.body;
    if (!customerName || !customerPhone || !orderDetails || !pickupStoreId || !pickupDate) return res.status(400).json({ message: 'Missing required fields' });
    const numberResult = await supabase.rpc('next_order_number');
    if (numberResult.error) throw numberResult.error;
    uploadedImagePath = await uploadOrderImage(req.file, req.user.storeId);
    const { data: order, error } = await supabase.from('orders').insert({
      order_number: numberResult.data, store_id: req.user.storeId, customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(), customer_email: customerEmail?.trim() || null,
      order_details: orderDetails.trim(), is_paid: isPaid === true || isPaid === 'true' || isPaid === 'yes',
      reference_image_path: uploadedImagePath, pickup_store_id: pickupStoreId,
      pickup_date: pickupDate, created_by: req.user.storeId,
    }).select(ORDER_SELECT).single();
    if (error) throw error;
    const detailed = asDetailed(order);
    await logHistory(order.id, 'created', 'Order created', req.user);
    sendOrderEmail(detailed, req.user.storeName).then(async result => {
      if (!result?.skipped) await supabase.from('orders').update({ email_sent: true, email_sent_at: new Date().toISOString() }).eq('id', order.id);
    }).catch(error => console.error('Email failed:', error.message));
    res.status(201).json({ message: 'Order created successfully', order: { id: order.id, orderNumber: order.order_number, customerName: order.customer_name, pickupDate: order.pickup_date, status: order.status } });
  } catch (error) {
    console.error('Create order error:', error);
    if (uploadedImagePath) await removeOrderImages([uploadedImagePath]).catch(() => {});
    res.status(500).json({ message: 'Failed to create order' });
  }
};

const editOrder = async (req, res) => {
  try {
    const { data: raw, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!raw) return res.status(404).json({ message: 'Order not found' });
    const old = asDetailed(raw);
    if (!req.user.isFactory && !req.user.isAdmin && old.store_id !== req.user.storeId) return res.status(403).json({ message: 'Access denied' });
    if (['completed', 'cancelled'].includes(old.status)) return res.status(400).json({ message: 'Cannot edit completed or cancelled orders' });
    const { customerName, customerPhone, customerEmail, orderDetails, isPaid, pickupStoreId, pickupDate, notes } = req.body;
    const changes = [];
    if (customerName && customerName !== old.customer_name) changes.push(`Customer name: "${old.customer_name}" → "${customerName}"`);
    if (customerPhone && customerPhone !== old.customer_phone) changes.push(`Phone: "${old.customer_phone}" → "${customerPhone}"`);
    if (customerEmail !== undefined && customerEmail !== old.customer_email) changes.push('Email changed');
    if (orderDetails && orderDetails !== old.order_details) changes.push('Order details updated');
    const newIsPaid = isPaid === true || isPaid === 'true' || isPaid === 'yes';
    if (isPaid !== undefined && newIsPaid !== old.is_paid) changes.push(`Payment: ${old.is_paid ? 'Paid' : 'Unpaid'} → ${newIsPaid ? 'Paid' : 'Unpaid'}`);
    if (pickupDate && pickupDate !== old.pickup_date) changes.push('Pickup date changed');
    if (pickupStoreId && pickupStoreId !== old.pickup_store_id) changes.push('Pickup store changed');
    const update = {};
    if (customerName) update.customer_name = customerName.trim();
    if (customerPhone) update.customer_phone = customerPhone.trim();
    if (customerEmail !== undefined) update.customer_email = customerEmail?.trim() || null;
    if (orderDetails) update.order_details = orderDetails.trim();
    if (isPaid !== undefined) update.is_paid = newIsPaid;
    if (pickupStoreId) update.pickup_store_id = pickupStoreId;
    if (pickupDate) update.pickup_date = pickupDate;
    if (notes !== undefined) update.notes = notes?.trim() || null;
    const result = await supabase.from('orders').update(update).eq('id', req.params.id).select(ORDER_SELECT).single();
    if (result.error) throw result.error;
    const updated = asDetailed(result.data);
    if (changes.length) {
      await logHistory(req.params.id, 'edited', changes.join('; '), req.user);
      sendOrderUpdatedEmail(updated, req.user.storeName, changes).catch(error => console.error('Update email failed:', error.message));
    }
    res.json({ message: 'Order updated', order: updated, changes });
  } catch (error) { console.error('Edit order error:', error); res.status(500).json({ message: 'Failed to update order' }); }
};

const markOrderReceived = async (req, res) => {
  try {
    const result = await supabase.from('orders').select(ORDER_SELECT).eq('id', req.params.id).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return res.status(404).json({ message: 'Order not found' });
    const order = asDetailed(result.data);
    if (!req.user.isFactory && !req.user.isAdmin && order.store_id !== req.user.storeId) return res.status(403).json({ message: 'Access denied' });
    const update = await supabase.from('orders').update({ status: 'completed', customer_notified: true, customer_notified_at: new Date().toISOString() }).eq('id', req.params.id);
    if (update.error) throw update.error;
    await logHistory(req.params.id, 'received', 'Order marked as received — customer notification sent', req.user);
    sendCustomerReadyEmail(order, req.user.storeName).catch(error => console.error('Customer email failed:', error.message));
    res.json({ message: 'Order marked as received and customer notified' });
  } catch { res.status(500).json({ message: 'Failed to mark order received' }); }
};

const getOrderHistory = async (req, res) => {
  try {
    const { data, error } = await supabase.from('order_history').select('*').eq('order_id', req.params.id).order('created_at');
    if (error) throw error;
    res.json(data);
  } catch { res.status(500).json({ message: 'Failed to fetch history' }); }
};

const getRetailOrders = async (req, res) => {
  try {
    const paging = pageValues(req.query);
    let request = supabase.from('orders').select(ORDER_SELECT, { count: 'exact' }).order('created_at', { ascending: false }).range(paging.from, paging.to);
    request = applyOrderFilters(request, { ...req.query, storeId: req.user.storeId });
    const { data, error, count } = await request;
    if (error) throw error;
    res.json({ orders: data.map(asDetailed), total: count || 0, page: paging.page, limit: paging.limit });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Failed to fetch orders' }); }
};

const countOrders = async configure => {
  let request = supabase.from('orders').select('*', { count: 'exact', head: true });
  request = configure(request);
  const { count, error } = await request;
  if (error) throw error;
  return count || 0;
};

const getRetailDashboard = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const today = adelaideDate();
    const [todayPickups, upcoming, total, thisWeek] = await Promise.all([
      countOrders(q => q.eq('store_id', storeId).eq('pickup_date', today).not('status', 'in', '(completed,cancelled)')),
      countOrders(q => q.eq('store_id', storeId).gt('pickup_date', today).not('status', 'in', '(completed,cancelled)')),
      countOrders(q => q.eq('store_id', storeId)),
      countOrders(q => q.eq('store_id', storeId).gte('created_at', currentWeekStart())),
    ]);
    const result = await supabase.from('orders').select(ORDER_SELECT).eq('store_id', storeId).eq('pickup_date', today)
      .not('status', 'in', '(completed,cancelled)').order('created_at');
    if (result.error) throw result.error;
    res.json({ stats: { todayPickups, upcoming, total, thisWeek }, todayOrders: result.data.map(asDetailed) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Failed to fetch dashboard' }); }
};

const getFactoryDashboard = async (_req, res) => {
  try {
    const tomorrow = adelaideDate(1);
    const [tomorrowPickups, upcoming, total, thisWeek] = await Promise.all([
      countOrders(q => q.eq('pickup_date', tomorrow).not('status', 'in', '(completed,cancelled)')),
      countOrders(q => q.gt('pickup_date', tomorrow).not('status', 'in', '(completed,cancelled)')),
      countOrders(q => q),
      countOrders(q => q.gte('created_at', currentWeekStart())),
    ]);
    const result = await supabase.from('orders').select(ORDER_SELECT).eq('pickup_date', tomorrow)
      .not('status', 'in', '(completed,cancelled)').order('pickup_store_id').order('created_at');
    if (result.error) throw result.error;
    res.json({ stats: { tomorrowPickups, upcoming, total, thisWeek }, tomorrowOrders: result.data.map(asDetailed) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Failed to fetch factory dashboard' }); }
};

const getAllOrders = async (req, res) => {
  try {
    const paging = pageValues(req.query);
    let request = supabase.from('orders').select(ORDER_SELECT, { count: 'exact' })
      .order('pickup_date').order('created_at', { ascending: false }).range(paging.from, paging.to);
    request = applyOrderFilters(request, req.query, true);
    const { data, error, count } = await request;
    if (error) throw error;
    res.json({ orders: data.map(asDetailed), total: count || 0, page: paging.page, limit: paging.limit });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Failed to fetch orders' }); }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in_progress', 'ready', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const current = await supabase.from('orders').select('status').eq('id', req.params.id).maybeSingle();
    if (current.error) throw current.error;
    if (!current.data) return res.status(404).json({ message: 'Order not found' });
    const oldStatus = current.data.status;
    if (status === 'completed' && !req.user.isAdmin) return res.status(400).json({ message: 'Only retail can mark an order as completed via Order Received' });
    if (oldStatus === 'ready' && !['cancelled', 'completed'].includes(status)) return res.status(400).json({ message: 'Order is ready — can only be cancelled or completed now' });
    if (['completed', 'cancelled'].includes(oldStatus)) return res.status(400).json({ message: `Cannot change a ${oldStatus} order` });
    const result = await supabase.from('orders').update({ status }).eq('id', req.params.id).select('*').single();
    if (result.error) throw result.error;
    await logHistory(req.params.id, 'status_changed', `Status: ${oldStatus} → ${status}`, req.user);
    res.json({ message: 'Status updated', order: result.data });
  } catch { res.status(500).json({ message: 'Failed to update order' }); }
};

const deleteOrder = async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders').delete().eq('id', req.params.id).select('order_number,reference_image_path').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Order not found' });
    if (data.reference_image_path) await removeOrderImages([data.reference_image_path]).catch(error => console.error('Image delete failed:', error.message));
    res.json({ message: `Order ${data.order_number} deleted` });
  } catch { res.status(500).json({ message: 'Failed to delete order' }); }
};

const getOrder = async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Order not found' });
    const order = asDetailed(data);
    if (!req.user.isFactory && !req.user.isAdmin && order.store_id !== req.user.storeId) return res.status(403).json({ message: 'Access denied' });
    if (order.reference_image_path) order.reference_image_path = await getSignedImageUrl(order.reference_image_path);
    res.json(order);
  } catch { res.status(500).json({ message: 'Failed to fetch order' }); }
};

module.exports = { createOrder, editOrder, markOrderReceived, getOrderHistory, getRetailOrders, getRetailDashboard, getFactoryDashboard, getAllOrders, updateOrderStatus, deleteOrder, getOrder };
