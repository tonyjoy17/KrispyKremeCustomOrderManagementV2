const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { login, changePassword, me } = require('../controllers/auth.controller');

router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
