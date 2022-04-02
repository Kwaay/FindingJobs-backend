const { WaitList } = require('../models');
const { getBrowser } = require('../browser');

const controllers = [];

exports.crawl = async (req, res) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const ctrl of controllers) {
    // eslint-disable-next-line no-await-in-loop
    await ctrl.getAllLinks();
  }
  return res.status(200).json({ message: `✅ - Crawl successfully completed` });
};

exports.selectControllers = async (req, res) => {
  const waitList = await WaitList.findAll({
    limit: 5,
  });
  if (!waitList) {
    return res
      .status(500)
      .json({ message: 'Cannot get WaitList. Please try again' });
  }
  const browser = await getBrowser();
  console.log(browser);
  console.log({ waitList });
  waitList.forEach(async (item) => {
    controllers.forEach(async (ctrl) => {
      if (ctrl.applyTo(item)) {
        await ctrl.findData();
        await WaitList.destroy({ where: { id: item.id } });
      }
    });
  });
  return res.status(200).json({ message: 'WaitList successfully proceded ' });
};

exports.addController = (ctrl) => {
  controllers.push(ctrl);
};
