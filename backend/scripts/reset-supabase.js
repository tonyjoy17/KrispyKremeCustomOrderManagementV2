require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'order-images';

if (!url || !key || url.includes('YOUR_') || key.includes('YOUR_')) {
  throw new Error('Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first');
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const check = (result, operation) => {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data;
};

async function listFiles(prefix = '') {
  const paths = [];
  for (let offset = 0; ; offset += 100) {
    const entries = check(
      await supabase.storage.from(bucket).list(prefix, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } }),
      `List Storage path ${prefix || '/'}`
    );
    for (const entry of entries) {
      const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) paths.push(objectPath);
      else paths.push(...await listFiles(objectPath));
    }
    if (entries.length < 100) break;
  }
  return paths;
}

async function reset() {
  const files = await listFiles();
  for (let index = 0; index < files.length; index += 100) {
    check(await supabase.storage.from(bucket).remove(files.slice(index, index + 100)), 'Delete Storage objects');
  }

  check(await supabase.from('orders').delete().not('id', 'is', null), 'Delete orders');
  check(await supabase.from('stores').delete().not('id', 'is', null), 'Delete stores');

  const stores = check(await supabase.from('stores').insert([
    {
      name: 'Factory / Production',
      store_code: 'FACTORY',
      username: 'factory',
      password_hash: 'factory123',
      is_factory: true,
      is_active: true,
    },
    {
      name: 'System Administrator', store_code: 'ADMIN', username: 'admin',
      password_hash: 'admin123', is_factory: true, is_admin: true, is_active: true,
    },
    {
      name: 'Test Retail Store',
      store_code: 'TEST',
      username: 'teststore',
      password_hash: 'test123',
      is_factory: false,
      is_active: true,
    },
  ]).select('id,name,store_code,username,is_factory'), 'Create test accounts');

  console.log(JSON.stringify({ removedImages: files.length, createdAccounts: stores }, null, 2));
}

reset().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
