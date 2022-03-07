const { Wttj } = require("../models");
const puppeteer = require("puppeteer");
const striptags = require("striptags");

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
      await page.waitForNetworkIdle({ idleTime: 200, timeout: 90000 });
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
      links.forEach(async (link) => {
        await Wttj.create({
          url: link,
        });
        waitList.push(link);
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
  const findAllLinks = await Wttj.findAll({
    limit: 2,
  });
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"],
  });
  const promises = [];
  findAllLinks.forEach((link) => {
    console.log(link);
    promises.push(getTheStack(browser, link.url));
  });
  await Promise.all(promises);
  await browser.close();
  async function getTheStack(browser, URL) {
    return new Promise(async (resolve) => {
      const page = await browser.newPage();
      console.log("⏱️ - Fetching page data");
      await page.goto(URL);
      const content = await page.evaluate(async () => {
        const paragraph = document.querySelector(
          'main div section[data-testid="job-section-description"] '
        );
        return paragraph.innerHTML;
      });
      const sContent = striptags(content).toLowerCase();
      console.log(sContent);
      const regexPython = /(python)/gmi;
      const searchPython = regexPython.test(sContent);
      console.log(searchPython);
      console.log("✅ - Page data fetched");
      resolve();
    });
  }
};
