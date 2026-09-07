const { supabase } = require('../config/database');

const getSettings = async (_req, res) => {
  try {
    const { data, error } = await supabase.from('system_settings').select('key,value,updated_at').order('key');
    if (error) throw error;
    res.json(Object.fromEntries(data.map(row => [row.key, { value: row.value, updated_at: row.updated_at }])));
  } catch { res.status(500).json({ message: 'Failed to fetch settings' }); }
};

const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const allowed = ['email_new_order_enabled', 'email_order_updated_enabled', 'email_customer_ready_enabled'];
    if (!allowed.includes(key)) return res.status(400).json({ message: 'Invalid setting key' });
    if (!['true', 'false'].includes(value)) return res.status(400).json({ message: 'Setting value must be true or false' });
    // Upsert also repairs live databases where the default setting rows were not
    // installed. Do not write updated_by because older schemas may omit it.
    const { data, error } = await supabase.from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select('key,value,updated_at').single();
    if (error) throw error;
    res.json({ message: 'Setting updated', ...data });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ message: error.message || 'Failed to update setting' });
  }
};

const getAllStores = async (_req, res) => {
  try {
    const { data, error } = await supabase.from('stores')
      .select('id,name,store_code,username,email,phone,address,is_factory,is_admin,is_active,created_at')
      .order('is_admin', { ascending: false }).order('is_factory', { ascending: false }).order('name');
    if (error) throw error;
    res.json(data);
  } catch { res.status(500).json({ message: 'Failed to fetch stores' }); }
};

const registerStore = async (req, res) => {
  try {
    const { name, storeCode, username, password, email, phone, address, accountType, isFactory, isAdmin } = req.body;
    if (!name || !storeCode || !username || !password) return res.status(400).json({ message: 'Name, code, username and password required' });
    const adminAccount = accountType === 'admin' || isAdmin === true || isAdmin === 'true';
    const factoryAccount = !adminAccount && (accountType === 'factory' || isFactory === true || isFactory === 'true');
    const record = {
      name: name.trim(), store_code: storeCode.trim().toUpperCase(), username: username.trim().toLowerCase(),
      password_hash: password, email: email?.trim() || null, phone: phone?.trim() || null,
      address: address?.trim() || null, is_factory: factoryAccount, is_admin: adminAccount,
    };
    const { data, error } = await supabase.from('stores').insert(record)
      .select('id,name,store_code,username,email,is_factory,is_admin,is_active,created_at').single();
    if (error?.code === '23505') return res.status(409).json({ message: 'Username, code or name already exists' });
    if (error) throw error;
    res.status(201).json({ message: 'Store registered', store: data });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Failed to register store' }); }
};

const toggleStore = async (req, res) => {
  try {
    const { data: store, error } = await supabase.from('stores').select('id,name,is_active,is_admin').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!store) return res.status(404).json({ message: 'Store not found' });
    if (store.is_admin) return res.status(400).json({ message: 'Cannot deactivate admin account' });
    const result = await supabase.from('stores').update({ is_active: !store.is_active }).eq('id', store.id).select('id,name,is_active').single();
    if (result.error) throw result.error;
    res.json({ message: `Store ${result.data.is_active ? 'activated' : 'deactivated'}`, store: result.data });
  } catch { res.status(500).json({ message: 'Failed to toggle store' }); }
};

const deleteStore = async (req, res) => {
  try {
    const { data: store, error } = await supabase.from('stores').select('id,is_admin,is_factory').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!store) return res.status(404).json({ message: 'Store not found' });
    if (store.is_admin || store.is_factory) return res.status(400).json({ message: 'Cannot delete admin or factory accounts' });
    const countResult = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', store.id);
    if (countResult.error) throw countResult.error;
    if (countResult.count > 0) return res.status(400).json({ message: `Cannot delete — store has ${countResult.count} orders. Deactivate instead.` });
    const deletion = await supabase.from('stores').delete().eq('id', store.id);
    if (deletion.error) throw deletion.error;
    res.json({ message: 'Store deleted' });
  } catch { res.status(500).json({ message: 'Failed to delete store' }); }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ message: 'Password must be at least 4 characters' });
    const { data, error } = await supabase.from('stores').update({ password_hash: newPassword }).eq('id', req.params.id).select('id,name').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Store not found' });
    res.json({ message: 'Password reset successfully' });
  } catch { res.status(500).json({ message: 'Failed to reset password' }); }
};

const getActivityLog = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
    let request = supabase.from('order_history')
      .select('*,orders!inner(order_number,customer_name)', { count: 'exact' })
      .order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (req.query.orderId) request = request.eq('order_id', req.query.orderId);
    const { data, error, count } = await request;
    if (error?.code === 'PGRST205') return res.json({ logs: [], total: 0 });
    if (error) throw error;
    const logs = data.map(({ orders, ...log }) => ({ ...log, order_number: orders.order_number, customer_name: orders.customer_name }));
    res.json({ logs, total: count || 0 });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Failed to fetch activity log' }); }
};

module.exports = { getSettings, updateSetting, getAllStores, registerStore, toggleStore, deleteStore, resetPassword, getActivityLog };
