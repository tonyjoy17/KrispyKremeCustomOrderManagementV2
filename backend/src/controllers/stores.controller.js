const { supabase, unwrap } = require('../config/database');

// Get all retail stores (factory only)
const getAllStores = async (req, res) => {
  try {
    let request = supabase.from('stores')
      .select('id,name,store_code,username,email,phone,address,is_factory,is_active,created_at')
      .eq('is_admin', false).order('name');
    if (!req.user.isAdmin) request = request.eq('is_factory', false);
    const { data } = unwrap(await request);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stores' });
  }
};

// Get all stores for dropdown
const getStoresForDropdown = async (req, res) => {
  try {
    const { data } = unwrap(await supabase.from('stores').select('id,name,store_code')
      .eq('is_active', true).eq('is_factory', false).eq('is_admin', false).order('name'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stores' });
  }
};

// Register new retail store (factory only)
const registerStore = async (req, res) => {
  try {
    const { name, storeCode, username, password, email, phone, address } = req.body;

    if (!name || !storeCode || !username || !password) {
      return res.status(400).json({ message: 'Name, store code, username, and password are required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }

    // Check uniqueness
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedCode = storeCode.trim().toUpperCase();
    const normalizedName = name.trim();
    const uniquenessChecks = await Promise.all([
      supabase.from('stores').select('id').eq('username', normalizedUsername).limit(1),
      supabase.from('stores').select('id').eq('store_code', normalizedCode).limit(1),
      supabase.from('stores').select('id').eq('name', normalizedName).limit(1),
    ]);
    const existing = uniquenessChecks.flatMap((result) => unwrap(result).data);

    if (existing.length > 0) {
      return res.status(409).json({ message: 'A store with this username, code, or name already exists' });
    }

    // Save password as plain text
    const { data: store } = unwrap(await supabase.from('stores').insert({
      name: normalizedName, store_code: normalizedCode, username: normalizedUsername,
      password_hash: password, email: email?.trim() || null, phone: phone?.trim() || null,
      address: address?.trim() || null, is_factory: false,
    }).select('id,name,store_code,username,email,phone,address,is_active,created_at').single());

    res.status(201).json({
      message: 'Retail store registered successfully',
      store,
    });
  } catch (error) {
    console.error('Register store error:', error);
    res.status(500).json({ message: 'Failed to register store' });
  }
};

// Toggle store active status
const toggleStoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let lookup = supabase.from('stores').select('is_active').eq('id', id).eq('is_admin', false);
    if (!req.user.isAdmin) lookup = lookup.eq('is_factory', false);
    const { data: current } = unwrap(await lookup.maybeSingle());
    if (!current) {
      return res.status(404).json({ message: 'Store not found' });
    }
    let update = supabase.from('stores').update({ is_active: !current.is_active }).eq('id', id).eq('is_admin', false);
    if (!req.user.isAdmin) update = update.eq('is_factory', false);
    const { data: store } = unwrap(await update.select('id,name,is_active').single());
    res.json({
      message: `Store ${store.is_active ? 'activated' : 'deactivated'}`,
      store,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update store status' });
  }
};

// Reset store password (plain text)
const resetStorePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }

    let update = supabase.from('stores').update({ password_hash: newPassword }).eq('id', id).eq('is_admin', false);
    if (!req.user.isAdmin) update = update.eq('is_factory', false);
    const { data } = unwrap(await update.select('id,name'));

    if (data.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

module.exports = {
  getAllStores,
  getStoresForDropdown,
  registerStore,
  toggleStoreStatus,
  resetStorePassword,
};
