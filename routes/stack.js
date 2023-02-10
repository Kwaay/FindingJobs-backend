const express = require('express');

const router = express.Router();
const stackCtrl = require('../controllers/stack');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

router.get('/', auth, stackCtrl.getAllStacks);
router.post('/', auth, multer, stackCtrl.createStack);
router.get('/:StackId', auth, stackCtrl.getOneStack);
router.patch('/:StackId', auth, multer, stackCtrl.updateOneStack);
router.delete('/:StackId', auth, stackCtrl.deleteOneStack);

module.exports = router;
