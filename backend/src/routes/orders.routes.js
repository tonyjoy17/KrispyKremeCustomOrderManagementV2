const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, requireFactory } = require('../middleware/auth');
const {
  createOrder,
  getRetailOrders,
  getRetailDashboard,
  getFactoryDashboard,
  getAllOrders,
  updateOrderStatus,
  getOrder,
} = require('../controllers/orders.controller');

// File upload config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// Retail routes
router.post('/', authenticate, upload.single('referenceImage'), createOrder);
router.get('/retail/dashboard', authenticate, getRetailDashboard);
router.get('/retail/orders', authenticate, getRetailOrders);

// Factory routes
router.get('/factory/dashboard', authenticate, requireFactory, getFactoryDashboard);
router.get('/factory/orders', authenticate, requireFactory, getAllOrders);
router.put('/:id/status', authenticate, requireFactory, updateOrderStatus);

// Shared
router.get('/:id', authenticate, getOrder);

module.exports = router;
