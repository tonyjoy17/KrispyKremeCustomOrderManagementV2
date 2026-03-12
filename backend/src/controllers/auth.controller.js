const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const result = await query(
      'SELECT * FROM stores WHERE username = $1 AND is_active = true',
      [username.trim().toLowerCase()]
    );
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const store = result.rows[0];
    if (password !== store.password_hash) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { storeId: store.id, storeName: store.name, storeCode: store.store_code, username: store.username, isFactory: store.is_factory, isAdmin: store.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      store: { id: store.id, storeName: store.name, storeCode: store.store_code, username: store.username, isFactory: store.is_factory, isAdmin: store.is_admin },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const storeId = req.user.storeId;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required' });
    if (newPassword.length < 4) return res.status(400).json({ message: 'Password must be at least 4 characters' });

    const result = await query('SELECT * FROM stores WHERE id = $1', [storeId]);
    const store = result.rows[0];
    if (currentPassword !== store.password_hash) return res.status(401).json({ message: 'Current password is incorrect' });

    await query('UPDATE stores SET password_hash = $1 WHERE id = $2', [newPassword, storeId]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const me = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, store_code, username, email, phone, is_factory, is_admin, created_at FROM stores WHERE id = $1',
      [req.user.storeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Store not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, changePassword, me };