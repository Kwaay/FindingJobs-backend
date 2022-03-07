const express = require("express");

const router = express.Router();
const stackCtrl = require("../controllers/stack");

router.get("/", stackCtrl.getAllStacks);
router.post("/", stackCtrl.createStack);
router.get("/:StackId", stackCtrl.getOneStack);
router.patch("/:StackId", stackCtrl.updateOneStack);
router.delete("/:StackId", stackCtrl.deleteOneStack);

module.exports = router;
