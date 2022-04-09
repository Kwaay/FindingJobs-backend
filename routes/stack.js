const express = require('express');

const router = express.Router();
const stackCtrl = require('../controllers/stack');
const auth = require('../middleware/auth');

router.get('/', auth, stackCtrl.getAllStacks);
router.post('/', auth, stackCtrl.createStack);
router.get('/:StackId', auth, stackCtrl.getOneStack);
router.patch('/:StackId', auth, stackCtrl.updateOneStack);
router.delete('/:StackId', auth, stackCtrl.deleteOneStack);

module.exports = router;
