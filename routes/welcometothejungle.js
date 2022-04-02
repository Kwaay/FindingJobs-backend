const express = require('express');

const router = express.Router();
const WTTJCtrl = require('../controllers/welcometothejungle');

router.get('/links', WTTJCtrl.getAllLinks);
router.get('/stacks', WTTJCtrl.findData);
router.get('/reload', WTTJCtrl.reloadOffers);

module.exports = router;
