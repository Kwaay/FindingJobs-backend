const express = require('express');
const PECtrl = require('../controllers/pole-emploi');
const WTTJCtrl = require('../controllers/welcometothejungle');
const monsterCtrl = require('../controllers/monster');
const processWaitListCtrl = require('../controllers/waitlist');

processWaitListCtrl.addController(PECtrl);
processWaitListCtrl.addController(WTTJCtrl);
processWaitListCtrl.addController(monsterCtrl);

const router = express.Router();

router.get('/crawl', processWaitListCtrl.crawl);
router.get('/', processWaitListCtrl.selectControllers);

module.exports = router;
