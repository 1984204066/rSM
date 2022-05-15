import puppeteer from "puppeteer";
import cheerio from "cheerio";
import { BinarySearchTree, Board, compareBoard, Tag } from "./board.js";

function redirectURL(url: string) {
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

async function iLogin(page: puppeteer.Page, user: string, passwd: string) {
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

async function gotoPage(page: puppeteer.Page, url: string) {
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

async function clickBecomeVisible(page: puppeteer.Page, css1: string, css2: string) {
    try {
        await page.click(css1, { delay: 100 });
    } catch (err) {
        console.log(err);
    }
    await page.waitForSelector(css2, { visible: true });
}

async function getFavorateList(page: puppeteer.Page) {
    await clickBecomeVisible(
        page,
        "li.flist.folder-close span.x-folder",
        "ul#list-favor",
    );
    const favors = await page.$$eval(
        "ul#list-favor.x-child li.leaf span.text a",
        (its) =>
            its.map((it) => {
                const a = it as HTMLAnchorElement;
                return { href: a.href, title: a.title };
            }),
    );
    console.log("favorate list len=", favors.length);
    return favors;
}

async function getTBodyHtml(page: puppeteer.Page, url: string) {
    let retry = 2;
    do {
        try {
            await gotoPage(page, url);
            const html = await selectHtml(page, "tbody");
            if (html.length !== 0) {
                return html;
            }
            console.log("let us retry ", url);
            retry--;
        } catch (err) {
            console.log(err);
            retry--;
        }
    } while (retry > 0);
    return "";
}

async function selectHtml(page: puppeteer.Page, css: string) {
    try {
        // const bodyHandle = await frame.$("html");
        // const corner = await page.click("#body.corner");
        // const bodyHandle = await page.$("#body.corner");
        // const html = await page.$eval('html', body => body.innerHTML)
        const bodyHandle = await page.$(css);
        const html = await page.evaluate((body) => body && body.innerHTML, bodyHandle);
        // const html = await page.evaluate((body) => body && body.innerHTML, await page.$("tbody"));
        if (bodyHandle === null) {
            console.log("!!!! bodyHandle is null, ", css, "do not exists !!!!");
            return "";
        }
        await bodyHandle.dispose(); // 销毁
        return html;
    } catch (err) {
        console.log(err);
    }
    return "";
}

async function pageAddBoard(
    page: puppeteer.Page,
    url: string,
    tag: string,
    btree: BinarySearchTree<Board>,
): Promise<Board[]> {
    var board2 = new Array<Board>();
    let count = 0;
    try {
        const html = await getTBodyHtml(page, url);
        if (html.length === 0) {
            console.log(url, " return empty html");
            return board2;
        }
        // let tbody = html.replaceAll('\n','')
        let tbody = "<table>" + html + "</table>";
        // must encapsulated with <table>, otherwise $('tr') will be null.
        // console.log(tbody);
        const $ = cheerio.load(tbody);
        // section#body has style, and maybe style contains special char \8 \9.
        $("style").empty();
        const trs = $("tr").toArray();
        // console.log(trs)
        for (var tr of trs) {
            const body = $(tr).text().trim();
            // console.log("tr", body);
            var board = new Board();
            board.addTags(tag);
            $("td", tr).map((i, el) => {
                switch (i) {
                    case 0:
                        const cname = $("a", el).text();
                        const href = $("a", el).attr("href");
                        $("a", el).empty();
                        const ename = $(el).text().trim();
                        board.ids(ename, cname);
                        board.url = href || "";
                        // console.log(ename, cname, href)
                        break;
                    case 1:
                        const re = /二级目录/gi;
                        const text = $(el).text();
                        if (text.search(re) != -1) {
                            board.kind = 2;
                            board2.push(board);
                            break;
                        }
                        // contain butchers.
                        const killer = $("a", el).map((i, el) => {
                            return $(el).text();
                        }).get();
                        board.butchers = killer;
                        break;
                    case 2:
                        break;
                    case 3:
                        board.activity.onlinesPeople(Number($(el).text()));
                        break;
                    case 4:
                        board.activity.todaysPeak(Number($(el).text()));
                        break;
                    case 5:
                        board.ntopic = Number($(el).text());
                        break;
                    case 6:
                        board.ndebate = Number($(el).text());
                        break;
                    default:
                        console.log("oops");
                }
            });
            count++;
            btree.insert(board);
        }
        // var trs: string[] = new Array();
        // $("table.board-list.corner tbody", "tr", 'td').map((i, el) => {
        //     console.log(i)
        //     const tr_html = $(el).html();
        //     trs.push(tr_html === null ? "" : tr_html);
        // });
        // const str = trs.join("\n");
        // console.log(str);
    } catch (err) {
        console.log(err);
    }
    console.log("this page got 二级目录", board2.length, ",total : ", count);

    return board2;
}

async function restAddBoard(page: puppeteer.Page, rest: Board[], btree: BinarySearchTree<Board>) {
    while (rest.length !== 0) {
        var rest2 = new Array<Board>();
        // console.log(rest.length);
        for (let r of rest) {
            // record tag as parents.
            const t = new Tag(r.cname());
            // const t = new Tag(r.tag, r.cname());
            const url = redirectURL(r.url);
            console.log("-- for board ", r.cname(), " goto ", url);
            const r2 = await pageAddBoard(page, url, t.tag, btree);
            // console.log(r2.length);
            r2.length > 0 && rest2.concat(r2);
            // assert(rest.length === 0);
        }
        rest = rest2;
    }
}

async function getBoardList(page: puppeteer.Page) {
    const SectionNames = [
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
    const SectionURLs = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A"];
    const baseURL = "https://www.mysmth.net/nForum/#!section/";
    var btree = new BinarySearchTree<Board>(compareBoard);

    for (var index in SectionURLs) {
        const url = baseURL + SectionURLs[index];
        // const html = await page.$("table.board-list.corner tbody");
        // const $ = cheerio.load(html);
        // const frame = await page.waitForFrame(async (frame) => {
        // 	return frame.name() === 'pvstat';
        // });
        const tag = SectionNames[index];
        const rest = await pageAddBoard(page, url, tag, btree);
        // break;
        await restAddBoard(page, rest, btree);
    }
    var count = 0;
    let board_array = new Array<Board>();
    btree.preOrderTraverse((data: Board) => {
        if (data.kind === 0) {
            count++;
            // console.log(data.xid);
        }
        board_array.push(data);
    });
    console.log("total :", count);
    return board_array;
}

export default { iLogin, getFavorateList, getBoardList };
