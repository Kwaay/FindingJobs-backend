/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { WaitList } = require('../models');
const { getBrowser } = require('../browser');

const controllers = [];

function millisToMinutesAndSeconds(millis) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return seconds === 60
    ? `${minutes + 1}:00`
    : `${minutes}m${seconds < 10 ? '0' : ''}${seconds}`;
}

exports.crawl = async (req, res) => {
  const startTime = Date.now();
  // eslint-disable-next-line no-restricted-syntax
  for (const ctrl of controllers) {
    // eslint-disable-next-line no-await-in-loop
    await ctrl.getAllLinks();
  }
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  return res.status(200).json({
    message: `✅ - Crawl successfully completed in ${millisToMinutesAndSeconds(
      timeElapsed,
    )}`,
  });
};

async function processLinks(browser, iterations = 1) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    console.log(`⚠️ - Processing links #${iterations}`);
    const waitList = await WaitList.findAll({
      limit: 10,
    });
    if (!waitList) {
      console.log(`🎉 - WaitList successfully proceded`);
      // eslint-disable-next-line no-promise-executor-return
      return resolve();
    }
    console.log({ waitList });
    const promises = [];
    for (const item of waitList) {
      // eslint-disable-next-line no-restricted-syntax
      for (const ctrl of controllers) {
        if (await ctrl.applyTo(item)) {
          await promises.push(ctrl.getHTML(browser, item.url));
          await WaitList.destroy({ where: { id: item.id } });
        }
      }
    }
    console.log({ promises });
    await Promise.all(promises);
    if (waitList.length > 1) {
      await processLinks(browser, iterations + 1);
    }
    return resolve();
  });
}

exports.selectControllers = async (req, res) => {
  const startTime = Date.now();
  let browser = await getBrowser();
  await processLinks(browser);
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  return res.status(200).json({
    message: `✅ - WaitList successfully proceded in ${millisToMinutesAndSeconds(
      timeElapsed,
    )}`,
  });
};

exports.addController = (ctrl) => {
  controllers.push(ctrl);
};
