const { query } = require('../config/database');

// Get stores for dropdown (non-factory only, for pickup selection)
const getStoresForDropdown = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, store_code FROM stores WHERE is_active=true AND is_factory=false AND (is_admin=false OR is_admin IS NULL) ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch stores' }); }
};

// Get all active stores (factory view)
const getAllStores = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, store_code, username, email, phone, address, is_factory, is_active, created_at FROM stores WHERE (is_admin=false OR is_admin IS NULL) ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch stores' }); }
};

// Register store (factory only — legacy, admin should use admin API)
const registerStore = async (req, res) => {
  try {
    const { name, storeCode, username, password, email, phone, address } = req.body;
    if (!name || !storeCode || !username || !password) return res.status(400).json({ message: 'Required fields missing' });
    const existing = await query('SELECT id FROM stores WHERE username=$1 OR store_code=$2 OR name=$3',
      [username.trim().toLowerCase(), storeCode.trim().toUpperCase(), name.trim()]);
    if (existing.rows.length > 0) return res.status(409).json({ message: 'Username, code or name already exists' });
    const result = await query(
      'INSERT INTO stores (name,store_code,username,password_hash,email,phone,address) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,store_code,username,is_active',
      [name.trim(), storeCode.trim().toUpperCase(), username.trim().toLowerCase(), password, email||null, phone||null, address||null]
    );
    res.status(201).json({ message: 'Store registered', store: result.rows[0] });
  } catch (error) { res.status(500).json({ message: 'Failed to register store' }); }
};

// Toggle store status
const toggleStoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE stores SET is_active=NOT is_active WHERE id=$1 RETURNING id,name,is_active', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Store not found' });
    res.json({ message: `Store ${result.rows[0].is_active?'activated':'deactivated'}`, store: result.rows[0] });
  } catch (error) { res.status(500).json({ message: 'Failed to toggle store' }); }
};

// Reset store password
const resetStorePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ message: 'Min 4 characters' });
    const result = await query('UPDATE stores SET password_hash=$1 WHERE id=$2 RETURNING id,name', [newPassword, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Store not found' });
    res.json({ message: 'Password reset successfully' });
  } catch (error) { res.status(500).json({ message: 'Failed to reset password' }); }
};

module.exports = { getStoresForDropdown, getAllStores, registerStore, toggleStoreStatus, resetStorePassword };