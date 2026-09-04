require('dotenv').config();

const { supabase } = require('../src/config/database');

async function check() {
  try {
    const { error } = await supabase.from('stores').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase API connection successful.');
  } catch (error) {
    console.error('Supabase connection failed:', error.message);
    process.exitCode = 1;
  } finally {}
}

check();
