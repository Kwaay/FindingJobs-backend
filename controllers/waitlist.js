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
  for (const ctrl of controllers) {
    await ctrl.getAllLinks();
  }
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  console.log(
    `✅ - Crawl successfully completed in ${millisToMinutesAndSeconds(
      timeElapsed,
    )}`,
  );
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
      where: { origin: 'WTTJ' },
    });
    if (!waitList) {
      console.log(`🎉 - WaitList successfully proceded`);
      return resolve();
    }
    const promises = [];
    for (const item of waitList) {
      for (const ctrl of controllers) {
        console.log(await ctrl.applyTo(item), item);
        if (await ctrl.applyTo(item)) {
          await promises.push(ctrl.getHTML(browser, item.url));
          await WaitList.destroy({ where: { id: item.id } });
        }
      }
    }
    await Promise.all(promises);
    if (waitList.length > 1) {
      await processLinks(browser, iterations + 1);
    }
    return resolve();
  });
}

exports.selectControllers = async (req, res) => {
  const startTime = Date.now();
  const browser = await getBrowser();
  await processLinks(browser);
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  await browser.close();
  console.log(
    `✅ - WaitList successfully proceded in ${millisToMinutesAndSeconds(
      timeElapsed,
    )}`,
  );
  return res.status(200).json({
    message: `✅ - WaitList successfully proceded in ${millisToMinutesAndSeconds(
      timeElapsed,
    )}`,
  });
};

exports.addController = (ctrl) => {
  controllers.push(ctrl);
};
