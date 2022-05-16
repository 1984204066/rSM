import puppeteer from "puppeteer";
import { BasicAcceptedElems, CheerioAPI, load, Node } from "cheerio";
import {
    Article,
    Board,
    compareBoard,
    RBTree,
    SectionNames,
    SectionNo,
    Tag,
    Topic,
} from "./board.js";

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

    async getTopicList(board: Board | string, p: number = 1) {
	let b: Board | null;
	if (typeof board === 'string') {
	    b = this.searchBoard(board);
	    if (b === null) {
		console.log("cannot find board ", board);
		return new Array<Topic>()
	    }
	} else {
	    b = board;
	}
        let url = redirectURL(b.Url());
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
    async getArticleDebates(subject: Topic) {
        const url = redirectURL(subject.Url());
        return await this.getArticleDebatesFrom(url);
    }

    async getArticleDebatesFrom(url: string) {
        var arts = new Array<Article>();
        try {
            await this.gotoPage(url);
            let span = await smallCheerio(this.page, "div.b-head.corner");
            let title = span("span.n-left").text().replace(/^文章主题:/, "").trim();
            const $ = await smallCheerio(this.page, "div.b-content.corner");
            const trs = $("tr").toArray();
            for (var j = 0; j < trs.length; j += 3) {
                // one article have 3 tr
                let { debate, no } = oneDebate(title, $, [trs[j], trs[j + 1], trs[j + 2]]);
                arts[no] = debate;
                // console.log(`${no}, `, debate);
            }
        } catch (err) {
            console.log(err);
        }
        return arts;
    }

    async getTBody(url: string) {
        let retry = 2;
        do {
            try {
                await this.gotoPage(url);
                // must encapsulated with <table>, otherwise $('tr') will be null.
                const $ = await smallCheerio(
                    this.page,
                    "tbody",
                    (html: string) => "<table>" + html + "</table>",
                );
                return $;
            } catch (err) {
                console.log(`${url} return empty html (${err}) let us retry!`);
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

    async rest() {
        await this.page.waitForTimeout(8000);
        await this.page.waitForNavigation({ timeout: 0 });
        await this.page.screenshot({ path: "example.png" });
        // await browser.close();
    }
}

async function boardInfoAt(page: puppeteer.Page) {
    var bi = new Board();
    // 主题数:142405
    const total = await page.$eval("ul.pagination li.page-pre i", (i) => i.textContent);
    bi.totalTopic(Number(total));
    // 分页: 12345678...4747 >>
    const li = await smallCheerio(page, "ul.pagination li ol.page-main");
    const last_page = li("li").last().prev().text();
    bi.activity.lastPage(Number(last_page));
    console.log(`${total}, pages: ${last_page}`);

    // '本版当前共有162人在线[最高10608人] 今日帖数193 版面积分:91727'
    const span = await smallCheerio(page, "div.b-head.corner");
    const info = span("span.n-left").text();
    var dig: number[] = [];
    const re = /[^\d]+(\d+)[^\d]+(\d+)[^\d]+(\d+)[^\d]+(\d+)/g;
    const m = re.exec(info);
    if (m) {
        // i = 0 对于 $0代表整个str, 不是number. 故此dig[0] = NaN
        m.forEach((v, i) => dig.push(Number(v)));
        bi.activity.onlinesPeople(dig[1]);
        bi.activity.todaysPeak(dig[2]);
        bi.activity.todaysAriticle(dig[3]);
        let gross = dig[4];
    }
    console.log(info, dig, bi);
    return bi;
}

type fixHtml = (html: string) => string;

async function smallCheerio(page: puppeteer.Page, label: string, fix?: fixHtml) {
    let html = await selectHtml(page, label);

    if (html.length === 0) {
        throw ("empty html piece");
    }
    if (fix !== undefined) {
        html = fix(html);
    }
    const $ = load(html);
    // section#body has style, and maybe contains special char \8 \9.
    $("style").empty();
    return $;
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

function oneDebate(title: string, $: CheerioAPI, trs: BasicAcceptedElems<Node>[]) {
    var art = new Article();
    let seq = 0;
    let [tr1, tr2, tr3] = [...trs];
    // config author
    art.author.Name($("span.a-u-name", tr1).text());
    const pos = $("span.a-pos", tr1).text();
    // console.log(pos);
    if (pos !== "楼主") {
        const re = /第(\d+)楼/g;
        seq = Number(pos.replace(re, "$1"));
    } else {
        art.Subject(title);
    }
    art.author.Url($("div.a-u-img img", tr2).attr("src"));
    art.author.nickName($("div.a-u-uid", tr2).text());
    let info = $("dl.a-u-info", tr2);
    let key = $("dt", info).map((i, el) => $(el).text().trim());
    let value = $("dd", info).map((i, el) => $(el).text().trim());
    let imap = new Map();
    for (let i in key) {
        imap.set(key[i], value[i]);
    }
    let author = art.author;
    // const x = $("dd", info).eq(0).text(); // 身份： 用户
    author.publish = Number(imap.get("文章"));
    author.stellar = imap.get("星座");
    author.score = Number(imap.get("积分"));
    author.addTags(":" + imap.get("等级"));
    let raw_html = $("td.a-content p", tr2).html();
    let parts = raw_html && raw_html.split("<br>", -1);
    if (parts) {
        let texts = parts.map((data) => load(data).root().text());
        art.content.parse(texts);
    }
    return { debate: art, no: seq };
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
