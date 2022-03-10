const { WaitListWTTJ, Stack, Job } = require("../models");
const puppeteer = require("puppeteer");
const striptags = require("striptags");

const regexType =
  /((BEP|CAP|CDI|CDD|Freelance|Alternance|Stage)[ .-/]?([ .-/]?[ .-/]?(?:Temporaire)[ .-]?)(\((.*)\))?)/gim;
const regexStart =
  /(Début[ .-]?[:]?\s{2,}?[0-9]?[0-9]?[ .-]?[JFMASOND]?[aévuoce]?[vriûptcn]?[vrsinltoet]?[ilmbe]?[emrb]?[rtbe]?[er]?[e]?[[ .-]?[0-9]?[0-9]?[0-9]?[0-9]?)[ .-]?()/gim;
const regexStudy = /(Bac[ .-][+][0-9][ .-]?[ .-\/][ .-]?Master|Sans[ .-]?Diplôme|Bac[ .-]?[+]?[ .-]?[0-9]?)/gmi
const regexExperience =
  /([><][ .-]?[0-9][ .-]?an[s]?|[><][ .-]?[0-9]?[ .-]?[0-9]?[ .-]?mois)/gim;
const regexRemote =
  /(Télétravail[ .-]?ponctuel[ .-]?autorisé|Télétravail[ .-]?partiel[ .-]? possible|Télétravail[ .-]?total[ .-]?possible)/gim;
const regexSalary =
  /(Salaire[ .-]?entre[ .-]?[0-9]?[0-9]?[,]?[0-9]?[0-9]?[KM]?[ .-]?[€]?[ .-]?[e]?[t]?[ .-]?[0-9]?[0-9]?[,]?[0-9]?[0-9]?[KM]?[ .-]?[€]?[ .-]?[\/]?[ .-]?|Salaire[ .-]?[:]?[ .-]?[0-9]?[ ,.-]?[0-9]?[ .-]?[0-9][KM]?[ .-]?[€]?[ .-]?[/]?[ .-]?[jm]?[o]?[ui]?[rs]?)/gim;


async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
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
async function getHTML(browser, URL) {
  return new Promise(async (resolve) => {
    const page = await browser.newPage();
    console.log("⏱️ - Fetching page data");
    await page.goto(URL, { timeout: 0 });
    const name = await page.evaluate(() => {
      const nameElement = document.querySelector("main section div h1");

      return nameElement.innerText;
    });
    console.log(name);
    const region = await page.evaluate(() => {
      const regionElement = document.querySelector(
        "main div div div div ul.sc-1lvyirq-4.hengos"
      );

      return regionElement.innerText.replace(/\s/g, " ");
    });
    const type = (region.match(regexType) || ["Non-indiqué"])[0];
    const splitType = region.split(type).join("");
    const start = (splitType.match(regexStart) || ["Non-indiqué"])[0];
    const splitStart = splitType.split(start).join("");
    const study = (splitStart.match(regexStudy) || ["Non-indiqué"])[0];
    const splitStudy = splitStart.split(study).join("");
    const exp = (splitStudy.match(regexExperience) || ["Non-indiqué"])[0];
    const splitExp = splitStudy.split(exp).join("");
    const remote = (splitExp.match(regexRemote) || ["Non-indiqué"])[0];
    const splitRemote = splitExp.split(remote).join("");
    const salary = (splitRemote.match(regexSalary) || ["Non-indiqué"])[0];
    const splitSalary = splitRemote.split(salary).join("");
    const location = (splitSalary.trim() || "Non-indiqué");
    console.log(region);
    console.log(type, location, start, study, exp, remote, salary);
    const content = await page.evaluate(async () => {
      const paragraph = document.querySelector(
        'main div section[data-testid="job-section-description"] '
      );
      return paragraph.innerHTML;
    });
    const sContent = striptags(content).toLowerCase();
    console.log("✅ - Page data fetched");
    const presentStacks = findStacks(sContent);
    const jobCreate = Job.create({
      name,
      location,
      link: URL,
      type,
      salary,
      remote,
      exp,
      study,
      start
    });
    resolve();
  });
}
async function findStacks(HTML) {
  const stacks = await Stack.findAll({});
  presentStacks = [];
  stacks.forEach(async (stack) => {
    const regex = new RegExp(stack.regex, "gmi");
    const search = regex.test(HTML);
    if (search) {
      presentStacks.push(stack);
    }
  });
  return presentStacks;
}
async function getStacks(res) {
  
  const findAllLinks = await WaitListWTTJ.findAll({
    limit: 20,
  });
  if (findAllLinks.length < 1) return;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const promises = [];
  findAllLinks.forEach( async (link) => {
    promises.push(getHTML(browser, link.url));
    await WaitListWTTJ.destroy({ where: { id: link.id } });
  });
  await Promise.all(promises);
  getStacks(res)
  await browser.close();
}
const waitList = [];

exports.getAllLinks = async (req, res) => {
  const baseURL = "https://www.welcometothejungle.com/fr/jobs";
  let pageCount = 0;

  (async () => {
    const startTime = Date.now();
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    console.log("⏱️ - Launching Parse Welcome to the Jungle Results");
    await parseWTTJResults(
      browser,
      `${baseURL}?aroundQuery=&attributesToRetrieve%5B0%5D=%2A&attributesToRetrieve%5B1%5D=-_geoloc&attributesToRetrieve%5B2%5D=-department&attributesToRetrieve%5B3%5D=-language&attributesToRetrieve%5B4%5D=-profession_name&attributesToRetrieve%5B5%5D=-profile&attributesToRetrieve%5B6%5D=-sectors&attributesToRetrieve%5B7%5D=-contract_type_names.en&attributesToRetrieve%5B8%5D=-organization.cover_image.en&attributesToRetrieve%5B9%5D=-organization.size.en&attributesToRetrieve%5B10%5D=-profession.category.en&attributesToRetrieve%5B11%5D=-profession.name.en&attributesToRetrieve%5B12%5D=-sectors_name.en&attributesToRetrieve%5B13%5D=-contract_type_names.es&attributesToRetrieve%5B14%5D=-organization.cover_image.es&attributesToRetrieve%5B15%5D=-organization.size.es&attributesToRetrieve%5B16%5D=-profession.category.es&attributesToRetrieve%5B17%5D=-profession.name.es&attributesToRetrieve%5B18%5D=-sectors_name.es&attributesToRetrieve%5B19%5D=-contract_type_names.cs&attributesToRetrieve%5B20%5D=-organization.cover_image.cs&attributesToRetrieve%5B21%5D=-organization.size.cs&attributesToRetrieve%5B22%5D=-profession.category.cs&attributesToRetrieve%5B23%5D=-profession.name.cs&attributesToRetrieve%5B24%5D=-sectors_name.cs&attributesToRetrieve%5B25%5D=-contract_type_names.sk&attributesToRetrieve%5B26%5D=-organization.cover_image.sk&attributesToRetrieve%5B27%5D=-organization.size.sk&attributesToRetrieve%5B28%5D=-profession.category.sk&attributesToRetrieve%5B29%5D=-profession.name.sk&attributesToRetrieve%5B30%5D=-sectors_name.sk&page=1&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Fullstack&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Backend&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=Dev%20Frontend&refinementList%5Bprofession_name.fr.Tech%5D%5B%5D=DevOps%20%2F%20Infra`
    );
    console.log("🎉 - No more pages");
    setTimeout(() => {
      console.log(
        `✅ - Launching Parse Welcome to the Jungle Results with ${waitList.length} results`
      );
    }, 5000);

    await browser.close();
    const endTime = Date.now();
    const timeElapsed = endTime - startTime;
    function millisToMinutesAndSeconds(millis) {
      var minutes = Math.floor(millis / 60000);
      var seconds = ((millis % 60000) / 1000).toFixed(0);
      return seconds == 60
        ? minutes + 1 + ":00"
        : minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }
    console.log(waitList.length);
    return res.status(200).json({
      message: `⌚ - Time elapsed : ${millisToMinutesAndSeconds(timeElapsed)}`,
    });
  })();

  function parseWTTJResults(browser, URL) {
    return new Promise(async (resolve) => {
      pageCount += 1;
      console.log(`⚠️ - Fetching results from page #${pageCount}`);
      const page = await browser.newPage();
      await page.goto(URL);
      console.log("⏱️ - Waiting for Network idle");
      await new Promise((resolve) => {setTimeout(resolve,10000)})
      console.log("✅ - Network idling");
      console.log("⏱️ - Waiting for scroll");
      await autoScroll(page);
      console.log("✅ - Page scroll complete");
      const links = await page.evaluate(() => {
        let elements = Array.from(
          document.querySelectorAll("main li article div a[cover]")
        );
        let linksElement = elements.map((element) => {
          return element.href;
        });
        return linksElement;
      });
      waitList.length === 0;
      links.forEach(async (link) => {
        await WaitListWTTJ.create({
          url: link,
        });
        waitList.push(link);
        console.log(waitList.length);
      });
      const hasNextPage = await page.evaluate(async () => {
        const nextBtn = document.querySelector('a[aria-label="Next page"] ');
        return nextBtn?.href;
      });
      if (hasNextPage) {
        console.log("⚠️ - Next page detected");
        await parseWTTJResults(browser, `${hasNextPage}`);
      }
      resolve();
    });
  }
};
exports.findAllStacks = async (req, res) => {
  const startTime = Date.now();
  getStacks(res);
  const endTime = Date.now();
  const timeElapsed = endTime - startTime;
  function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return seconds == 60
      ? minutes + 1 + ":00"
      : minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }
  return res.status(200).json({
    message: `⌚ - Time elapsed : ${millisToMinutesAndSeconds(timeElapsed)}`,
  });
};

