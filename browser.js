const puppeteer = require('puppeteer');

exports.getBrowser = async () =>
  // eslint-disable-next-line no-return-await
  await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
  });
