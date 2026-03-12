const { query } = require('../config/database');

// Get all system settings
const getSettings = async (req, res) => {
  try {
    const result = await query('SELECT key, value, updated_at FROM system_settings ORDER BY key');
    const settings = {};
    result.rows.forEach(r => settings[r.key] = { value: r.value, updated_at: r.updated_at });
    res.json(settings);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch settings' }); }
};

// Update a setting
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const allowed = ['email_new_order_enabled','email_order_updated_enabled','email_customer_ready_enabled'];
    if (!allowed.includes(key)) return res.status(400).json({ message: 'Invalid setting key' });
    await query(
      'UPDATE system_settings SET value=$1, updated_at=NOW(), updated_by=$2 WHERE key=$3',
      [value, req.user.storeId, key]
    );
    res.json({ message: 'Setting updated', key, value });
  } catch (error) { res.status(500).json({ message: 'Failed to update setting' }); }
};

// Get all stores (admin)
const getAllStores = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, store_code, username, email, phone, address, is_factory, is_admin, is_active, created_at
       FROM stores ORDER BY is_admin DESC, is_factory DESC, name ASC`
    );
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch stores' }); }
};

// Register store (admin)
const registerStore = async (req, res) => {
  try {
    const { name, storeCode, username, password, email, phone, address, isFactory } = req.body;
    if (!name || !storeCode || !username || !password) return res.status(400).json({ message: 'Name, code, username and password required' });
    const existing = await query('SELECT id FROM stores WHERE username=$1 OR store_code=$2 OR name=$3',
      [username.trim().toLowerCase(), storeCode.trim().toUpperCase(), name.trim()]);
    if (existing.rows.length > 0) return res.status(409).json({ message: 'Username, code or name already exists' });
    const result = await query(
      `INSERT INTO stores (name,store_code,username,password_hash,email,phone,address,is_factory)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,name,store_code,username,email,is_factory,is_active,created_at`,
      [name.trim(), storeCode.trim().toUpperCase(), username.trim().toLowerCase(), password,
       email?.trim()||null, phone?.trim()||null, address?.trim()||null, isFactory===true||isFactory==='true']
    );
    res.status(201).json({ message: 'Store registered', store: result.rows[0] });
  } catch (error) { res.status(500).json({ message: 'Failed to register store' }); }
};

// Toggle store active
const toggleStore = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await query('SELECT * FROM stores WHERE id=$1', [id]);
    if (store.rows.length === 0) return res.status(404).json({ message: 'Store not found' });
    if (store.rows[0].is_admin) return res.status(400).json({ message: 'Cannot deactivate admin account' });
    const result = await query('UPDATE stores SET is_active=NOT is_active WHERE id=$1 RETURNING id,name,is_active', [id]);
    res.json({ message: `Store ${result.rows[0].is_active?'activated':'deactivated'}`, store: result.rows[0] });
  } catch (error) { res.status(500).json({ message: 'Failed to toggle store' }); }
};

// Delete store (admin)
const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await query('SELECT * FROM stores WHERE id=$1', [id]);
    if (store.rows.length === 0) return res.status(404).json({ message: 'Store not found' });
    if (store.rows[0].is_admin || store.rows[0].is_factory) return res.status(400).json({ message: 'Cannot delete admin or factory accounts' });
    const orderCount = await query('SELECT COUNT(*) FROM orders WHERE store_id=$1', [id]);
    if (parseInt(orderCount.rows[0].count) > 0) return res.status(400).json({ message: `Cannot delete — store has ${orderCount.rows[0].count} orders. Deactivate instead.` });
    await query('DELETE FROM stores WHERE id=$1', [id]);
    res.json({ message: 'Store deleted' });
  } catch (error) { res.status(500).json({ message: 'Failed to delete store' }); }
};

// Reset any password (admin)
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ message: 'Password must be at least 4 characters' });
    const result = await query('UPDATE stores SET password_hash=$1 WHERE id=$2 RETURNING id,name', [newPassword, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Store not found' });
    res.json({ message: 'Password reset successfully' });
  } catch (error) { res.status(500).json({ message: 'Failed to reset password' }); }
};

// Get activity log
const getActivityLog = async (req, res) => {
  try {
    const { page=1, limit=50, orderId } = req.query;
    const offset = (page-1)*limit;
    const params = [];
    let where = 'WHERE 1=1';
    if (orderId) { params.push(orderId); where += ` AND h.order_id=$${params.length}`; }
    const result = await query(
      `SELECT h.*, o.order_number, o.customer_name
       FROM order_history h JOIN orders o ON h.order_id=o.id
       ${where} ORDER BY h.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const count = await query(`SELECT COUNT(*) FROM order_history h ${where}`, params);
    res.json({ logs: result.rows, total: parseInt(count.rows[0].count) });
  } catch (error) { res.status(500).json({ message: 'Failed to fetch activity log' }); }
};

module.exports = { getSettings, updateSetting, getAllStores, registerStore, toggleStore, deleteStore, resetPassword, getActivityLog };
