const { WaitList } = require('../models');
const { getBrowser } = require('../browser');

const controllers = [];

exports.selectControllers = async (req, res) => {
  const waitList = await WaitList.findAll({
    limit: 20,
  });
  if (!waitList) {
    return res
      .status(500)
      .json({ message: 'Cannot get WaitList. Please try again' });
  }
  const browser = await getBrowser();
  console.log(browser);
  waitList.forEach((item) => {
    controllers.forEach((ctrl) => {
      if (ctrl.applyTo(item)) {
        ctrl.getHTML(browser, item.url);
        WaitList.destroy({ where: { id: item.id } });
      }
    });
  });
  return true;
};

exports.addController = (ctrl) => {
  controllers.push(ctrl);
};
