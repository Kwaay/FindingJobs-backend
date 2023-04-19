/* eslint-disable operator-linebreak */
const striptags = require('striptags');
const { Op } = require('sequelize');
const { getBrowser } = require('../browser');
const Logger = require('../lib/Logger');

const { WaitList, Stack, Job, UserAgent } = require('../models');

const regexContract =
  /((?:Contrat [à])|(?:Mission intérimaire))(?:[- ]+)(|(?:durée (?:in)?déterminée)?)+((?: - )?(?:\d)+ ?(?:Jour(\(s\))|mois|an[s]?))?/gim;
const regexStudy =
  /(?:Bac[ ]?\+\d(?:[,]? )?)+(?:(?:et|ou)(?: plus ou)? équivalents(?: [a-z]+)?)?/gim;
const regexType = /(?:[0-9][0-9]H[0-9]?[0-9]? (Horaires normaux))/gim;
const regexSalary =
  /((?:Primes)|(?:((?:a|à) n(?:é|e)gocier))|(?:Selon ((?:le |l'|votre )?(?:exp(?:e|é)rience(?:s)?|profil|(?:â|a)ge| formation | niveau d'(?:e|é)tudes|dipl(?:o|ô)me|comp(?:é|e)tence(s)?)(?: ou| et| \+|\/)?(?: exp(?:e|é)rience| profil| (?:a|â)ge| formation| niveau d'(?:e|é)tudes| dipl(?:o|ô)me|comp(?:é|e)tence(?:s)?)?))|(?:[\d,]+ (?:€|Euros)(?: à [\d,]+ (?:€|Euros))?))/gim;
// eslint-enable operator-linebreak */

const temporaryWaitList = [];
/* eslint no-console: ["error", { allow: ["log"] }] */

exports.applyTo = async (item) => (await item.origin) === 'PE';

async function deleteUnavailable() {
  try {
    const jobsUnavailableList = await Job.findAll({
      where: {
        name: {
          [Op.substring]: 'plus en ligne',
        },
      },
    });
    if (jobsUnavailableList) {
      if (jobsUnavailableList.length < 2) {
        const deleteJob = await Job.destroy({
          where: { id: jobsUnavailableList[0].id },
        });
        if (deleteJob) {
          return '✅ The job unavailable have been deleted successfully';
        }
        return '❌ An error has occurred while deleting the unavailable job';
      }
      jobsUnavailableList.forEach(async (job) => {
        const deleteJob = await Job.destroy({ where: { id: job.id } });
        if (deleteJob) {
          return '✅ All Jobs unavailable have been deleted successfully';
        }
        return '❌ An error has occurred while deleting the unavailable jobs';
      });
      return false;
    }
    return true;
  } catch (error) {
    return '❌ Impossible to get Jobs';
  }
}

function moreBtn(page) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const hasMoreButton = await page.evaluate(() => {
      const moreBtnSelect = document.querySelector('#zoneAfficherPlus > p > a');
      if (moreBtnSelect) {
        moreBtnSelect.click();
        return true;
      }
      return false;
    });
    if (hasMoreButton === true) {
      await moreBtn(page);
    }
    resolve();
  });
}

async function crawlResults(browser, URL) {
  Logger.launch('Launching PE Parsing');
  deleteUnavailable();
  // eslint-disable-next-line no-async-promise-executor
  const page = await browser.newPage();
  const userAgent = await UserAgent.findOne({ where: { id: 1 } });
  if (!userAgent) {
    return '404';
  }
  const userAgentSource = JSON.stringify(userAgent.useragent);
  await page.setUserAgent(userAgentSource);
  await page.goto(URL, { waitUntil: 'networkidle2' });
  Logger.wait('Waiting for Network idle');
  await new Promise((resolve2) => {
    setTimeout(resolve2, 10000);
  });
  Logger.success('Network idling');
  Logger.wait('Checking for buttons to load all jobs');
  await moreBtn(page);
  Logger.success('✅ - All jobs loaded');
  const links = await page.evaluate(() => {
    const elements = Array.from(
      document.querySelectorAll('a[class="media with-fav"]'),
    );
    const linksElement = elements.map((element) => element.href);
    return linksElement;
  });
  links.forEach(async (link) => {
    const checkifExistsInWaitList = await WaitList.findOne({
      where: {
        url: link,
        origin: 'PE',
      },
    });
    const checkIfExistsInJobs = await Job.findOne({
      where: {
        link,
        origin: 'PE',
      },
    });
    if (checkifExistsInWaitList || checkIfExistsInJobs) return;
    await WaitList.create({
      url: link,
      origin: 'PE',
    });
    temporaryWaitList.push(link);
  });
  setTimeout(() => {
    Logger.end(`Finished Parse PE with ${temporaryWaitList.length} results`);
  }, 5000);
  return true;
}

async function findStacks(HTML) {
  const stacks = await Stack.findAll({ where: { visibility: true } });
  const presentStacks = [];
  stacks.forEach(async (stack) => {
    const regex = new RegExp(`(${stack.regex})`, 'gmi');
    const search = regex.test(HTML);
    if (search) {
      presentStacks.push(stack);
    }
  });
  return presentStacks;
}
const getHTML = (browser, URL, res) =>
  // eslint-disable-next-line no-async-promise-executor , implicit-arrow-linebreak
  new Promise(async (resolve) => {
    const page = await browser.newPage();
    Logger.wait('Fetching page data');
    const userAgent = await UserAgent.findOne({ where: { id: 1 } });
    if (!userAgent) {
      // eslint-disable-next-line no-promise-executor-return
      return res.status(404).json({ message: 'UserAgent not found' });
    }
    const userAgentSource = JSON.stringify(userAgent.useragent);
    await page.setUserAgent(userAgentSource);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 0 });
    const name = await page.evaluate(() => {
      const nameElement = document.querySelector('h1');
      if (nameElement) {
        return nameElement.innerText;
      }
      return 'Non-indiqué';
    });
    const region = await page.evaluate(() => {
      const regionElement = document.querySelector(
        '#contents > div > div > div > div > div > div > div > div > div > p > span:nth-child(1) > span:nth-child(5)',
      );
      if (regionElement) {
        return regionElement.innerText.replace(/\s/g, ' ');
      }
      return 'Non-indiqué';
    });
    const exp = await page.evaluate(() => {
      const expElement = document.querySelector(
        '#contents > div > div > div > div > div > div > div > div > div > ul > li > span > span.skill-name',
      );
      if (expElement) {
        return expElement.innerText.replace(/\s/g, ' ');
      }
      return 'Non-indiqué';
    });
    const content = await page.evaluate(async () => {
      const paragraph = document.querySelector(
        'main div.modal-content div div',
      );
      if (paragraph) {
        return paragraph.innerText.replace(/\s/g, ' ');
      }
      return 'Non-indiqué';
    });
    const contract = (content.match(regexContract) || ['Non-indiqué'])[0];
    const splitContract = content.split(contract).join('');
    const study = (splitContract.match(regexStudy) || ['Non-indiqué'])[0];
    const splitStudy = splitContract.split(study).join('');
    const type = (splitStudy.match(regexType) || ['Non-indiqué'])[0];
    const splitType = splitStudy.split(type).join('');
    const salary = (splitType.match(regexSalary) || ['Non-indiqué'])[0];
    const splitSalary = splitType.split(salary).join('');
    const sContent = striptags(splitSalary).toLowerCase();
    await page.close();
    Logger.success('Page data fetched');
    const presentStacks = await findStacks(sContent);
    const jobCreate = await Job.create({
      name,
      location: region,
      link: URL,
      contract,
      salary,
      remote: 'Non-indiqué',
      exp,
      study,
      start: 'Non-indiqué',
      type,
      origin: 'PE',
    });
    const stacksRelations = [];
    presentStacks.forEach((stack) => {
      stacksRelations.push(jobCreate.addStack(stack));
    });
    await Promise.all(stacksRelations);

    resolve();
    // eslint-disable-next-line no-promise-executor-return
    return true;
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
      limit: 10,
      where: {
        origin: 'PE',
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
    'https://candidat.pole-emploi.fr/offres/recherche?motsCles=D%C3%A9veloppeur&offresPartenaires=true&rayon=10&tri=0',
  );

  await browser.close();
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
    'https://candidat.pole-emploi.fr/offres/recherche?motsCles=D%C3%A9veloppeur&offresPartenaires=true&rayon=10&tri=0',
  );
  await getData(browser);
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  await browser.close();
  return res.status(200).json({
    message: `⌚ - Time elapsed : ${millisToMinutesAndSeconds(timeElapsed)}`,
  });
};
