const express = require('express');

const router = express.Router();
const settingsCtrl = require('../controllers/settings');

router.get('/useragent', settingsCtrl.getUserAgent);
router.post('/useragent', settingsCtrl.createUserAgent)
router.patch('/useragent', settingsCtrl.updateUserAgent);

module.exports = router;
