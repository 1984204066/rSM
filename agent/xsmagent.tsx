// @deno-types="https://cdn.jsdelivr.net/gh/justjavac/deno_cheerio/cheerio.d.ts"
import cheerio from "https://dev.jspm.io/cheerio/index.js";
import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";
import { Article, BinarySearchTree, Board, compareBoard, Tag, Topic } from "./board.tsx";
import { assert } from "https://deno.land/std/testing/asserts.ts";
// const puppeteer = require("/usr/lib/node_modules/puppeteer");
// class xSM {
//     ilogin: {user: string, passwd: string},
//     constructor() {
// 	this.ilogin = {"", ""}
//     }
// }

function redirectURL(url: string): string {
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

(async () => {
})();

const browser = await puppeteer.launch({
    headless: false,
    args: ["--user-data-dir=/var/run/session-smth"],
});
const page = await browser.newPage();
// page.goto("https://www.mysmth.net/nForum/#!board/NewExpress")
// await page.evaluateOnNewDocument(() => {
//     const newProto = navigator.__proto__;
//     delete newProto.webdriver;
//     navigator.__proto__ = newProto;
//   });
// await page.waitForTimeout(5000);

async function gotoPage(url: string) {
    await Promise.all([
        page.goto(url),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        // page.waitForNavigation({ waitUntil: "load" }),
    ]);
    console.log(`hi~~, I'm going to page ${url}`);
}

async function iLogin(user: string, passwd: string) {
    await page.goto("https://www.mysmth.net/");
    //const elementHandle1 = await page.$("input#id");
    //await elementHandle1.type(user, { delay: 50 });
    try {
        await page.type("input#id", user, { delay: 100 });
        await page.type("input#pwd", passwd, { delay: 100 });
        const b = page.click("input#b_login");
        const n = page.waitForNavigation();
        await Promise.all([b, n]);
    } catch (err) {
        console.log(err);
    }
}

async function clickBecomeVisible(css1: string, css2: string) {
    // await page.evaluate(() => {
    //     const $anchor = document.querySelector('li.flist.folder-close span.x-folder');
    //     $anchor.click();
    // });
    // await page.waitForSelector('ul#list-favor',  {visible: true})
    try {
        await page.click(css1, { delay: 100 });
    } catch (err) {
        console.log(err);
    }
    await page.waitForSelector(css2, { visible: true });
}

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
    // const html = await page.$('li.flist.folder-open')
    // console.log("items {item}", item)
    // const favors = Array.from(html)
    // console.log(favors);
    // console.log(html);
    let a = html as unknown as [{ href: string, title: string }]
    console.log(a)
    console.log(a.length)
    return a;
}

async function getTBodyHtml() {
    return await selectHtml("tbody");
}

