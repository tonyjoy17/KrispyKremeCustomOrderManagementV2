const express = require('express');
const router = express.Router();
const { authenticate, requireFactory } = require('../middleware/auth');
const { getStoresForDropdown, getAllStores, registerStore, toggleStoreStatus, resetStorePassword } = require('../controllers/stores.controller');

router.get('/dropdown', authenticate, getStoresForDropdown);
router.get('/', authenticate, requireFactory, getAllStores);
router.post('/', authenticate, requireFactory, registerStore);
router.patch('/:id/toggle-status', authenticate, requireFactory, toggleStoreStatus);
router.patch('/:id/reset-password', authenticate, requireFactory, resetStorePassword);

module.exports = router;
