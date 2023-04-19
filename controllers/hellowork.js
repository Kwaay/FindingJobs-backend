/* eslint-disable no-irregular-whitespace */
/* eslint-disable operator-linebreak */
const { getBrowser } = require('../browser');
const Logger = require('../lib/Logger');

const { WaitList, Stack, Job, UserAgent } = require('../models');

const regexContract =
  /((?<contrat>Intérim|CDD|CDI|Stage|Alternance|Indépendant \/Freelance)(?:(?: - )?(?<duree>[\d]{1,3} (?<unite>jour(?:s)?|mois|an(?:s)?|semaine(?:s)?))?(?<tt>Télétravail (?:occasionnel|partiel|complet))?(?<temps>Temps (?:partiel|complet))?)+)/gm;
const regexLocation = /((?:^[0-9a-zA-ZÀ-úœ\\' -]*) - (?:[\d]{2,3}))/gm;
const regexStudy = /(BEP|CAP|Bac(?: \+[\d])?)/gm;
const regexSalary =
  /((?<nombre>(?:(?: - )?(?:[0-9  ,])*)+) EUR par (?<duree>an|mois|jour|heure))/gm;

const temporaryWaitList = [];
/* eslint no-console: ["error", { allow: ["log"] }] */

exports.applyTo = async (item) => (await item.origin) === 'Hellowork';

async function crawlResults(browser, URL, page, iterations = 1) {
  if (iterations === 1) {
    Logger.launch('Launch Hellowork Parsing');
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
      setTimeout(resolve2, 2000);
    });
    Logger.success('Network idling');
    const links = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('ul.crushed > li > div'),
      );
      const linksElement = elements.map(
        (element) =>
          `https://www.hellowork.com/fr-fr/emplois/${element.id}.html`,
      );
      return linksElement;
    });
    links.forEach(async (link) => {
      const nLink = link.split('?')[0];
      const checkifExistsInWaitList = await WaitList.findOne({
        where: {
          url: nLink,
          origin: 'Hellowork',
        },
      });
      const checkIfExistsInJobs = await Job.findOne({
        where: {
          link: nLink,
          origin: 'Hellowork',
        },
      });
      if (checkifExistsInWaitList || checkIfExistsInJobs) return;
      await WaitList.create({
        url: nLink,
        origin: 'Hellowork',
      });
      temporaryWaitList.push(nLink);
    });
    const hasNextPage = await page.evaluate(async () => {
      const nextBtn = document.querySelector('li[class="next"]');
      return !!nextBtn;
    });
    if (hasNextPage) {
      Logger.info('🚧 - Next page detected');
      Logger.debug(
        `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=D%C3%A9veloppeur&ray=all&f=Informatique_dev_hard&f=Informatique_dev&f=Informatique_syst_info&f=Informatique_syst_reseaux&d=m&p=${
          iterations + 1
        }&mode=pagination`,
      );
      await crawlResults(
        browser,
        `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=D%C3%A9veloppeur&ray=all&f=Informatique_dev_hard&f=Informatique_dev&f=Informatique_syst_info&f=Informatique_syst_reseaux&d=m&p=${
          iterations + 1
        }&mode=pagination`,
        page,
        iterations + 1,
      );
    } else {
      Logger.end('No more pages');
      setTimeout(() => {
        Logger.end(
          `Successfully parsed Hellowork with ${temporaryWaitList.length} results`,
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

const getHTML = async (browser, URL, res) => {
  // eslint-disable-next-line no-async-promise-executor , implicit-arrow-linebreak
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
  const tags = await page.evaluate(() => {
    const element = Array.from(
      document.querySelectorAll(
        'ul[class="tag-offer-list"] li:not([class="break"])',
      ),
    ).map((elem) => elem.innerText);
    if (element) {
      return element;
    }

    return 'Vide';
  });
  const content = await page.evaluate(() => {
    const unavailable = document.querySelector('.warning');
    if (unavailable) return null;

    const element = document.querySelector('.tw-typo-long-m');
    if (element) {
      const replacedElement = element.innerText.replaceAll(/\s/g, ' ');
      return replacedElement.replaceAll(/\n/g, ' ');
    }
    return false;
  });
  // eslint-disable-next-line no-promise-executor-return
  if (content === null) {
    await page.close();
    return Promise.resolve();
  }
  const name = await page.evaluate(() => {
    const nameElement = document.querySelector('h1 span');
    if (nameElement) {
      return nameElement.innerText;
    }
    return 'Non-indiqué';
  });
  const jobTags = {
    location: 'Non-indiqué',
    salary: 'Non-indiqué',
    study: 'Non-indiqué',
    contract: 'Non-indiqué',
  };
  tags.forEach(async (tag) => {
    const contract = tag.match(regexContract);
    if (contract) {
      [jobTags.contract] = contract;
      return;
    }
    const study = tag.match(regexStudy);
    if (study) {
      [jobTags.study] = study;
      return;
    }
    const salary = tag.match(regexSalary);
    if (salary) {
      [jobTags.salary] = salary;
      return;
    }
    const location = tag.match(regexLocation);
    if (location) {
      [jobTags.location] = location;
    }
  });

  await page.close();
  Logger.success('Page data fetched');

  const presentStacks = await findStacks(content);
  const jobCreate = await Job.create({
    ...jobTags,
    name,
    link: URL,
    remote: 'Non-indiqué',
    exp: 'Non-indiqué',
    start: 'Non-indiqué',
    type: 'Non-indiqué',
    origin: 'Hellowork',
  });
  const stacksRelations = [];
  presentStacks.forEach((stack) => {
    stacksRelations.push(jobCreate.addStack(stack));
  });
  await Promise.all(stacksRelations);

  Promise.resolve();
  // eslint-disable-next-line no-promise-executor-return
  return true;
};
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
  const findAllLinks = await WaitList.findAll({
    limit: 15,
    where: {
      origin: 'Hellowork',
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
  Promise.resolve();
  Logger.end('No more links');
};
exports.getData = getData;

const getAllLinks = async () => {
  const startTime = Date.now();
  const browser = await getBrowser();
  const page = await browser.newPage();
  await crawlResults(
    browser,
    'https://www.hellowork.com/fr-fr/emploi/recherche.html?k=D%C3%A9veloppeur&ray=all&f=Informatique_dev_hard&f=Informatique_dev&f=Informatique_syst_info&f=Informatique_syst_reseaux&d=m&p=1&mode=pagination',
    page,
  );

  await browser.close();
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  return timeElapsed;
};
exports.getAllLinks = getAllLinks;

// exports.reloadOffers = async (req, res) => {
//   const startTime = Date.now();
//   const browser = await getBrowser();
//   await crawlResults(
//     browser,
//     'https://candidat.pole-emploi.fr/offres/recherche?motsCles=D%C3%A9veloppeur&offresPartenaires=true&rayon=10&tri=0',
//   );
//   await getData(browser);
//   const endTime = Date.now();
//   const timeElapsed = endTime - startTime;
//   await browser.close();
//   return res.status(200).json({
//     message: `⌚ - Time elapsed : ${millisToMinutesAndSeconds(timeElapsed)}`,
//   });
// };
