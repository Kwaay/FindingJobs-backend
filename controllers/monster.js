/* eslint-disable operator-linebreak */
const striptags = require('striptags');
const { getBrowser } = require('../browser');
const Logger = require('../lib/Logger');

const { WaitList, Stack, Job, UserAgent } = require('../models');

const regexContract =
  /((?:Intérim)[ /]+(?:CDD))|((?:Freelance))|((?:CDI))|((?:Stage[ /]+Apprentissage))/gim;
const regexSalary = /((?:€[\d /-]+)+Par (?:jour|an|mois))/gim;
const regexType = /(?:Temps[ ](?:(Plein|Partiel)))/gim;
// eslint-enable operator-linebreak */
const temporaryWaitList = [];
/* eslint no-console: ["error", { allow: ["log"] }] */

exports.applyTo = async (item) => (await item.origin) === 'Monster';

async function autoScroll(page, iterations) {
  if (iterations !== 1) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 30;
        const timer = setInterval(() => {
          const height = Number(document.body.scrollHeight / 10);
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= height) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  } else {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 30;
        const timer = setInterval(() => {
          const { scrollHeight } = document.body;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}

async function moreBtn(page, iterations) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const hasMoreButton = await page.evaluate(() => {
      const moreBtnSelect = document.querySelector(
        'html body div#__next div main div nav section button.sc-eCImPb.dVaZLw.ds-button',
      );
      if (moreBtnSelect) {
        if (moreBtnSelect.innerText !== 'Fin des résultats') {
          moreBtnSelect.click();
          return true;
        }
        return false;
      }
      return false;
    });
    if (hasMoreButton) {
      await autoScroll(page, iterations + 1);
      await moreBtn(page, iterations + 1);
    }

    resolve();
  });
}

async function crawlResults(browser, URL) {
  Logger.launch('Launching Monster Parsing');
  // eslint-disable-next-line no-async-promise-executor
  // eslint-disable-next-line prefer-const
  let iterations = 1;
  const page = await browser.newPage();
  const userAgent = await UserAgent.findOne();
  if (!userAgent) {
    Logger.fail(`UserAgent not found`);
    return '404 - UserAgent not found';
  }
  const userAgentSource = JSON.stringify(userAgent.useragent);
  await page.setUserAgent(userAgentSource);
  await page.goto(URL, { timeout: 0 });
  Logger.wait('Waiting for Network idle');
  await new Promise((resolve2) => {
    setTimeout(resolve2, 10000);
  });
  Logger.success('Network idling');
  Logger.wait('Waiting for auto scroll');
  await autoScroll(page, iterations);
  Logger.success('Auto scroll complete');
  Logger.wait(' Checking for buttons to load all jobs');
  await moreBtn(page, iterations);
  Logger.success('All jobs loaded');
  const links = await page.evaluate(() => {
    const elements = Array.from(
      document.querySelectorAll(
        'main > div > nav > section > div > div > div > div > div > a',
      ),
    );
    const linksElement = elements.map((element) => element.href);
    return linksElement;
  });
  links.forEach(async (link) => {
    const nLink = link.split('?')[0];
    const checkifExistsInWaitList = await WaitList.findOne({
      where: {
        url: nLink,
        origin: 'Monster',
      },
    });
    const checkIfExistsInJobs = await Job.findOne({
      where: {
        link: nLink,
        origin: 'Monster',
      },
    });
    if (checkifExistsInWaitList || checkIfExistsInJobs) return;
    await WaitList.create({
      url: nLink,
      origin: 'Monster',
    });
    temporaryWaitList.push(link);
  });
  await browser.close();
  setTimeout(() => {
    Logger.end(
      `Monster Website Parsed with ${temporaryWaitList.length} results`,
    );
  }, 5000);
  return true;
}

async function findStacks(HTML) {
  const stacks = await Stack.findAll({ where: { visibility: true } });
  const presentStacks = [];
  stacks.forEach(async (stack) => {
    const regex = new RegExp(stack.regex, 'gmi');
    const search = regex.test(HTML);
    if (search) {
      presentStacks.push(stack);
    }
  });
  return presentStacks;
}
const getHTML = (browser, URL) =>
  // eslint-disable-next-line no-async-promise-executor , implicit-arrow-linebreak
  new Promise(async (resolve) => {
    const page = await browser.newPage();
    Logger.wait('Fetching page data');
    await page.goto(URL, { timeout: 0 });
    const name = await page.evaluate(() => {
      const nameElement = document.querySelector('html body h1');
      if (nameElement) {
        return nameElement.innerText;
      }
      return 'Non-indiqué';
    });
    const location = await page.evaluate(() => {
      const regionElement = document.querySelector('html body h3');
      if (regionElement) {
        return regionElement.innerText.replace(/\s/g, ' ');
      }
      return 'Non-indiqué';
    });
    const content = await page.evaluate(async () => {
      const paragraph = document.querySelector(
        '.jobview-containerstyles__JobViewWrapper-sc-16af7k7-1',
      );
      if (paragraph) {
        return paragraph.innerText.replace(/\s/g, ' ');
      }
      return 'Non-indiqué';
    });
    const contract = (content.match(regexContract) || ['Non-indiqué'])[0];
    const splitContract = content.split(contract).join('');
    const salary = (splitContract.match(regexSalary) || ['Non-indiqué'])[0];
    const splitSalary = splitContract.split(salary).join('');
    const type = (splitSalary.match(regexType) || ['Non-indiqué'])[0];
    const splitType = splitSalary.split(type).join('');
    const sContent = striptags(splitType).toLowerCase();
    await page.close();
    Logger.success('Page data fetched');
    const presentStacks = await findStacks(sContent);
    const jobCreate = await Job.create({
      name,
      location,
      link: URL,
      contract,
      salary,
      remote: 'Non-indiqué',
      exp: 'Non-indiqué',
      study: 'Non-indiqué',
      start: 'Non-indiqué',
      type,
      origin: 'Monster',
    });
    const stacksRelations = [];
    presentStacks.forEach((stack) => {
      stacksRelations.push(jobCreate.addStack(stack));
    });
    await Promise.all(stacksRelations);

    resolve();
  });
exports.getHTML = getHTML;

function millisToMinutesAndSeconds(millis) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return seconds === 60
    ? `${minutes + 1}:00`
    : `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

const getData = async (browser, iterations = 1) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const findAllLinks = await WaitList.findAll({
      limit: 8,
      where: {
        origin: 'Monster',
      },
    });
    const promises = [];
    findAllLinks.forEach(async (link) => {
      await promises.push(getHTML(browser, link.url));
      await WaitList.destroy({ where: { id: link.id } });
    });
    await Promise.all(promises);
    if (findAllLinks.length > 1) {
      await getData(browser, iterations + 1);
    }
    resolve();
    Logger.end('No more links');
  });
};
exports.getData = getData;

const getAllLinks = async () => {
  const startTime = Date.now();
  const browser = await getBrowser();
  await crawlResults(
    browser,
    'https://www.monster.fr/emploi/recherche?q=D%C3%A9veloppeur&where=&page=1',
  );
  // await browser.close();
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  return timeElapsed;
};
exports.getAllLinks = getAllLinks;

exports.reloadOffers = async (req, res) => {
  const startTime = Date.now();
  const browser = await getBrowser();
  await crawlResults(
    browser,
    'https://www.monster.fr/emploi/recherche?q=D%C3%A9veloppeur&where=&page=1',
  );
  await getData(browser);
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  return res.status(200).json({
    message: `⌚ - Time elapsed : ${millisToMinutesAndSeconds(timeElapsed)}`,
  });
};
