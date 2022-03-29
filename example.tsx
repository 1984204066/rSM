import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";
import cheerio from "https://dev.jspm.io/npm:cheerio/index.js";
const browser = await puppeteer.launch({
  headless: false,
  args: ["--user-data-dir=/var/run/session-smth"],
});
const page = await browser.newPage();

async function iLogin(user: string, passwd: string) {
  await page.goto("https://www.mysmth.net/");
  //const elementHandle1 = await page.$("input#id");
  //await elementHandle1.type(user, { delay: 50 });
  await page.type("input#id", user, { delay: 50 });
  await page.type("input#pwd", passwd, { delay: 50 });
  await page.click("input#b_login");
  await page.waitForNavigation();
}

async function clickBecomeVisible(css1: string, css2: string) {
  // await page.evaluate(() => {
  //     const $anchor = document.querySelector('li.flist.folder-close span.x-folder');
  //     $anchor.click();
  // });
  // await page.waitForSelector('ul#list-favor',  {visible: true})
  try {
    await page.click(css1, { delay: 500 });
  } catch (err) {
    console.log(err);
  }
  await page.waitForSelector(css2, { visible: true });
}
async function getBoardList() {
  var SectionNames = [
    "社区管理",
    "国内院校",
    "休闲娱乐",
    "五湖四海",
    "游戏运动",
    "社会信息",
    "知性感性",
    "文化人文",
    "学术科学",
    "电脑技术",
    "终止版面",
  ];
  var SectionURLs = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A"];
  const baseURL = "https://www.mysmth.net/nForum/#!section/0";
  //page.waitForResponse();
  // const frame = await page.mainFrame()
  // const bodyHandle = await frame.$('html');
  // const html = await frame.evaluate(body => body.innerHTML, bodyHandle);
  // const html = await page.$('li.flist.folder-open')
  // await bodyHandle.dispose();      // 销毁

  // const html = await page.$eval('li.flist.folder-open', body => body.innerHTML)
  // const $ = cheerio.load(html)

  // const title = $("title").text().trim()
  // console.log("title", title);
  // const favor = $('ul#list-favor.x-child li.leaf span.text a').map((it) => it.href);
  // console.log("favor:\n", favor)
}
// await page.goto(
//   "https://www.mysmth.net/nForum/#!flist.json?uid=txgx&root=list-favor",
// );

// await page.setRequestInterception(true);
// page.on("response", async (res) => {
//   // const req = res.request();
//   // const responseType = req.resourceType();
//   // const headers = res.headers();
//   // const response_url = res.url();

//   console.log(res.status());
//   console.log(await res.json());
//   // console.log(req, responseType, headers, response_url)
//   // await res.continue();
// });

async function getFavorateList() {
  await clickBecomeVisible(
    "li.flist.folder-close span.x-folder",
    "ul#list-favor",
  );
  const html = await page.$$eval(
    "ul#list-favor.x-child li.leaf span.text a",
    (its) =>
      its.map((it) => {
        return { href: it.href, title: it.title };
      }),
  );
  // const item = await page.evaluate(() => {
  //     const $anchor = document.querySelector('ul#list-favor.x-child li.leaf');
  //     const array = Array.from($anchor);
  //     return {len: array.length}
  // });
  // console.log("items {item}", item)
  console.log(html);
  return html;
}
const user = Deno.args[0]
const passwd = Deno.args[1]
console.log(`Hello ${user}, I like ${passwd}!`);

await iLogin(user, passwd);
await getFavorateList();

await Promise.all([
  page.goto("https://www.mysmth.net/nForum/#!board/CSArch"),
  page.waitForNavigation({ waitUntil: "load" }),
]);

await page.waitForTimeout(5000);
// const favor = await page.$('ul#list-favor');
// const str = favor.toString();
// console.log("favor", favor);

await browser.close();
