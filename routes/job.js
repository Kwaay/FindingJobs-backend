const express = require('express');

const router = express.Router();
const jobCtrl = require('../controllers/job');
const auth = require('../middleware/auth');

router.get('/', auth, jobCtrl.getAllJobs);
router.get('/last7days', auth, jobCtrl.getAllJobsLast7Days);
router.get('/:JobId', auth, jobCtrl.getOneJob);

module.exports = router;
