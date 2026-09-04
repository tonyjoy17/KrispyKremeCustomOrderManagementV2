const jwt = require('jsonwebtoken');
const { supabase, unwrap } = require('../config/database');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const { data: store } = unwrap(await supabase.from('stores').select('*')
      .eq('username', username.trim().toLowerCase()).eq('is_active', true).maybeSingle());

    if (!store) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Plain text password check
    if (password !== store.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        storeId: store.id,
        storeName: store.name,
        storeCode: store.store_code,
        username: store.username,
        isFactory: store.is_factory,
        isAdmin: store.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      store: {
        storeId: store.id,
        storeName: store.name,
        storeCode: store.store_code,
        username: store.username,
        isFactory: store.is_factory,
        isAdmin: store.is_admin,
      },
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

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const { data: store } = unwrap(await supabase.from('stores').select('*').eq('id', storeId).maybeSingle());
    if (!store) return res.status(404).json({ message: 'Store not found' });

    if (currentPassword !== store.password_hash) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    unwrap(await supabase.from('stores').update({ password_hash: newPassword }).eq('id', storeId));

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const me = async (req, res) => {
  try {
    const { data: store } = unwrap(await supabase.from('stores')
      .select('id,name,store_code,username,email,phone,is_factory,is_admin,created_at')
      .eq('id', req.user.storeId).maybeSingle());
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, changePassword, me };
