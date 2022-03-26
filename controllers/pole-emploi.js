/* eslint-disable operator-linebreak */
const puppeteer = require('puppeteer');
const striptags = require('striptags');

const { WaitList, Stack, Job, Settings } = require('../models');

const regexType =
  /Cont(?:rat)?[ .-]+(?:(?:à)|(?: durée (?:in)?déterminée))+(?: - (?:\d)+ (?:mois|an[s]?))?/gim;
const regexStudy =
  /(?:Bac[ ]?\+\d(?:[,]? )?)+(?:(?:et|ou)(?: plus ou)? équivalents(?: [a-z]+)?)?/gim;
const regexSalary =
  /((?:Annuel |Mensuel )de [\d,]+ Euros(?: à [\d,]+ Euros)? sur [\d.,]+(?: mois| an[s]?))/gim;
const regexHours = /(?:[0-9][0-9]H[0-9]?[0-9]?)/gim;
// eslint-enable operator-linebreak */

const temporaryWaitList = [];
/* eslint no-console: ["error", { allow: ["log"] }] */

exports.applyTo = (item) => item.origin === 'PE';

function moreBtn(page) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const hasMoreButton = await page.evaluate(() => {
      const moreBtnSelect = document.querySelector('#zoneAfficherPlus > p > a');
      console.log(moreBtnSelect);
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

async function parsePEResults(browser, URL, res) {
  console.log('🚀 - Launching PE Parsing');
  // eslint-disable-next-line no-async-promise-executor
  const page = await browser.newPage();
  const userAgent = await Settings.findOne({ where: { id: 1 } });
  if (!userAgent) {
    return res.status(404).json({ message: 'UserAgent not found' });
  }
  const userAgentSource = JSON.stringify(userAgent.useragent);
  console.log(userAgentSource);
  await page.setUserAgent(userAgentSource);
  await page.goto(URL, { waitUntil: 'networkidle2' });
  console.log('⏱️ - Waiting for Network idle');
  await new Promise((resolve2) => {
    setTimeout(resolve2, 10000);
  });
  console.log('✅ - Network idling');
  console.log('⚠️ - Checking for buttons to load all jobs');
  await moreBtn(page);
  console.log('✅ - All jobs loaded');
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
  await browser.close();
  setTimeout(() => {
    console.log(
      `✅ - Launching Parse PE with ${temporaryWaitList.length} results`,
    );
  }, 5000);
  return true;
}

async function findStacks(HTML) {
  const stacks = await Stack.findAll({});
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
    console.log('⏱️ - Fetching page data');
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 0 });
    const name = await page.evaluate(() => {
      const nameElement = document.querySelector('h1');
      if (nameElement) {
        return nameElement.innerText;
      }
      return 'Non-indiqué';
    });
    console.log('name', name);
    const region = await page.evaluate(() => {
      const regionElement = document.querySelector(
        '#contents > div > div > div > div > div > div > div > div > div > p > span:nth-child(1) > span:nth-child(5)',
      );
      if (regionElement) {
        return regionElement.innerText.replace(/\s/g, ' ');
      }
      return 'Non-indiqué';
    });
    console.log('Region', region);
    const exp = await page.evaluate(() => {
      const expElement = document.querySelector(
        '#contents > div > div > div > div > div > div > div > div > div > ul > li > span > span.skill-name',
      );
      if (expElement) {
        return expElement.innerText.replace(/\s/g, ' ');
      }
      return 'Non-indiqué';
    });
    console.log('exp', exp);
    const content = await page.evaluate(async () => {
      const paragraph = document.querySelector(
        '#contents > div > div > div > div > div > div > div > div > div > div.row > div.description-aside.col-sm-4.col-md-5',
      );
      if (paragraph) {
        return paragraph.innerText.replace(/\s/g, ' ');
      }
      return 'Non-indiqué';
    });
    const type = (content.match(regexType) || ['Non-indiqué'])[0];
    const splitType = content.split(type).join('');
    const study = (splitType.match(regexStudy) || ['Non-indiqué'])[0];
    const splitStudy = splitType.split(study).join('');
    const hours = (splitStudy.match(regexHours) || ['Non-indiqué'])[0];
    const splitHours = splitStudy.split(hours).join('');
    if (splitHours.includes('Déplacements')) {
      splitHours.split('(?Déplacements=>?)');
    }
    const salary =
      JSON.stringify(splitStudy.split('Salaire :')[1]) || 'Non-indiqué';

    const sContent = striptags(splitHours).toLowerCase();
    await page.close();
    console.log('✅ - Page data fetched');
    const presentStacks = await findStacks(sContent);
    const jobCreate = await Job.create({
      name,
      location: region,
      link: URL,
      type,
      salary,
      remote: 'Non-indiqué',
      exp,
      study,
      start: 'Non-indiqué',
      hours,
      origin: 'PE',
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

async function getStacks(browser, iterations = 1) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const findAllLinks = await WaitList.findAll({
      limit: 10,
      where: {
        origin: 'PE',
      },
    });
    if (findAllLinks.length < 1) {
      console.log('🎉 - No more links');
      resolve();
      return;
    }
    const promises = [];
    findAllLinks.forEach(async (link) => {
      await promises.push(getHTML(browser, link.url));
      await WaitList.destroy({ where: { id: link.id } });
    });
    await Promise.all(promises);
    await getStacks(browser, iterations + 1);
    resolve();
  });
}
exports.getAllLinks = async (req, res) => {
  (async () => {
    const startTime = Date.now();
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-gpu'],
    });
    await parsePEResults(
      browser,
      'https://candidat.pole-emploi.fr/offres/recherche?motsCles=D%C3%A9veloppeur&offresPartenaires=true&rayon=10&tri=0',
      req,
    );

    const endTime = Date.now();
    const timeElapsed = endTime - startTime;
    return res.status(200).json({
      message: `⌚ - Time elapsed : ${millisToMinutesAndSeconds(timeElapsed)}`,
    });
  })();
};
exports.findAllStacks = async (req, res) => {
  const startTime = Date.now();
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
  });
  await getStacks(browser);
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  return res.status(200).json({
    message: `⌚ - Time elapsed : ${millisToMinutesAndSeconds(timeElapsed)}`,
  });
};

exports.reloadOffers = async (req, res) => {
  const startTime = Date.now();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  await parsePEResults(
    browser,
    'https://candidat.pole-emploi.fr/offres/recherche?motsCles=D%C3%A9veloppeur&offresPartenaires=true&rayon=10&tri=0',
  );
  await getStacks();
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  return res.status(200).json({
    message: `⌚ - Time elapsed : ${millisToMinutesAndSeconds(timeElapsed)}`,
  });
};
