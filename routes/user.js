const express = require('express');

const router = express.Router();
const userCtrl = require('../controllers/user');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

router.post('/signup', multer, userCtrl.signup);
router.post('/login', userCtrl.login);
router.post('/forgot', userCtrl.forgot);
router.post('/forgot/modify', userCtrl.forgotModify);
router.get('/', auth, userCtrl.getAllUsers);
router.post('/', auth, multer, userCtrl.createUser);
router.get('/me', auth, userCtrl.getMyUser);
router.get('/:UserId', auth, userCtrl.getOneUser);
router.patch('/:UserId', auth, multer, userCtrl.modifyOneUser);
router.delete('/:UserId', userCtrl.deleteOneUser);

module.exports = router;
