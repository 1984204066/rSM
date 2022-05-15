// const puppeteer = require("puppeteer");
import puppeteer from "puppeteer";
import sm from "./sm3w-util.js";

const browser = await puppeteer.connect({
    slowMo: 100,
    browserURL: "http://localhost:9222", //connect to Google Chrome
});
const page = await browser.newPage();
await sm.iLogin(page, "txgx", "meinv");
const favor = await sm.getFavorateList(page);
console.log(favor);
// let a = favors as unknown as [{ href: string, title: string }]
// console.log(a)
let blist = await sm.getBoardList(page);

await page.waitForTimeout(8000);
await page.waitForNavigation({ timeout: 0 });
await page.screenshot({ path: "example.png" });
await browser.close();
