const express = require('express');

const router = express.Router();
const jobCtrl = require('../controllers/job');

router.get('/', jobCtrl.getAllJobs);
router.get('/last7days', jobCtrl.getAllJobsLast7Days);
router.get('/:JobId', jobCtrl.getOneJob);

module.exports = router;
