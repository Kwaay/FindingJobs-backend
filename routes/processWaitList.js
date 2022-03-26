const express = require('express');
const PECtrl = require('../controllers/pole-emploi');
const WTTJCtrl = require('../controllers/welcometothejungle');
const processWaitListCtrl = require('../controllers/processWaitList');

processWaitListCtrl.addController(PECtrl);
processWaitListCtrl.addController(WTTJCtrl);

const router = express.Router();

router.get('/', processWaitListCtrl.selectControllers);

module.exports = router;
