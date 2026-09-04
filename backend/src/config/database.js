const { Pool } = require('pg');

if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL is required');

// Supabase is PostgreSQL. Its transaction pooler preserves the app's existing
// multi-table transactions and audit-history behavior.
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (error) => console.error('Unexpected Supabase pool error', error));

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
