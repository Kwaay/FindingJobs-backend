const express = require('express');
const PECtrl = require('../controllers/pole-emploi');
const WTTJCtrl = require('../controllers/welcometothejungle');
const monsterCtrl = require('../controllers/monster');
const processWaitListCtrl = require('../controllers/waitlist');
const auth = require('../middleware/auth');

processWaitListCtrl.addController(PECtrl);
processWaitListCtrl.addController(WTTJCtrl);
processWaitListCtrl.addController(monsterCtrl);

const router = express.Router();

router.get('/', auth, processWaitListCtrl.selectControllers);
router.get('/crawl', auth, processWaitListCtrl.crawl);

module.exports = router;
