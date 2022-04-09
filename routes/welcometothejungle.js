const express = require('express');

const router = express.Router();
const WTTJCtrl = require('../controllers/welcometothejungle');
const auth = require('../middleware/auth');

router.get('/reload', auth, WTTJCtrl.reloadOffers);

module.exports = router;
