//const listener = Deno.listen({ transport: "unix", path: "./test.sock" });
import cheerio from "cheerio";
import puppeteer from "puppeteer";
import iconv from "iconv-lite";
import fs from "fs";
import path from "path";

console.log(puppeteer.connect);

const buffer = fs.readFileSync("/home/admin/1.html");
const content2 = iconv.decode(buffer, "utf8");
// console.log(buffer);
console.log(content2);
const content1 = '<tr><td class="title_1"><a href="/nForum/section/ADAgents">商务与代理</a><br>ADAgents</td><td class="title_2">[二级目录]<br></td><td class="title_3">&nbsp;</td><td class="title_4 middle c63f">&nbsp;</td><td class="title_5 middle c09f">&nbsp;</td><td class="title_6 middle c63f">&nbsp;</td><td class="title_7 middle c09f">&nbsp;</td></tr>'
const content = '<tr><td class="title_1"><a href="/nForum/section/ADAgents">商务与代理</a><br>ADAgents</td></tr>'
const content0 = '<table><tr><td class="title_1"><a href="/nForum/section/ADAgents">商务与代理</a><br>ADAgents</td></tr></table>'
const $ = cheerio.load(content0);
const trs = $("tr").toArray();
console.log($("tr").html());
console.log($('a').html())
