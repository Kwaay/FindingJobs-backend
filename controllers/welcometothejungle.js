/* eslint-disable operator-linebreak */
const striptags = require('striptags');
const { getBrowser } = require('../browser');
const Logger = require('../lib/Logger');

const { WaitList, Stack, Job, UserAgent } = require('../models');

const regexContract =
  /((Temps?[ .-]?Partiel?|Autres|BEP|CAP|CDI|CDD|Freelance|Alternance|Stage)[ .-/]?([ .-/]?[ .-/]?(?:Temporaire)?[ .-]?)(\((.*)\))?)/gim;
const regexStart =
  /(Début[ .-]?:[ .-]?(\d{0,2})[ .-]?(?:[a-zéû]+)[ .-]?(\d{2,4}))/gim;
const regexStudy =
  / (CAP|Non spécifié|BEP|[<>]?[ .-]?Bac[ .-][+][0-9][ .-]?[ .-/][ .-]?Master|Sans[ .-]?Diplôme|[<>]?[ .-]?Bac[ .-]?[+]?[ .-]?[0-9]?[ .-]?[ .-/]?[ .-]?(?:Doctorat)?)/gim;
const regexExperience =
  /([><][ .-]?[0-9]?[ .-]?[0-9]?[ .-]?an[s]?|[><][ .-]?[0-9]?[ .-]?[0-9]?[ .-]?mois)/gim;
const regexRemote =
  /(Télétravail[ .-]?ponctuel[ .-]?autorisé|Télétravail[ .-]?partiel[ .-]? possible|Télétravail[ .-]?total[ .-]?possible)/gim;
const regexSalary = /([\d]+(K)? €(?: et )?([\d]+K €)?)/gm;
const regexClear = /(Expérience[ .-]:|Éducation[ .-]:|Salaire[ .-]entre)/gm;
// eslint-enable operator-linebreak */

const temporaryWaitList = [];
const baseURL = 'https://www.welcometothejungle.com/fr/jobs';
/* eslint no-console: ['error', { allow: ['log'] }] */

exports.applyTo = async (item) => (await item.origin) === 'WTTJ';

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
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

async function crawlResults(browser, URL, page, iterations = 1) {
  if (iterations === 1) {
    Logger.start('Launching Parse Welcome to the Jungle Results');
  }
  // eslint-disable-next-line no-async-promise-executor, consistent-return
  return new Promise(async (resolve) => {
    Logger.info(`Fetching results from page #${iterations}`);
    const userAgent = await UserAgent.findOne({ where: { id: 1 } });
    if (!userAgent) {
      // eslint-disable-next-line no-promise-executor-return
      return '404';
    }

    const userAgentSource = JSON.stringify(userAgent.useragent);
    await page.setUserAgent(userAgentSource);
    await page.goto(URL, {
      timeout: 0,
    });
    Logger.wait('Waiting for Network idle');
    await new Promise((resolve2) => {
      setTimeout(resolve2, 10000);
    });
    Logger.success('Network idling');
    Logger.wait('Waiting for scroll');
    await autoScroll(page);
    Logger.success('Page scroll complete');
    const links = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('li > article > div > a'),
      );
      const linksElement = elements.map((element) => element.href);
      return linksElement;
    });
    links.forEach(async (link) => {
      const nLink = link.split('?')[0];
      const checkifExistsInWaitList = await WaitList.findOne({
        where: {
          url: nLink,
          origin: 'WTTJ',
        },
      });
      const checkIfExistsInJobs = await Job.findOne({
        where: {
          link: nLink,
          origin: 'WTTJ',
        },
      });
      if (checkifExistsInWaitList || checkIfExistsInJobs) return;
      await WaitList.create({
        url: nLink,
        origin: 'WTTJ',
      });
      temporaryWaitList.push(nLink);
    });
    const hasNextPage = await page.evaluate(async () => {
      const activePage = document.querySelector(
        'nav[aria-label="Pagination"] ul li a[aria-current="true"]',
      );
      const listPage = activePage.parentElement;
      const nextPage = listPage.nextElementSibling;
      if (nextPage.innerText !== '') {
        const nextBtnSVG = document.querySelector(
          'nav[aria-label="Pagination"] svg[alt="Right"]',
        );
        const nextBtn = nextBtnSVG.parentElement;
        nextBtn.click();
        await new Promise((resolve3) => {
          setTimeout(resolve3, 500);
        });
        return window.location.href;
      }
      return false;
    });
    if (hasNextPage) {
      Logger.info('🚧 - Next page detected');
      await crawlResults(browser, `${hasNextPage}`, page, iterations + 1);
    } else {
      Logger.end('No more pages');
      setTimeout(() => {
        Logger.end(
          `Launching Parse Welcome to the Jungle Results with ${temporaryWaitList.length} results`,
        );
      }, 5000);
    }
    resolve();
  });
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

const getHTML = (browser, URL) =>
  // eslint-disable-next-line no-async-promise-executor
  new Promise(async (resolve) => {
    const page = await browser.newPage();
    Logger.wait('Fetching page data');
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
        ' ul[data-testid="job-header-metas"]',
      );
      if (regionElement) {
        return regionElement.innerText.replace(/\s/g, ' ');
      }
      return 'Non-indiqué';
    });
    const clear = region.replaceAll(regexClear, '');
    const contract = (clear.match(regexContract) || ['Non-indiqué'])[0];
    const splitContract = clear.split(contract).join('');
    const start = (splitContract.match(regexStart) || ['Non-indiqué'])[0];
    const splitStart = splitContract.split(start).join('');
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
        "main div section[data-testid='job-section-description'] ",
      );
      if (paragraph) {
        return paragraph.innerHTML;
      }
      return 'Non-indiqué';
    });
    const sContent = striptags(content).toLowerCase();
    await page.close();
    Logger.success('Page data fetched');
    const presentStacks = await findStacks(sContent);
    const jobCreate = await Job.create({
      name,
      location,
      link: URL,
      contract,
      salary,
      remote,
      exp,
      study,
      start,
      type: 'Non-indiqué',
      origin: 'WTTJ',
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
      limit: 10,
      where: {
        origin: 'WTTJ',
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
    Logger.info('🎉 - No more links');
  });
};
exports.getData = getData;

