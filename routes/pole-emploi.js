const express = require('express');

const router = express.Router();
const PECtrl = require('../controllers/pole-emploi');
const auth = require('../middleware/auth');

router.get('/reload', auth, PECtrl.reloadOffers);

module.exports = router;
