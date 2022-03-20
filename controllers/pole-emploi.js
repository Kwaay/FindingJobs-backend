/* eslint-disable operator-linebreak */
const puppeteer = require('puppeteer');
const striptags = require('striptags');
const fetch = require('node-fetch');

const { WaitList, Stack, Job } = require('../models');

const regexType =
  /((Temps?[ .-]?Partiel?|Autres|BEP|CAP|CDI|CDD|Freelance|Alternance|Stage)[ .-/]?([ .-/]?[ .-/]?(?:Temporaire)?[ .-]?)(\((.*)\))?)/gim;
const regexStart =
  /(Début[ .-]?[:]?\s{2,}?[0-9]?[0-9]?[ .-]?[JFMASOND]?[aévuoce]?[vriûptcn]?[vrsinltoet]?[ilmbe]?[emrb]?[rtbe]?[er]?[e]?[[ .-]?[0-9]?[0-9]?[0-9]?[0-9]?)[ .-]?()/gim;
const regexStudy =
  /(CAP|BEP|[<>]?[ .-]?Bac[ .-][+][0-9][ .-]?[ .-/][ .-]?Master|Sans[ .-]?Diplôme|[<>]?[ .-]?Bac[ .-]?[+]?[ .-]?[0-9]?[ .-]?[ .-/]?[ .-]?(?:Doctorat)?)/gim;
const regexExperience =
  /([><][ .-]?[0-9]?[ .-]?[0-9]?[ .-]?an[s]?|[><][ .-]?[0-9]?[ .-]?[0-9]?[ .-]?mois)/gim;
const regexRemote =
  /(Télétravail[ .-]?ponctuel[ .-]?autorisé|Télétravail[ .-]?partiel[ .-]? possible|Télétravail[ .-]?total[ .-]?possible)/gim;
const regexSalary =
  /(Salaire[ .-]?entre[ .-]?[0-9]?[0-9]?[,]?[0-9]?[0-9]?[KM]?[ .-]?[€]?[ .-]?[e]?[t]?[ .-]?[0-9]?[0-9]?[,]?[0-9]?[0-9]?[KM]?[ .-]?[€]?[ .-]?[/]?[ .-]?(?:mois)?(?:jour)?|Salaire[ .-]?[:]?[ .-]?[0-9]?[ ,.-]?[0-9]?[ .-]?[0-9][KM]?[ .-]?[€]?[ .-]?[/]?[ .-]?(?:mois)?(?:jour)?)/gim;
// eslint-enable operator-linebreak */

const temporaryWaitList = [];
/* eslint no-console: ["error", { allow: ["log"] }] */

/**
 * @param page
 */
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

async function parsePEResults(browser, URL, req) {
  console.log('🚀 - Launching PE Parsing');
  // eslint-disable-next-line no-async-promise-executor
  const page = await browser.newPage();
  const userAgent = req.useragent;
  console.log(userAgent);
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36',
  );
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
      document.querySelectorAll('li[data-id-offre] a'),
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
}

/**
 * @param HTML
 */
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

/**
 * @param browser
 * @param URL
 */
async function getHTML(browser, URL) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const page = await browser.newPage();
    console.log('⏱️ - Fetching page data');
    await page.goto(URL, { timeout: 0 });
    const name = await page.evaluate(() => {
      const nameElement = document.querySelector('h1');
      if (nameElement) {
        return nameElement.innerText;
      }
      return 'Non-indiqué';
    });
    const region = await page.evaluate(() => {
      const regionElement = document.querySelector(
        'main div div div div ul.sc-1lvyirq-4.hengos',
      );
      if (regionElement) {
        return regionElement.innerText.replace(/\s/g, ' ');
      }
      return 'Non-indiqué';
    });
    const type = (region.match(regexType) || ['Non-indiqué'])[0];
    const splitType = region.split(type).join('');
    const start = (splitType.match(regexStart) || ['Non-indiqué'])[0];
    const splitStart = splitType.split(start).join('');
    const study = (splitStart.match(regexStudy) || ['Non-indiqué'])[0];
    const splitStudy = splitStart.split(study).join('');
    const exp = (splitStudy.match(regexExperience) || ['Non-indiqué'])[0];
    const splitExp = splitStudy.split(exp).join('');
    const remote = (splitExp.match(regexRemote) || ['Non-indiqué'])[0];
    const splitRemote = splitExp.split(remote).join('');
    const salary = (splitRemote.match(regexSalary) || ['Non-indiqué'])[0];
    const splitSalary = splitRemote.split(salary).join('');
    const location = splitSalary.trim() || 'Non-indiqué';
    const content = await page.evaluate(async () => {
      const paragraph = document.querySelector(
        'main div section[data-testid="job-section-description"] ',
      );
      if (paragraph) {
        return paragraph.innerHTML;
      }
      return 'Non-indiqué';
    });
    const sContent = striptags(content).toLowerCase();
    await page.close();
    console.log('✅ - Page data fetched');
    const presentStacks = await findStacks(sContent);
    const jobCreate = await Job.create({
      name,
      location,
      link: URL,
      type,
      salary,
      remote,
      exp,
      study,
      start,
      origin: 'WTTJ',
    });
    const stacksRelations = [];
    presentStacks.forEach((stack) => {
      stacksRelations.push(jobCreate.addStack(stack));
    });
    await Promise.all(stacksRelations);
    resolve();
  });
}