const getAllLinks = async () => {
  const startTime = Date.now();
  const browser = await getBrowser();
  const page = await browser.newPage();
  await crawlResults(
    browser,
    `${baseURL}?aroundQuery=&attributesToRetrieve%5B0%5D=%2A&attributesToRetrieve%5B1%5D=-_geoloc&attributesToRetrieve%5B2%5D=-department&attributesToRetrieve%5B3%5D=-language&attributesToRetrieve%5B4%5D=-profession_name&attributesToRetrieve%5B5%5D=-profile&attributesToRetrieve%5B6%5D=-sectors&attributesToRetrieve%5B7%5D=-contract_type_names.en&attributesToRetrieve%5B8%5D=-organization.cover_image.en&attributesToRetrieve%5B9%5D=-organization.size.en&attributesToRetrieve%5B10%5D=-profession.category.en&attributesToRetrieve%5B11%5D=-profession.name.en&attributesToRetrieve%5B12%5D=-sectors_name.en&attributesToRetrieve%5B13%5D=-contract_type_names.es&attributesToRetrieve%5B14%5D=-organization.cover_image.es&attributesToRetrieve%5B15%5D=-organization.size.es&attributesToRetrieve%5B16%5D=-profession.category.es&attributesToRetrieve%5B17%5D=-profession.name.es&attributesToRetrieve%5B18%5D=-sectors_name.es&attributesToRetrieve%5B19%5D=-contract_type_names.cs&attributesToRetrieve%5B20%5D=-organization.cover_image.cs&attributesToRetrieve%5B21%5D=-organization.size.cs&attributesToRetrieve%5B22%5D=-profession.category.cs&attributesToRetrieve%5B23%5D=-profession.name.cs&attributesToRetrieve%5B24%5D=-sectors_name.cs&attributesToRetrieve%5B25%5D=-contract_type_names.sk&attributesToRetrieve%5B26%5D=-organization.cover_image.sk&attributesToRetrieve%5B27%5D=-organization.size.sk&attributesToRetrieve%5B28%5D=-profession.category.sk&attributesToRetrieve%5B29%5D=-profession.name.sk&attributesToRetrieve%5B30%5D=-sectors_name.sk&page=1&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Fullstack&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Backend&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Frontend&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=DevOps%20%2F%20Infra`,
    page,
  );
  await browser.close();
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  return millisToMinutesAndSeconds(timeElapsed);
};
exports.getAllLinks = getAllLinks;

exports.reloadOffers = async (req, res) => {
  const startTime = Date.now();
  const browser = await getBrowser();
  await crawlResults(
    browser,
    `${baseURL}?aroundQuery=&attributesToRetrieve%5B0%5D=%2A&attributesToRetrieve%5B1%5D=-_geoloc&attributesToRetrieve%5B2%5D=-department&attributesToRetrieve%5B3%5D=-language&attributesToRetrieve%5B4%5D=-profession_name&attributesToRetrieve%5B5%5D=-profile&attributesToRetrieve%5B6%5D=-sectors&attributesToRetrieve%5B7%5D=-contract_type_names.en&attributesToRetrieve%5B8%5D=-organization.cover_image.en&attributesToRetrieve%5B9%5D=-organization.size.en&attributesToRetrieve%5B10%5D=-profession.category.en&attributesToRetrieve%5B11%5D=-profession.name.en&attributesToRetrieve%5B12%5D=-sectors_name.en&attributesToRetrieve%5B13%5D=-contract_type_names.es&attributesToRetrieve%5B14%5D=-organization.cover_image.es&attributesToRetrieve%5B15%5D=-organization.size.es&attributesToRetrieve%5B16%5D=-profession.category.es&attributesToRetrieve%5B17%5D=-profession.name.es&attributesToRetrieve%5B18%5D=-sectors_name.es&attributesToRetrieve%5B19%5D=-contract_type_names.cs&attributesToRetrieve%5B20%5D=-organization.cover_image.cs&attributesToRetrieve%5B21%5D=-organization.size.cs&attributesToRetrieve%5B22%5D=-profession.category.cs&attributesToRetrieve%5B23%5D=-profession.name.cs&attributesToRetrieve%5B24%5D=-sectors_name.cs&attributesToRetrieve%5B25%5D=-contract_type_names.sk&attributesToRetrieve%5B26%5D=-organization.cover_image.sk&attributesToRetrieve%5B27%5D=-organization.size.sk&attributesToRetrieve%5B28%5D=-profession.category.sk&attributesToRetrieve%5B29%5D=-profession.name.sk&attributesToRetrieve%5B30%5D=-sectors_name.sk&page=1&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Fullstack&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Backend&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Frontend&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=DevOps%20%2F%20Infra`,
  );
  await getData(browser);
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  return res.status(200).json({
    message: `⌚ - Time elapsed : ${millisToMinutesAndSeconds(timeElapsed)}`,
  });
};
