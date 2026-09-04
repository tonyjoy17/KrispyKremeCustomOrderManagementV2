require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyConnection } = require('./config/email');
const { supabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', async (req, res) => {
  const { error } = await supabase.from('stores').select('id').limit(1);
  res.status(error ? 503 : 200).json({
    status: error ? 'degraded' : 'ok',
    database: error ? 'unavailable' : 'connected',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/stores', require('./routes/stores.routes'));

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large (max 5MB)' });
  }
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log('📦 Reference images: Supabase Storage');
  await verifyConnection();
  console.log('\nReady to accept connections\n');
});

module.exports = app;
