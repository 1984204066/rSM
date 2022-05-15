import puppeteer from "puppeteer";
// import favor from "favor.js"

function redirectURL(url:string) {
    const smBase = "https://www.mysmth.net";
    let uri = url.trim();
    var re = /\/Forum\//;
    if (uri.match(/^http[s]:/i)) {
    } else if (uri.match(/^\/\//)) {
        uri = "https:" + uri;
    } else {
        uri = smBase + uri;
    }
    if (uri.includes("#!")) return uri;
    uri = uri.replace(re, "/Forum/#!");
    return uri;
}

async function iLogin(page:puppeteer.Page, user:string, passwd:string) {
    await page.goto("https://www.mysmth.net/");
    //const elementHandle1 = await page.$("input#id");
    //await elementHandle1.type(user, { delay: 50 });
    try {
        await page.type("input#id", user, { delay: 100 });
        await page.type("input#pwd", passwd, { delay: 100 });
        const b = page.click("input#b_login");
        const n = page.waitForNavigation({ timeout: 0 });
        await Promise.all([b, n]);
    } catch (err) {
        console.log(err);
    }
}

async function gotoPage(page:puppeteer.Page, url:string) {
    await Promise.all([
        page.goto(url),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        // page.waitForNavigation({ waitUntil: "load" }),
    ]);
    await page.mainFrame();
    // console.log("main frame\n", mframe)
    await page.waitForSelector("section#main.corner", { visible: true });
    console.log(`hi~~, I'm going to page ${url}`);
}

async function clickBecomeVisible(page:puppeteer.Page, css1:string, css2:string) {
    try {
        await page.click(css1, { delay: 100 });
    } catch (err) {
        console.log(err);
    }
    await page.waitForSelector(css2, { visible: true });
}

// function favor(it: puppeteer.ElementHandle<HTMLAnchorElement>) {
//     return { href: it.href, title: it.title };
// }

async function getFavorateList(page:puppeteer.Page) {
    await clickBecomeVisible(
        page,
        "li.flist.folder-close span.x-folder",
        "ul#list-favor",
    );
    const favors = await page.$$eval(
        "ul#list-favor.x-child li.leaf span.text a",
        (its) =>
            its.map((it) => {
		const a = it as HTMLAnchorElement
		return { href: a.href, title: a.title };
            }),
    );
    console.log("favorate list len=", favors.length);
    return favors;
}

// module.exports = {
//     redirectURL: redirectURL,
//     gotoPage: gotoPage,
//     iLogin: iLogin,
// };

export default {iLogin, getFavorateList}