/*
Kubernetes	Ops	/(kubernetes)/gmi
Google Cloud	Host	/(Google[ -]?Cloud[ -]?Platform|Google[ -]?Cloud|GCP)/gmi
Github Actions	Ops	/(GitHub[ -]?Actions)/gmi
Python	Language	/(Python)/gmi
Django	Framework	/(Django)/gmi
FastAPI	Framework	/(FastAPI)/gmi
AlpineJs	Framework	/(Alpine?JS|Alpine)/gmi
TailwindCSS	Framework	/(Tailwind[ .-]?CSS|Tailwind)/gmi
PostgreSQL	Database	/(Postgre[ .-]?SQL|Postgre)/gmi
Redis	Ops	/(Redis)/gmi
Airflow	Ops	/(Airflow)/gmi
Pub/Sub	Skills	/(Pub[ .-\/]?Sub)/gmi
BigQuery	Data	/(BigQuery)/gmi
MySQL	Database	/(MySQL)/gmi
JQuery	Library	/(JQuery)/gmi
Vue	Framework	/(Vue[ .-]?JS|Vue)/gmi
MariaDB	Database	/(Maria[ .-]?DB)/gmi
Node.js	Framework	/(Node[ .-]?JS|Node)/gmi
NestJS	Framework	/(Nest[ .-]?JS)/gmi
JavaScript	Language	/(JavaScript)/gmi
TypeScript 	Language	/(TypeScript)/gmi
Java	Language	/(Java)/gmi
Kafka	Ops	/(Kafka)/gmi
SQL	Database	/\b(SQL)\b/gmi
Hadoop	Framework	/(Hadoop)/gmi
React	Framework	/(React[ .-]?JS|React)/gmi
React Native 	Framework	/(React[ .-]?Native)/gmi
Microsoft Project	Management	/(Microsoft[ .-]?Project)/gmi
AWS	Host	/(AWS|Amazon[ .-]Web[ .-]Service[s]?)/gmi
Azure	Host	/(Azure)/gmi
API REST	Skills	/(API[ .-]REST|REST)/gmi
POO	Skills	/(PDD|POO|Programmation[ .-]?orient[ée]?e[ .-]?objet|Object[ .-]?Oriented[ .-]?Programming)/gmi
PHP	Language	/(PHP)/gmi
Laravel	Framework	/(Laravel)/gmi
Symfony	Framework	/(Symfony)/gmi
TDD	Skills	/(TDD|Test[ .-]?Driven[ .-]?Development|d[ée]?veloppement[ .-]?pilot[ée]?[ .-]?par[ .-]?les[ .-]test[s]?)/gmi
Expo	Framework	/(Expo)/gmi
GO	Language	/(GO)/gmi
Fastify	Framework	/(Fastify)/gmi
Socket.io	Framework	/(Socket[ .-]?io)/gmi
Firebase	Database	/(Firebase)/gmi
MongoDB Mongodb	Database	/(Mongo[ .-]?DB|Mongo)/gmi
Cloud Run	Ops	/(Cloud[ .-]?Run)/gmi
S3	Host	/(S3)/gmi
CloudFront	Host	/(Cloud[ .-]?Front)/gmi
Docker	Ops	/(Docker)/gmi
XCode	Tool	/(XCode)/gmi
Angular	Framework	/(Angular)/gmi
Enzyme	Framework	/(Enzyme)/gmi
Jest	Framework	/(Jest)/gmi
Webpack	Tool	/(Webpack)/gmi
Babel	Tool	/(Babel)/gmi
Swagger	Library	/(Swagger)/gmi
Ruby on Rails Ruby / Rails	Language	/(Ruby[ -]?[\/]?[ -]?Rails|Ruby[ .-]?on[ .-]Rails|Ruby[ .-]and[ .-]Rails)/gmi
Gulp	Tool	/(Gulp)/gmi
Git	Skills	/(Git)/gmi
CSS	Language	/\b(CSS)\b/gmi
SCSS SaSS	Language	/(S[AC]?SS)/gmi
Jira	Tool	/(Jira)/gmi
Electron	Framework	/(Electron)/gmi
Playwright	Framework	/(Playwright)/gmi
Detox	Framework	/(Detox)/gmi
cucumber	Framework	/(Cucumber)/gmi
cypress Cypress	Framework	/(Cypress)/gmi
Maven	Tool	/(Maven)/gmi
jenkins	Ops	/(Jenkins)/gmi
graphQL	Database	/(GraphQL)/gmi
WordPress	CMS	/(WordPress)/gmi
Prestashop	CMS	/(Prestashop)/gmi
Shopify	CMS	/(Shopify)/gmi
Prisma	Library	/(Prisma)/gmi
Selenium	Tool	/(Selenium)/gmi
C	Language	/\b(C)\b/gmi
C++	Language	/(C[++]{2})/gmi
C#	Language	/(C[#])/gmi
DynamoDB	Database	/(Dynamo[ .-]?DB)/gmi
Redshift 	Database	/(Redshift)/gmi
HTML	Language	/(HTML)/gmi
.Net	Language	/[.](net)/gmi
Spring	Framework	/(Spring)/gmi
MVC	Skills	/(MVC)/gmi
Twig	Library	/(Twig)/gmi
VanillaJS	Framework	/(Vanilla[ .-]?JS)/gmi
Redux	Library	/(Redux)/gmi
Liquid	Library	/(Liquid)/gmi
Exasol	Database	/(Exasol)/gmi
KendoUI	Library	/(KendoUI)/gmi
Gradle	Tool	/(Gradle)/gmi
ESLint	Tool	/(ES[ .-]?Lint)/gmi
Prettier	Tool	/(Prettier)/gmi
Svelte	Framework	/(Svelte)/gmi
PHPStan	Tool	/(PHPStan)/gmi
PHPUnit	Framework	/(PHPUnit)/gmi
Behat	Framework	/(Behat)/gmi
Grumphp	Tool	/(Grumphp)/gmi
Lambda	Host	/(Lambda)/gmi
Ansible	Ops	/(Ansible)/gmi
Puppet	Tool	/(Puppet)\b/gmi
LESS	Language	/(LESS)/gmi
Bootstrap	Framework	/(Bootstrap)/gmi
GitLab	Tool	/(GitLab)/gmi
Loki	Database	/(Loki)/gmi
SaaS	Skills	/(SaaS)/gmi
*/
