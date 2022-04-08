const express = require('express');

const router = express.Router();
const userCtrl = require('../controllers/user');

router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);
router.post('/forgot', userCtrl.forgot);
router.post('/forgot/modify', userCtrl.forgotModify);
router.get('/', userCtrl.getAllUsers);
router.post('/', userCtrl.createUser);
router.get('/me', userCtrl.getMyUser);
router.get('/:UserId', userCtrl.getOneUser);
router.patch('/:UserId', userCtrl.modifyOneUser);
router.delete('/:UserId', userCtrl.deleteOneUser);

module.exports = router;