async function selectHtml(css: string) {
    try {
        const frame = await page.mainFrame();
        // console.log("main frame\n", mframe)
        // const bodyHandle = await frame.$("html");
        // const corner = await page.click("#body.corner");
        // const bodyHandle = await page.$("#body.corner");
        // const html = await page.$eval('html', body => body.innerHTML)
        const bodyHandle = await page.$(css);
        const html = await page.evaluate((body) => body && body.innerHTML, bodyHandle);
        // const html = await page.evaluate((body) => body && body.innerHTML, await page.$("tbody"));
        if (bodyHandle === null) {
            console.log("!!!! bodyHandle is null, tbody do not exists !!!!");
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
    url: string,
    tag: string,
    btree: BinarySearchTree<Board>,
): Promise<Board[]> {
    var board2 = new Array<Board>();
    try {
        await gotoPage(url);
        // const frames = page.frames();
        // console.log("frames : ", frames.length, "\n");
        // for (let f of frames) {
        //     console.log("name: ", f.name(), "\n");
        //     const frame = f;
        // }
        const html = await getTBodyHtml();
        if (html.length === 0) {
            return board2;
        }
        const $ = cheerio.load(html);
        // maybe style contains special char \8 \9.
        $("style").empty();
        const trs = $("tr").toArray();
        for (var tr of trs) {
            // const body = $(tr).text().trim();
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
                        board.Butchers = killer;
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
            console.log(board);
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
    return board2;
}

async function restAddBoard(rest: Board[], btree: BinarySearchTree<Board>) {
    while (rest.length !== 0) {
        var rest2 = new Array<Board>();
        console.log(rest.length);
        for (let r of rest) {
            // record tag as parents.
            const t = new Tag(r.cname());
            // const t = new Tag(r.tag, r.cname());
            const url = redirectURL(r.url);
            const r2 = await pageAddBoard(url, t.tag, btree);
            console.log(r2.length);
            r2.length > 0 && rest2.concat(r2);
            // assert(rest.length === 0);
        }
        rest = rest2;
    }
}

async function getBoardList() {
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
        const rest = await pageAddBoard(url, tag, btree);
        await restAddBoard(rest, btree);
    }
    // const str = JSON.stringify(btree);
    var count = 0;
    btree.preOrderTraverse((key: Board) => {
        if (key.kind === 0) {
            count++;
            console.log(key.xid);
        }
    });
    console.log("total :", count);
    // await page.waitForFunction(async () => {
    //     const res = await fetch("https://www.mysmth.net/nForum/#!section/0");
    //     const html = await res.text();
    //     console.log(html);
    // });
    // console.log(await res.text())
    //page.waitForResponse();
    // const favor = $('ul#list-favor.x-child li.leaf span.text a').map((it) => it.href);
    // console.log("favor:\n", favor)
}

// await page.goto(
//   "https://www.mysmth.net/nForum/#!flist.json?uid=txgx&root=list-favor",
// );

async function getTopicList(board: Board) {
    const url = redirectURL(board.Url());
    return await getTopicListFrom(url);
}

async function getTopicListFrom(url: string) {
    var topics = new Array<Topic>();
    try {
        await gotoPage(url);
        const html = await getTBodyHtml();
        if (html.length === 0) return topics;

        const $ = cheerio.load(html);
        // maybe style contains special char \8 \9.
        $("style").empty();
        const trs = $("tr").toArray();
        for (var tr of trs) {
            var topic = new Topic();
            $("td", tr).map((i, el) => {
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
            });
            console.log(topic);
            topics.push(topic);
        }
    } catch (err) {
        console.log(err);
    }
    return topics;
}

async function smallPieceCheerio(label: string) {
    const html = await selectHtml(label);
    const $ = cheerio.load(html);
    return $;
}

async function boardInfoAtSelfPage() {
    var bi = new Board();
    // 主题数:142405
    const total = await page.$eval("ul.pagination li.page-pre i", (i) => i.textContent);
    bi.totalTopic(Number(total));
    // 分页: 12345678...4747 >>
    const li = await smallPieceCheerio("ul.pagination li ol.page-main");
    const last_page = li("li").last().prev().text();
    bi.activity.lastPage(Number(last_page));
    console.log(`${total}, pages: ${last_page}`);

    // '本版当前共有162人在线[最高10608人] 今日帖数193 版面积分:91727'
    const span = await smallPieceCheerio("div.b-head.corner");
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

async function getArticleDebates(subject: Topic) {
    const url = redirectURL(subject.Url());
    return await getArticleDebatesFrom(url);
}

function oneDebate(title: string, $: cheerio.CheerioStatic, trs: cheerio.CheerioElement[]) {
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
        let texts = parts.map((data) => cheerio.load(data).root().text());
	art.content.parse(texts)
    }
    return { debate: art, no: seq };
}

async function getArticleDebatesFrom(url: string) {
    var arts = new Array<Article>();
    try {
        await gotoPage(url);
        let span = await smallPieceCheerio("div.b-head.corner");
        let title = span("span.n-left").text().replace(/^文章主题:/, "").trim();
        const html = await selectHtml("div.b-content.corner");
        if (html.length === 0) return arts;

        const $ = cheerio.load(html);
        // maybe style contains special char \8 \9.
        $("style").empty();
        const trs = $("tr").toArray();
        for (var j = 0; j < trs.length; j += 3) {
            // one article have 3 tr
            let { debate, no } = oneDebate(title, $, [trs[j], trs[j + 1], trs[j + 2]]);
	    arts[no] = debate
            // console.log(`${no}, `, debate);
        }
    } catch (err) {
        console.log(err);
    }
    return arts;
}

await page.setRequestInterception(true);
page.on("request", (req) => {
    // const req = res.request();
    // const responseType = req.resourceType();
    // const headers = res.headers();
    // if (req.isInterceptResolutionHandled()) return;
    // console.log(req.url());
    //这就是请求的类型如果是图片类型的话执行abort拦截操作 否则continue继续请求别的
    if (req.resourceType() === "image") {
        // console.log("----yyds-----");
        // req.abort("failed", 0);
        req.abort();
    } else {
        // console.log(await res.json());
        // console.log(req, responseType, headers, response_url)
        // await res.continue();
        req.continue();
        // req.continue(req.continueRequestOverrides(), 0);
    }
});

// const user = Deno.args[0];
// const passwd = Deno.args[1];
// console.log(`Hello ${user}, I like ${passwd}!`);

// await iLogin(user, passwd);
// await getFavorateList();

// await gotoPage("https://www.mysmth.net/nForum/board/Picture")
// await boardInfoAtSelfPage()
// const topics = await getTopicListFrom("https://www.mysmth.net/nForum/board/Picture")
// let debates = await getArticleDebatesFrom(
//     "https://www.mysmth.net/nForum/#!article/Picture/2405892",
// );
// if (debates.length === 0) {
//     console.log("oops try again")
//     debates = await getArticleDebatesFrom(
// 	"https://www.mysmth.net/nForum/#!article/Picture/2405892",
//     );
// }
// console.log(debates);
// const addr : Deno.NetAddr = {transport: "udp", port: 0, hostname: "192.168.0.112"};

const socket = await Deno.listenDatagram({
    port: 8125,
    transport: "udp",
    hostname: "0.0.0.0"
});
console.log("xSM agent starting receive command")
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let quit = 0;

for await (let [msg, client_addr] of socket) {
    if (quit) break
    let send_data =async (data: Uint8Array, dest: Deno.Addr) => {
	const len = data.length
	var left = len
	var end = 0
	var index = 0;
	do {	    
	    if (left > 1000) {
		left -= 1000
		end += 1000
	    } else {
		left = 0
		end = len
	    }
	    await socket.send(data.slice(index, end), dest);
	    index = end
	} while (left > 0)
    }

    try {
	let jmsg = JSON.parse(decoder.decode(msg))
	// socket.send(buf, client_addr);
	// await sock.read(buf);
	console.log(jmsg)
	// '{"cmd": "login"}'
	// if (jmsg.cmd === 'login') {
	// 	console.log('login')
	// }
	switch (jmsg.cmd) {
	    case 'login':
		const user : string = jmsg.user
		const passwd : string = jmsg.passwd
		await iLogin(user, passwd)
		break
	    case 'favorateList':
		let favors = await getFavorateList();
		if (favors.length > 0) {
		    const str = encoder.encode(JSON.stringify(favors));
		    const len = str.length;
		    const len_json = JSON.stringify(len)
		    console.log("len's json", len_json)
		    await socket.send(encoder.encode(len_json) , client_addr);
		    // var s :string = client_addr
		    // console.log(str)
		    await send_data(str, client_addr)
		    // await socket.send(str.slice(0,1000), client_addr);
		    // await socket.send(str.slice(1000), client_addr);
		} else {
		    const len = 0
		    const len_json = JSON.stringify(len)
		    await socket.send(encoder.encode(len_json) , client_addr);
		}
		break
	    case 'allBoardList':
		await getBoardList();
		break
	    case 'browseBoard':
		break
	    case 'browseTopic':
		break
	    case 'quit':
		// await page.waitForTimeout(8000);
		await browser.close();
		socket.send(encoder.encode("OK"), client_addr);
		quit = 1
	}
    } catch(err) {
	console.log("some err occur", err)
    }
}

