const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticate, requireFactory, requireAdmin } = require('../middleware/auth');
const { createOrder, editOrder, markOrderReceived, getOrderHistory, getRetailOrders, getRetailDashboard, getFactoryDashboard, getAllOrders, updateOrderStatus, deleteOrder, getOrder } = require('../controllers/orders.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5242880 }, fileFilter: (req, file, cb) => {
  const ok = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error('Images only'), ok);
}});

// Retail
router.post('/', authenticate, upload.single('referenceImage'), createOrder);
router.put('/:id/edit', authenticate, editOrder);
router.put('/:id/received', authenticate, markOrderReceived);
router.get('/:id/history', authenticate, getOrderHistory);
router.get('/retail/dashboard', authenticate, getRetailDashboard);
router.get('/retail/orders', authenticate, getRetailOrders);

// Factory
router.get('/factory/dashboard', authenticate, requireFactory, getFactoryDashboard);
router.get('/factory/orders', authenticate, requireFactory, getAllOrders);
router.put('/:id/status', authenticate, requireFactory, updateOrderStatus);

// Admin
router.delete('/:id', authenticate, requireAdmin, deleteOrder);

// Shared
router.get('/:id', authenticate, getOrder);

module.exports = router;
