const express = require('express');

const router = express.Router();
const userAgentCtrl = require('../controllers/useragent');
const auth = require('../middleware/auth');

router.get('/', auth, userAgentCtrl.getUserAgent);
router.post('/', auth, userAgentCtrl.createUserAgent);
router.patch('/', auth, userAgentCtrl.updateUserAgent);

module.exports = router;
