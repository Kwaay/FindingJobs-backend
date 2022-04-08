const { Op } = require('sequelize');
const { Job } = require('../models');

exports.getAllJobs = async (req, res) => {
  const findAllJobs = await Job.findAll({
    order: [['createdAt', 'ASC']],
  });
  if (!findAllJobs) {
    return res.status(500).json({
      message:
        'Something happened during the getAllJobs process, please try again',
    });
  }
  return res.status(200).json(findAllJobs);
};
exports.getAllJobsLast7Days = async (req, res) => {
  try {
    const datetime = new Date();
    datetime.setDate(datetime.getDate() - 1);
    const format = datetime
      .toISOString()
      .replace('Z', '')
      .replace('T', ' ')
      .slice(0, 19);
    const findAllJobsLast7Days = await Job.findAll({
      where: {
        createdAt: {
          [Op.gt]: format,
        },
      },
    });
    if (findAllJobsLast7Days) {
      return res.status(200).json(findAllJobsLast7Days);
    }
  } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during the getAllJobsLast7Days process, please try again',
    });
  }
  return false;
};
exports.getOneJob = async (req, res) => {
  const findOneJob = await Job.findOne({
    where: { id: req.params.JobId },
  });
  if (!findOneJob) {
    return res.status(404).json({ message: 'Job not found' });
  }
  return res.status(200).json(findOneJob);
};
