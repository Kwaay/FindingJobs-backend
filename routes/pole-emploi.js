const express = require('express');

const router = express.Router();
const PECtrl = require('../controllers/pole-emploi');

router.get('/links', PECtrl.getAllLinks);
router.get('/stacks', PECtrl.findData);
router.get('/reload', PECtrl.reloadOffers);

module.exports = router;