/**
 * @param millis
 */
function millisToMinutesAndSeconds(millis) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return seconds === 60
    ? `${minutes + 1}:00`
    : `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * @param iterations
 */
async function getStacks(iterations = 1) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const findAllLinks = await WaitList.findAll({
      limit: 10,
    });
    if (findAllLinks.length < 1) {
      console.log('🎉 - No more links');
      resolve();
      return;
    }
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const promises = [];
    findAllLinks.forEach(async (link) => {
      await promises.push(getHTML(browser, link.url));
      await WaitList.destroy({ where: { id: link.id } });
    });
    await Promise.all(promises);
    await getStacks(iterations + 1);
    await browser.close();
    resolve();
  });
}
exports.getAllLinks = async (req, res) => {
  (async () => {
    const startTime = Date.now();
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--headless', '--disable-gpu'],
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
  await getStacks();
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
    `${baseURL}?aroundQuery=&attributesToRetrieve%5B0%5D=%2A&attributesToRetrieve%5B1%5D=-_geoloc&attributesToRetrieve%5B2%5D=-department&attributesToRetrieve%5B3%5D=-language&attributesToRetrieve%5B4%5D=-profession_name&attributesToRetrieve%5B5%5D=-profile&attributesToRetrieve%5B6%5D=-sectors&attributesToRetrieve%5B7%5D=-contract_type_names.en&attributesToRetrieve%5B8%5D=-organization.cover_image.en&attributesToRetrieve%5B9%5D=-organization.size.en&attributesToRetrieve%5B10%5D=-profession.category.en&attributesToRetrieve%5B11%5D=-profession.name.en&attributesToRetrieve%5B12%5D=-sectors_name.en&attributesToRetrieve%5B13%5D=-contract_type_names.es&attributesToRetrieve%5B14%5D=-organization.cover_image.es&attributesToRetrieve%5B15%5D=-organization.size.es&attributesToRetrieve%5B16%5D=-profession.category.es&attributesToRetrieve%5B17%5D=-profession.name.es&attributesToRetrieve%5B18%5D=-sectors_name.es&attributesToRetrieve%5B19%5D=-contract_type_names.cs&attributesToRetrieve%5B20%5D=-organization.cover_image.cs&attributesToRetrieve%5B21%5D=-organization.size.cs&attributesToRetrieve%5B22%5D=-profession.category.cs&attributesToRetrieve%5B23%5D=-profession.name.cs&attributesToRetrieve%5B24%5D=-sectors_name.cs&attributesToRetrieve%5B25%5D=-contract_type_names.sk&attributesToRetrieve%5B26%5D=-organization.cover_image.sk&attributesToRetrieve%5B27%5D=-organization.size.sk&attributesToRetrieve%5B28%5D=-profession.category.sk&attributesToRetrieve%5B29%5D=-profession.name.sk&attributesToRetrieve%5B30%5D=-sectors_name.sk&page=1&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Fullstack&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Backend&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Frontend&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=DevOps%20%2F%20Infra`,
  );
  await getStacks();
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  return res.status(200).json({
    message: `⌚ - Time elapsed : ${millisToMinutesAndSeconds(timeElapsed)}`,
  });
};
