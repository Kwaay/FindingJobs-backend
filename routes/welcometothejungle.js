const express = require("express");

const router = express.Router();
const WTTJCtrl = require("../controllers/welcometothejungle");

router.get("/links", WTTJCtrl.GetAllLinks);

module.exports = router;
