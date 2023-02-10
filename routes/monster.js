const express = require('express');

const router = express.Router();
const monsterCtrl = require('../controllers/monster');
const auth = require('../middleware/auth');

router.get('/reload', auth, monsterCtrl.reloadOffers);

module.exports = router;
