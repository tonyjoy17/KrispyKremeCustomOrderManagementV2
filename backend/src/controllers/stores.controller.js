const { supabase } = require('../config/database');

const getStoresForDropdown = async (_req, res) => {
  try {
    const { data, error } = await supabase.from('stores').select('id,name,store_code')
      .eq('is_active', true).eq('is_factory', false).or('is_admin.eq.false,is_admin.is.null').order('name');
    if (error) throw error;
    res.json(data);
  } catch { res.status(500).json({ message: 'Failed to fetch stores' }); }
};

const getAllStores = async (_req, res) => {
  try {
    const { data, error } = await supabase.from('stores')
      .select('id,name,store_code,username,email,phone,address,is_factory,is_active,created_at')
      .or('is_admin.eq.false,is_admin.is.null').order('name');
    if (error) throw error;
    res.json(data);
  } catch { res.status(500).json({ message: 'Failed to fetch stores' }); }
};

const registerStore = async (req, res) => {
  try {
    const { name, storeCode, username, password, email, phone, address } = req.body;
    if (!name || !storeCode || !username || !password) return res.status(400).json({ message: 'Required fields missing' });
    const normalized = { name: name.trim(), store_code: storeCode.trim().toUpperCase(), username: username.trim().toLowerCase() };
    const { data, error } = await supabase.from('stores').insert({ ...normalized, password_hash: password, email: email || null, phone: phone || null, address: address || null })
      .select('id,name,store_code,username,is_active').single();
    if (error?.code === '23505') return res.status(409).json({ message: 'Username, code or name already exists' });
    if (error) throw error;
    res.status(201).json({ message: 'Store registered', store: data });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Failed to register store' }); }
};

const toggleStoreStatus = async (req, res) => {
  try {
    const { data: store, error } = await supabase.from('stores').select('id,name,is_active').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!store) return res.status(404).json({ message: 'Store not found' });
    const result = await supabase.from('stores').update({ is_active: !store.is_active }).eq('id', store.id).select('id,name,is_active').single();
    if (result.error) throw result.error;
    res.json({ message: `Store ${result.data.is_active ? 'activated' : 'deactivated'}`, store: result.data });
  } catch { res.status(500).json({ message: 'Failed to toggle store' }); }
};

const resetStorePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ message: 'Min 4 characters' });
    const { data, error } = await supabase.from('stores').update({ password_hash: newPassword }).eq('id', req.params.id).select('id,name').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Store not found' });
    res.json({ message: 'Password reset successfully' });
  } catch { res.status(500).json({ message: 'Failed to reset password' }); }
};

module.exports = { getStoresForDropdown, getAllStores, registerStore, toggleStoreStatus, resetStorePassword };
