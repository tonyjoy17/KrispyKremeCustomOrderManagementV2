const { query, getClient } = require('../config/database');
const { sendOrderEmail, sendOrderUpdatedEmail, sendCustomerReadyEmail } = require('../config/email');
const path = require('path');
const fs = require('fs');

const generateOrderNumber = async () => {
  const result = await query("SELECT nextval('order_number_seq') AS num");
  const num = result.rows[0].num;
  const date = new Date();
  return `ORD-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}-${String(num).padStart(4,'0')}`;
};

const logHistory = async (client, orderId, action, description, user) => {
  await client.query(
    'INSERT INTO order_history (order_id, action, description, changed_by_id, changed_by_name) VALUES ($1,$2,$3,$4,$5)',
    [orderId, action, description, user.storeId, user.storeName]
  );
};

// Create new order
const createOrder = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { customerName, customerPhone, customerEmail, orderDetails, isPaid, pickupStoreId, pickupDate } = req.body;
    if (!customerName || !customerPhone || !orderDetails || !pickupStoreId || !pickupDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const orderNumber = await generateOrderNumber();
    const imagePath = req.file ? req.file.filename : null;
    const result = await client.query(
      `INSERT INTO orders (order_number,store_id,customer_name,customer_phone,customer_email,order_details,is_paid,reference_image_path,pickup_store_id,pickup_date,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [orderNumber, req.user.storeId, customerName.trim(), customerPhone.trim(), customerEmail?.trim()||null,
       orderDetails.trim(), isPaid===true||isPaid==='true'||isPaid==='yes', imagePath, pickupStoreId, pickupDate, req.user.storeId]
    );
    const order = result.rows[0];
    const storeResult = await client.query('SELECT name FROM stores WHERE id=$1', [pickupStoreId]);
    order.pickup_store_name = storeResult.rows[0]?.name;

    await logHistory(client, order.id, 'created', 'Order created', req.user);
    await client.query('COMMIT');

    sendOrderEmail(order, req.user.storeName).then(async (r) => {
      if (!r?.skipped) await query('UPDATE orders SET email_sent=true, email_sent_at=NOW() WHERE id=$1', [order.id]);
    }).catch(err => console.error('Email failed:', err.message));

    res.status(201).json({ message: 'Order created successfully', order: { id: order.id, orderNumber: order.order_number, customerName: order.customer_name, pickupDate: order.pickup_date, status: order.status } });
  } catch (error) {
    await client.query('ROLLBACK');
    if (req.file) { const fp = path.join(process.env.UPLOAD_DIR||'uploads', req.file.filename); if (fs.existsSync(fp)) fs.unlinkSync(fp); }
    res.status(500).json({ message: 'Failed to create order' });
  } finally { client.release(); }
};

// Edit order (retail only, own orders)
const editOrder = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { customerName, customerPhone, customerEmail, orderDetails, isPaid, pickupStoreId, pickupDate, notes } = req.body;

    // Fetch existing order
    const existing = await client.query(
      `SELECT o.*, ps.name as pickup_store_name FROM orders o JOIN stores ps ON o.pickup_store_id=ps.id WHERE o.id=$1`, [id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const old = existing.rows[0];

    // Retail can only edit own orders
    if (!req.user.isFactory && !req.user.isAdmin && old.store_id !== req.user.storeId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Cannot edit completed or cancelled
    if (['completed','cancelled'].includes(old.status)) {
      return res.status(400).json({ message: 'Cannot edit completed or cancelled orders' });
    }

    // Track changes
    const changes = [];
    if (customerName && customerName !== old.customer_name) changes.push(`Customer name: "${old.customer_name}" → "${customerName}"`);
    if (customerPhone && customerPhone !== old.customer_phone) changes.push(`Phone: "${old.customer_phone}" → "${customerPhone}"`);
    if (customerEmail !== undefined && customerEmail !== old.customer_email) changes.push(`Email changed`);
    if (orderDetails && orderDetails !== old.order_details) changes.push(`Order details updated`);
    const newIsPaid = isPaid===true||isPaid==='true'||isPaid==='yes';
    if (isPaid !== undefined && newIsPaid !== old.is_paid) changes.push(`Payment: ${old.is_paid?'Paid':'Unpaid'} → ${newIsPaid?'Paid':'Unpaid'}`);
    if (pickupDate && pickupDate !== old.pickup_date?.toISOString?.().split('T')[0]) changes.push(`Pickup date changed`);
    if (pickupStoreId && pickupStoreId !== old.pickup_store_id) {
      const ns = await client.query('SELECT name FROM stores WHERE id=$1', [pickupStoreId]);
      changes.push(`Pickup store: "${old.pickup_store_name}" → "${ns.rows[0]?.name}"`);
    }

    const result = await client.query(
      `UPDATE orders SET
        customer_name=COALESCE($1,customer_name),
        customer_phone=COALESCE($2,customer_phone),
        customer_email=COALESCE($3,customer_email),
        order_details=COALESCE($4,order_details),
        is_paid=COALESCE($5,is_paid),
        pickup_store_id=COALESCE($6,pickup_store_id),
        pickup_date=COALESCE($7,pickup_date),
        notes=COALESCE($8,notes)
       WHERE id=$9 RETURNING *`,
      [customerName?.trim()||null, customerPhone?.trim()||null, customerEmail?.trim()||null,
       orderDetails?.trim()||null, isPaid!==undefined?newIsPaid:null,
       pickupStoreId||null, pickupDate||null, notes?.trim()||null, id]
    );

    const updated = result.rows[0];
    const pickupStoreResult = await client.query('SELECT name FROM stores WHERE id=$1', [updated.pickup_store_id]);
    updated.pickup_store_name = pickupStoreResult.rows[0]?.name;

    if (changes.length > 0) {
      const desc = changes.join('; ');
      await logHistory(client, id, 'edited', desc, req.user);

      sendOrderUpdatedEmail(updated, req.user.storeName, changes).catch(err => console.error('Update email failed:', err.message));
    }

    await client.query('COMMIT');
    res.json({ message: 'Order updated', order: updated, changes });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Edit order error:', error);
    res.status(500).json({ message: 'Failed to update order' });
  } finally { client.release(); }
};

// Mark order received by retail + email customer
const markOrderReceived = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const result = await client.query(
      `SELECT o.*, s.name as store_name, ps.name as pickup_store_name FROM orders o
       JOIN stores s ON o.store_id=s.id JOIN stores ps ON o.pickup_store_id=ps.id WHERE o.id=$1`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const order = result.rows[0];

    if (!req.user.isFactory && !req.user.isAdmin && order.store_id !== req.user.storeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await client.query(
      'UPDATE orders SET status=$1, customer_notified=true, customer_notified_at=NOW() WHERE id=$2',
      ['completed', id]
    );
    await logHistory(client, id, 'received', 'Order marked as received — customer notification sent', req.user);
    await client.query('COMMIT');

    sendCustomerReadyEmail(order, req.user.storeName).catch(err => console.error('Customer email failed:', err.message));

    res.json({ message: 'Order marked as received and customer notified' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to mark order received' });
  } finally { client.release(); }
};

// Get order history
const getOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM order_history WHERE order_id=$1 ORDER BY created_at ASC', [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};

// Get retail orders
const getRetailOrders = async (req, res) => {
  try {
    const { filter='all', page=1, limit=20, search='', date='' } = req.query;
    const offset = (page-1)*limit;
    const storeId = req.user.storeId;
    const params = [storeId];
    let where = 'WHERE o.store_id=$1';
    if (filter==='today') where += ' AND o.pickup_date=(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date';
    else if (filter==='upcoming') where += " AND o.pickup_date>=(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date AND o.status NOT IN ('completed','cancelled')";
    else if (filter==='past') where += " AND (o.pickup_date<(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date OR o.status IN ('completed','cancelled'))";
    if (date) { params.push(date); where += ` AND o.pickup_date=$${params.length}`; }
    if (search) { params.push(`%${search.toLowerCase()}%`); where += ` AND (LOWER(o.customer_name) LIKE $${params.length} OR o.customer_phone LIKE $${params.length})`; }
    const countResult = await query(`SELECT COUNT(*) FROM orders o ${where}`, params);
    const ordersResult = await query(
      `SELECT o.*,s.name as store_name,ps.name as pickup_store_name,ps.store_code as pickup_store_code
       FROM orders o JOIN stores s ON o.store_id=s.id JOIN stores ps ON o.pickup_store_id=ps.id
       ${where} ORDER BY o.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    res.json({ orders: ordersResult.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (error) { res.status(500).json({ message: 'Failed to fetch orders' }); }
};

// Get retail dashboard
const getRetailDashboard = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const [t,u,tot,w] = await Promise.all([
      query(`SELECT COUNT(*) FROM orders WHERE store_id=$1 AND pickup_date=(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date AND status NOT IN ('completed','cancelled')`, [storeId]),
      query(`SELECT COUNT(*) FROM orders WHERE store_id=$1 AND pickup_date>(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date AND status NOT IN ('completed','cancelled')`, [storeId]),
      query(`SELECT COUNT(*) FROM orders WHERE store_id=$1`, [storeId]),
      query(`SELECT COUNT(*) FROM orders WHERE store_id=$1 AND created_at >= date_trunc('week', (CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date + INTERVAL '1 day') - INTERVAL '1 day' AND created_at < date_trunc('week', (CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date + INTERVAL '1 day') - INTERVAL '1 day' + INTERVAL '7 days'`, [storeId]),
    ]);
    const todayOrders = await query(
      `SELECT o.*,ps.name as pickup_store_name FROM orders o JOIN stores ps ON o.pickup_store_id=ps.id
       WHERE o.store_id=$1 AND o.pickup_date=(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date AND o.status NOT IN ('completed','cancelled') ORDER BY o.created_at ASC`, [storeId]
    );
    res.json({ stats: { todayPickups: parseInt(t.rows[0].count), upcoming: parseInt(u.rows[0].count), total: parseInt(tot.rows[0].count), thisWeek: parseInt(w.rows[0].count) }, todayOrders: todayOrders.rows });
  } catch (error) { res.status(500).json({ message: 'Failed to fetch dashboard' }); }
};

// Get factory dashboard
const getFactoryDashboard = async (req, res) => {
  try {
    const [t,u,tot,w] = await Promise.all([
      query(`SELECT COUNT(*) FROM orders WHERE pickup_date=(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date+INTERVAL '1 day' AND status NOT IN ('completed','cancelled')`),
      query(`SELECT COUNT(*) FROM orders WHERE pickup_date>(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date+INTERVAL '1 day' AND status NOT IN ('completed','cancelled')`),
      query(`SELECT COUNT(*) FROM orders`),
      query(`SELECT COUNT(*) FROM orders WHERE created_at >= date_trunc('week', (CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date + INTERVAL '1 day') - INTERVAL '1 day' AND created_at < date_trunc('week', (CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date + INTERVAL '1 day') - INTERVAL '1 day' + INTERVAL '7 days'`),
    ]);
    const tomorrowOrders = await query(
      `SELECT o.*,s.name as store_name,ps.name as pickup_store_name,ps.store_code as pickup_store_code
       FROM orders o JOIN stores s ON o.store_id=s.id JOIN stores ps ON o.pickup_store_id=ps.id
       WHERE o.pickup_date=(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date+INTERVAL '1 day' AND o.status NOT IN ('completed','cancelled')
       ORDER BY o.pickup_store_id,o.created_at ASC`
    );
    res.json({ stats: { tomorrowPickups: parseInt(t.rows[0].count), upcoming: parseInt(u.rows[0].count), total: parseInt(tot.rows[0].count), thisWeek: parseInt(w.rows[0].count) }, tomorrowOrders: tomorrowOrders.rows });
  } catch (error) { res.status(500).json({ message: 'Failed to fetch factory dashboard' }); }
};

// Get all orders (factory)
const getAllOrders = async (req, res) => {
  try {
    const { filter='all', storeId, page=1, limit=20, search='', date='' } = req.query;
    const offset = (page-1)*limit;
    const params = [];
    let where = 'WHERE 1=1';
    if (storeId) { params.push(storeId); where += ` AND o.store_id=$${params.length}`; }
    if (filter==='tomorrow') where += ` AND o.pickup_date=(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date+INTERVAL '1 day'`;
    else if (filter==='upcoming') where += ` AND o.pickup_date>=(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date AND o.status NOT IN ('completed','cancelled')`;
    else if (filter==='past') where += ` AND (o.pickup_date<(CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Adelaide')::date OR o.status IN ('completed','cancelled'))`;
    if (date) { params.push(date); where += ` AND o.pickup_date=$${params.length}`; }
    if (search) { params.push(`%${search.toLowerCase()}%`); where += ` AND (LOWER(o.customer_name) LIKE $${params.length} OR o.customer_phone LIKE $${params.length})`; }
    const countResult = await query(`SELECT COUNT(*) FROM orders o ${where}`, params);
    const ordersResult = await query(
      `SELECT o.*,s.name as store_name,s.store_code,ps.name as pickup_store_name,ps.store_code as pickup_store_code
       FROM orders o JOIN stores s ON o.store_id=s.id JOIN stores ps ON o.pickup_store_id=ps.id
       ${where} ORDER BY o.pickup_date ASC,o.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    res.json({ orders: ordersResult.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (error) { res.status(500).json({ message: 'Failed to fetch orders' }); }
};

// Update order status (factory)
const updateOrderStatus = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['pending','in_progress','ready','completed','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const existing = await client.query('SELECT status FROM orders WHERE id=$1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const oldStatus = existing.rows[0].status;

    // Factory cannot set completed
    if (status === 'completed' && !req.user.isAdmin) return res.status(400).json({ message: 'Only retail can mark an order as completed via Order Received' });
    // Once ready, can only cancel (no going back)
    if (oldStatus === 'ready' && status !== 'cancelled' && status !== 'completed') return res.status(400).json({ message: 'Order is ready — can only be cancelled or completed now' });
    // Cannot change completed or cancelled orders
    if (['completed','cancelled'].includes(oldStatus)) return res.status(400).json({ message: `Cannot change a ${oldStatus} order` });
    const result = await client.query('UPDATE orders SET status=$1 WHERE id=$2 RETURNING *', [status, id]);
    await logHistory(client, id, 'status_changed', `Status: ${oldStatus} → ${status}`, req.user);
    await client.query('COMMIT');
    res.json({ message: 'Status updated', order: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to update order' });
  } finally { client.release(); }
};

// Delete order (admin only)
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM orders WHERE id=$1 RETURNING order_number', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: `Order ${result.rows[0].order_number} deleted` });
  } catch (error) { res.status(500).json({ message: 'Failed to delete order' }); }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT o.*,s.name as store_name,s.store_code,ps.name as pickup_store_name
       FROM orders o JOIN stores s ON o.store_id=s.id JOIN stores ps ON o.pickup_store_id=ps.id WHERE o.id=$1`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    if (!req.user.isFactory && !req.user.isAdmin && result.rows[0].store_id !== req.user.storeId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch order' }); }
};

module.exports = { createOrder, editOrder, markOrderReceived, getOrderHistory, getRetailOrders, getRetailDashboard, getFactoryDashboard, getAllOrders, updateOrderStatus, deleteOrder, getOrder };