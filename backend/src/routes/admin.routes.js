const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getSettings, updateSetting, getAllStores, registerStore, toggleStore, deleteStore, resetPassword, getActivityLog } = require('../controllers/admin.controller');

router.get('/settings', authenticate, requireAdmin, getSettings);
router.patch('/settings/:key', authenticate, requireAdmin, updateSetting);
router.get('/stores', authenticate, requireAdmin, getAllStores);
router.post('/stores', authenticate, requireAdmin, registerStore);
router.patch('/stores/:id/toggle', authenticate, requireAdmin, toggleStore);
router.delete('/stores/:id', authenticate, requireAdmin, deleteStore);
router.put('/stores/:id/reset-password', authenticate, requireAdmin, resetPassword);
router.get('/activity', authenticate, requireAdmin, getActivityLog);

module.exports = router;
