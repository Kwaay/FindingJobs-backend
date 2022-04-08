const express = require('express');

const router = express.Router();
const userAgentCtrl = require('../controllers/useragent');

router.get('/', userAgentCtrl.getUserAgent);
router.post('/', userAgentCtrl.createUserAgent);
router.patch('/', userAgentCtrl.updateUserAgent);

module.exports = router;
