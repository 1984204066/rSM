import puppeteer from "puppeteer";
import { BasicAcceptedElems, CheerioAPI, load, Node } from "cheerio";
import { Board, compareBoard, RBTree, SectionNames, SectionNo, Tag, Topic } from "./board.js";

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
export async function newXsm() {
    const browser = await puppeteer.connect({
        slowMo: 100,
        browserURL: "http://localhost:9222", //connect to Google Chrome
    });
    const page = await browser.newPage();
    let sm = new XSM(page);
    return sm;
}
export class XSM {
    constructor(public page: puppeteer.Page, public boards = new Array<Board>()) {
    }
    async iLogin(user: string, passwd: string) {
        // await gotoPage(page, "https://www.mysmth.net/");
        await this.page.goto("https://www.mysmth.net/");
        // await page.waitForSelector("input#id", { visible: true });

        try {
            await this.page.type("input#id", user, { delay: 100 });
            await this.page.type("input#pwd", passwd, { delay: 100 });
            //const elementHandle1 = await page.$("input#id");
            //await elementHandle1.type(user, { delay: 50 });
            await Promise.all([
                this.page.click("input#b_login"),
                this.page.waitForNavigation({ timeout: 0 }),
            ]);
        } catch (err) {
            console.log(err);
        }
    }

    async getFavorateList() {
        await clickBecomeVisible(
            this.page,
            "li.flist.folder-close span.x-folder",
            "ul#list-favor",
        );
        const favors = await this.page.$$eval(
            "ul#list-favor.x-child li.leaf span.text a",
            (its) =>
                its.map((it) => {
                    const a = it as HTMLAnchorElement;
                    return { href: a.href, title: a.title };
                }),
        );
        // let a = favors as unknown as [{ href: string, title: string }]
        // console.log(a)
        console.log("favorate list len=", favors.length);
        return favors;
    }

    async getBoardList(force: boolean = false) {
        if (!force && this.boards.length > 0) return this.boards;

        const baseURL = "https://www.mysmth.net/nForum/#!section/";
        var btree = new RBTree<Board>(compareBoard);

        for (var index in SectionNo) {
            const url = baseURL + SectionNo[index];
            const tag = SectionNames[index];
            const rest = await this.pickoutBoard(url, tag, btree);
            // break;
            await this.pickBoard2(rest, btree);
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
        this.boards = board_array;
        console.log("total :", count);
        return board_array;
    }

    searchBoard(name: string) {
        for (let board of this.boards) {
            if (board.xid.includes(name)) {
                return board;
            }
        }
        return null;
    }
    async pickoutBoard(
        url: string,
        tag: string,
        btree: RBTree<Board>,
    ): Promise<Board[]> {
        var board2 = new Array<Board>();
        let count = 0;
        try {
            const $ = await this.getTBody(url);
            const trs = $("tr").toArray();
            // console.log(trs)
            for (var tr of trs) {
                const body = $(tr).text().trim();
                // console.log("tr", body);
                var board = new Board();
                board.addTags(tag);
                $("td", tr).map((i: number, el) => {
                    assembleBoard($, i, el, board);
                });
                if (board.kind === 2) {
                    board2.push(board);
                }

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

    async pickBoard2(rest: Board[], btree: RBTree<Board>) {
        while (rest.length !== 0) {
            var rest2 = new Array<Board>();
            // console.log(rest.length);
            for (let r of rest) {
                // record tag as parents.
                const t = new Tag(r.cname());
                // const t = new Tag(r.tag, r.cname());
                const url = redirectURL(r.url);
                console.log("-- for board ", r.cname(), " goto ", url);
                const r2 = await this.pickoutBoard(url, t.tag, btree);
                // console.log(r2.length);
                r2.length > 0 && rest2.concat(r2);
                // assert(rest.length === 0);
            }
            rest = rest2;
        }
    }
    async getTopicList(board: Board, p: number = 1) {
        let url = redirectURL(board.Url());
        if (p !== 1) {
            url = url + "?p=" + p;
        }
        // console.log(url)
        return await this.getTopicListFrom(url);
    }

    async getTopicListFrom(url: string) {
        var topics = new Array<Topic>();
        try {
            const $ = await this.getTBody(url);
            const trs = $("tr").toArray();
            for (var tr of trs) {
                var topic = new Topic();
                $("td", tr).map((i: number, el) => {
                    assembleTopic($, i, el, topic);
                });
                console.log(topic);
                topics.push(topic);
            }
        } catch (err) {
            console.log(err);
        }
        return topics;
    }

    async getTBody(url: string) {
        let retry = 2;
        do {
            try {
                await this.gotoPage(url);
                const html = await this.selectHtml("tbody");
                if (html.length !== 0) {
                    // must encapsulated with <table>, otherwise $('tr') will be null.
                    let tbody = "<table>" + html + "</table>";
                    // console.log(tbody);
                    const $ = load(tbody);
                    // section#body has style, and maybe contains special char \8 \9.
                    $("style").empty();
                    return $;
                }
                console.log(url, " return empty html let us retry");
                retry--;
            } catch (err) {
                console.log(err);
                retry--;
            }
        } while (retry > 0);
        throw ("empty tbody");
    }

    async gotoPage(url: string) {
        await Promise.all([
            this.page.goto(url),
            this.page.waitForNavigation({ waitUntil: "networkidle2" }),
            // page.waitForNavigation({ waitUntil: "load" }),
        ]);
        // await page.mainFrame();
        // console.log("main frame\n", mframe)
        await this.page.waitForSelector("section#main.corner", { visible: true });
        console.log(`hi~~, I'm going to page ${url}`);
    }

    async selectHtml(css: string) {
        try {
            // const bodyHandle = await frame.$("html");
            // const corner = await page.click("#body.corner");
            // const bodyHandle = await page.$("#body.corner");
            // const html = await page.$eval('html', body => body.innerHTML)
            const bodyHandle = await this.page.$(css);
            const html = await this.page.evaluate((body) => body && body.innerHTML, bodyHandle);
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

    async rest() {
        await this.page.waitForTimeout(8000);
        await this.page.waitForNavigation({ timeout: 0 });
        await this.page.screenshot({ path: "example.png" });
        // await browser.close();
    }
}

async function clickBecomeVisible(page: puppeteer.Page, css1: string, css2: string) {
    try {
        await page.click(css1, { delay: 100 });
    } catch (err) {
        console.log(err);
    }
    await page.waitForSelector(css2, { visible: true });
}

function assembleBoard(
    $: CheerioAPI,
    i: number,
    el: BasicAcceptedElems<Node>,
    board: Board,
) {
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
}

function assembleTopic(
    $: CheerioAPI,
    i: number,
    el: BasicAcceptedElems<Node>,
    topic: Topic,
) {
    switch (i) {
        case 0:
            break;
        case 1:
            const sub = topic.Subject($("a", el).text());
            const href = topic.Url($("a", el).attr("href"));
            const samp = $("samp", el).get().length > 0 && ":samp";
            topic.addTags(samp || "");
            break;
        case 2:
            topic.CTime($(el).text());
            break;
        case 3:
            topic.author.Name($("a", el).text());
            break;
        case 4:
            topic.Coin(Number($(el).text()));
            break;
        case 5:
            topic.focusNum(Number($(el).text()));
            break;
        case 6:
            topic.replyNum(Number($(el).text()));
            break;
        case 7:
            topic.upTime($(el).text());
            break;
        case 8:
            topic.Modifier($(el).text());
            break;
        default:
            console.log("oops");
    }
}
// export default { XSM };
