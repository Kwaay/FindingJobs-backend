const express = require('express');

const router = express.Router();
const monsterCtrl = require('../controllers/monster');

router.get('/links', monsterCtrl.getAllLinks);
router.get('/stacks', monsterCtrl.findAllStacks);
router.get('/reload', monsterCtrl.reloadOffers);

module.exports = router;
