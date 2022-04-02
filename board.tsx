export class Tag {
    constructor(public tag: string = "", ...tags: string[]) {
        this.add(tags);
    }
    // addTags(tags: Tag[] | string[]) {
    //     if ((typeof tags)[0] === "string") {
    //         this.addTag(tags.join(";"));
    //     } else {
    //         this.addTag((<Tag[]>tags).map((t) => t.tag).join(";"));
    //     }
    // }
    add(tags: string[]) {
        if (this.tag.length === 0) {
            this.tag = tags.join(" ");
        } else {
            this.tag += " " + tags.join(" ");
        }
        // this.addTag(tags.join(' '))
    }

    addTags(tag: string, ...rest: string[]) {
        if (this.tag.length === 0) {
            this.tag = tag + " " + rest.join(" ");
        } else {
            this.tag += " " + tag + " " + rest.join(" ");
        }
    }
    hasTag(tag: string) {
        return this.tag.indexOf(tag) != -1;
    }
}
class SomeX extends Tag {
    xid: string;
    url: string;
    kind: number;
    constructor(id: string, u: string, k: number) {
        super();
        this.xid = id;
        this.url = u;
        this.kind = k;
    }
    Url(url?: string | null) {
        if (url) this.url = url;
        return this.url;
    }
    ids(id: string, ...restOf: string[]) {
        this.xid = id + "/" + restOf.join("/");
    }
    private idn(i: number, id?: string | null): string {
        if (id) {
            let x = this.xid.split("/", -1);
            x[i] = id;
            this.xid = x.join("/");
            return id;
        }
        let x = this.xid.split("/", -1);
        return x[i];
    }

    id1(id?: string | null): string {
        return this.idn(0, id);
    }
    id2(id?: string | null): string {
        return this.idn(1, id);
    }
}

class dailyActivityInfo {
    online_people: number;
    todays_peak: number;
    todays_debate: number;
    last_page: number;

    constructor() {
        this.online_people = 0;
        this.todays_peak = 0;
        this.todays_debate = 0;
        this.last_page = 0;
    }

    onlinesPeople(online?: number | null) {
        if (online) this.online_people = online;
        return this.online_people;
    }
    todaysPeak(todays?: number | null) {
        if (todays) this.todays_peak = todays;
        return this.todays_peak;
    }
    todaysAriticle(art?: number | null) {
        if (art) this.todays_debate = art;
        return this.todays_debate;
    }
    lastPage(no?: number | null) {
        if (no) this.last_page = no;
        return this.last_page;
    }
}

export class Board extends SomeX {
    Butchers: string[];
    ntopic: number;
    ndebate: number;
    activity: dailyActivityInfo;
    topics: BinarySearchTree<Topic>;

    // constructor(xid: string, u: string, k: number);
    // constructor(
    //     xid: string,
    //     u: string,
    //     k: number,
    //     killer: string[],
    //     onlines: number,
    //     todays: number,
    //     tps: number,
    //     arts: number,
    // );
    constructor(
        xid: string = "",
        u: string = "",
        k: number = 0,
        killer: string[] = [],
        tps: number = 0,
        arts: number = 0,
    ) {
        super(xid, u, k);
        this.Butchers = killer;
        this.ntopic = tps;
        this.ndebate = arts;
        this.activity = new dailyActivityInfo();
        this.topics = new BinarySearchTree<Topic>(compareTopic);
    }

    ename(): string {
        return this.id1();
    }
    cname(): string {
        return this.id2();
    }
    totalTopic(num?: number | null) {
        if (num) this.ntopic = num;
        return this.ntopic;
    }
    totalDebate(num?: number | null) {
        if (num) this.ndebate = num;
        return this.ndebate;
    }
}

export class Author extends SomeX {
    static default_avatar = "face_default_m.jpg";
    avatar_url: string;
    score: number;
    stellar: string;
    publish: number;

    constructor(xid: string = "", u: string = "", k: number = 0) {
        super(xid, u, k);
        this.avatar_url = "";
        this.score = 0;
        this.stellar = "";
        this.publish = 0;
    }

    Name(nm?: string | null) {
        return this.id1(nm);
    }
    nickName(nm?: string | null) {
        return this.id2(nm);
    }
}
/*
  发信人: wxfromwh (一切为了高大上), 信区: MilitaryView
  <br>
  标&nbsp;&nbsp;题: Re: 伊朗的拖延战。
  <br>
  发信站: 水木社区 (Mon Feb 10 10:05:24 2020), 站内
  <br>
  &nbsp;&nbsp;
  <br>
  越南都打不下，伊朗更不用说
  <br>
  【 在 txgx 的大作中提到: 】
  <br>
  <font class="f006">: 美帝军事基地多而散，因此伊朗在利比亚，伊拉老，阿富汗，也门拖住美帝是对的，。 </font>
  <br>
  <font class="f006">: 分散力量好打。 </font>
  <br>
  <font class="f006">: 所以说美帝范了分兵的错误。这也和美帝犹豫不决打不打伊朗有关。 </font>
  <br>
  --
  <br>
  &nbsp;&nbsp;
  <br>
  <font class="f000"></font><font class="f006">※ 来源:·水木社区 <a target="_blank" href="http://m.newsmth.net">http://m.newsmth.net</a>·[FROM: 171.113.217.*]</font><font class="f000">
  <br>
  </font>
*/
export class TalkContent {
    myword: string;
    peer: string;
    proverbs: string;
    fromip: string;
    constructor() {
        this.myword = "";
        this.peer = "";
        this.proverbs = "";
        this.fromip = "";
    }
    parse(data: string[]) {
        let peer_index = -1;
        data.every((it, i) => {
            if (it.match(/\s+【 在.*的大作中提到: 】/g)) {
                peer_index = i;
                return false;
            }
            return true;
        });
	// 3 pointers, myword (peer_index) peer (last) -- proverbs (ip_index)※ ip
        let last = -1;
        for (let i = data.length - 1; i >= 0; i--) {
            if (data[i].match(/^\s*--\s*$/)) {
                last = i;
		break
            }
        }
	// we can assert last != -1.
        if (last !== -1) {
	    if (peer_index === -1) peer_index = last
        }
        let after_peer = data.slice(last + 1);
        let ip_index = -1;
        after_peer.every((it, i) => {
	    // /^\s*※\s*\w+.*/
            if (it.match(/^\s*※.*/)) {
                ip_index = i;
                return false;
            }
            return true;
        });
	// console.log("ip_index, after peer len", ip_index, after_peer.length)
	
        if (ip_index !== -1) {
	    if (last === -1) {
		last = ip_index
		peer_index = ip_index
	    }
            this.fromip = after_peer.slice(ip_index)
		.filter((it) => it.trim().length > 0)
		.join("\n");
        } else {
	    ip_index = after_peer.length
	}
        this.proverbs = after_peer.slice(0, ip_index)
	    .filter((it) => it.trim().length > 0)
	    .join("\n",);
        this.myword = data.slice(4, peer_index)
	    .filter((it) => it.trim().length > 0)
	    .join("\n",);
        this.peer = data.slice(peer_index, last)
	    .filter((it) => it.trim().length > 0)
	    .join("\n");
    }
}

export class Article extends SomeX {
    ctime: string;
    author: Author;
    content: TalkContent;

    constructor(xid: string = "", u: string = "", k: number = 0) {
        super(xid, u, k);
        this.ctime = "";
        this.author = new Author();
        this.content = new TalkContent();
    }

    Subject(sub?: string | null): string {
        // 当左侧操作数为 null 或 undefined 时，其返回右侧的操作数，否则返回左侧的操作数。
        // const foo = null ?? 'default string';
        if (sub) this.xid = sub;
        return this.xid;
    }
    CTime(t?: string | null): string {
        if (t) this.ctime = t;
        return this.ctime;
    }

    // Author(author?:Author | null): Author {
    // 	if (author) this.author = author
    // 	return this.author
    // }
}

function compareArticle(a: Article, b: Article): Compare {
    return defaultCompare(a.ctime, b.ctime);
}

export class Topic extends Article {
    coin: number;
    focus: number;
    reply: number;
    utime: string;
    modifier: string;
    debates: BinarySearchTree<Article>;

    constructor(xid: string = "", u: string = "", k: number = 0) {
        super(xid, u, k);
        this.coin = 0;
        this.focus = 0;
        this.reply = 0;
        this.utime = "";
        this.modifier = "";
        this.debates = new BinarySearchTree<Article>(compareArticle);
    }

    Coin(coin?: number | null) {
        if (coin) this.coin = coin;
        return this.coin;
    }
    focusNum(focus?: number | null) {
        if (focus) this.focus = focus;
        return this.focus;
    }
    replyNum(reply?: number | null) {
        if (reply) this.reply = reply;
        return this.reply;
    }
    upTime(utime?: string | null) {
        if (utime) this.utime = utime;
        return this.utime;
    }
    Modifier(modifier?: string | null) {
        if (modifier) this.modifier = modifier;
        return this.modifier;
    }
}

function compareTopic(a: Topic, b: Topic): Compare {
    return defaultCompare(a.utime, b.utime);
}

export function compareBoard(a: Board, b: Board): Compare {
    return defaultCompare(a.xid, b.xid);
}
// export default Board
// https://zhuanlan.zhihu.com/p/367762840
export class Node<K> {
    left?: Node<K>;
    right?: Node<K>;

    constructor(public key: K) {
        // this.left = null;
        // this.right = null;
    }

    toString() {
        return `${this.key}`;
    }
}
// 比较结果的枚举值
export enum Compare {
    LESS_THAN = -1,
    BIGGER_THAN = 1,
    EQUALS = 0,
}

// 规定自定义Compare的类型
export type ICompareFunction<T> = (a: T, b: T) => number;
/**
 * @description: 默认的大小比较函数
 * @param {T} a
 * @param {T} b
 * @return {Compare} 返回 -1 0 1 代表 小于 等于 大于
 */
export function defaultCompare<T>(a: T, b: T): Compare {
    if (a === b) {
        return Compare.EQUALS;
    }
    return a < b ? Compare.LESS_THAN : Compare.BIGGER_THAN;
}

export class BinarySearchTree<T> {
    protected root?: Node<T>;

    constructor(protected comparator: ICompareFunction<T> = defaultCompare) {
        // this.root = null;
    }
    /**
     * @description: 返回根节点
     */
    getRoot(): Node<T> | undefined {
        return this.root;
    }

    /**
     * @description: 返回指定子树下的最小元素,没有指定node则返回root下的最小元素
     */
    minNode(node?: Node<T>): Node<T> | undefined {
        let current = node || this.root;
        // 不断向左查
        while (current && current.left) {
            current = current.left;
        }
        return current;
    }

    /**
     * @description: 返回指定子树下的最大元素
     */
    maxNode(node?: Node<T>): Node<T> | undefined {
        let current = node || this.root;
        // 不断向右查
        while (current && current.right) {
            current = current.right;
        }
        return current;
    }
    /**
     * @description: 先序遍历
     */
    preOrderTraverse(callback: Function) {
        // 调用先序遍历迭代方法
        this.preOrderTraverseNode(callback, this.root);
    }

    private preOrderTraverseNode(callback: Function, node?: Node<T>) {
        // 基线条件
        if (!node) return;
        // 先序遍历的执行顺序是 执行回调 -> 左 -> 右
        callback(node.key);
        this.preOrderTraverseNode(callback, node.left);
        this.preOrderTraverseNode(callback, node.right);
    }
    /**
     * @description: 中序遍历
     */
    inOrderTraverse(callback: Function) {
        // 调用中序遍历迭代方法
        this.inOrderTraverseNode(callback, this.root);
    }

    private inOrderTraverseNode(callback: Function, node?: Node<T>) {
        if (!node) return;
        // 中序遍历的顺序是 左 -> 执行回调 -> 右
        this.inOrderTraverseNode(callback, node.left);
        callback(node.key);
        this.inOrderTraverseNode(callback, node.right);
    }
    /**
     * @description: 后序遍历
     */
    postOrderTraverse(callback: Function) {
        this.postOrderTraverseNode(callback, this.root);
    }

    private postOrderTraverseNode(callback: Function, node?: Node<T>) {
        if (node != null) {
            // 后序遍历的执行顺序是 左 -> 右 -> 执行回调
            this.postOrderTraverseNode(callback, node.left);
            this.postOrderTraverseNode(callback, node.right);
            callback(node.key);
        }
    }

    /**
     * @description: 搜索元素
     */
    // https://ricardoborges.dev/data-structures-in-typescript-binary-search-tree
    search(key: T): Node<T> | undefined {
        if (!this.root) {
            return undefined;
        }
        let current = this.root;
        while (this.comparator(key, current.key) !== Compare.EQUALS) {
            if (this.comparator(key, current.key) === Compare.BIGGER_THAN) {
                // key 比 node.key 大，向右查
                if (!current.right) return;
                current = current.right;
            } else {
                // key 比 node.key 小，向左查
                if (!current.left) return;
                current = current.left;
            }
        }
        return current;
    }

    /**
     * @description: 插入元素
     */
    insert(key: T): Node<T> | undefined {
        if (!this.root) {
            this.root = new Node(key);

            return this.root;
        }

        let current = this.root;

        while (true) {
            if (this.comparator(key, current.key) === Compare.BIGGER_THAN) {
                // key 比 node.key 大就向右查

                if (current.right) {
                    current = current.right;
                } else {
                    current.right = new Node(key);

                    return current.right;
                }
            } else {
                if (current.left) {
                    current = current.left;
                } else {
                    current.left = new Node(key);

                    return current.left;
                }
            }
        }
    }

    /**
     * @description: 移除指定元素
     */
    remove(key: T) {
        // 调用递归方法，这里的递归很特殊，会将删除后的树返回
        this.root = this.removeNode(key, this.root);
    }

    /**
     * @description: 递归方法，在指定子树中移除指定元素，每次处理完后都需要将处理后的节点返回给本节点
     */
    protected removeNode(key: T, node?: Node<T>): Node<T> | undefined {
        // 基线条件
        if (!node) {
            return undefined;
        }

        if (this.comparator(key, node.key) === Compare.LESS_THAN) {
            // 当 key 小于 node.key 时，向左去找
            node.left = this.removeNode(key, node.left);
            return node;
        } else if (this.comparator(key, node.key) === Compare.BIGGER_THAN) {
            // 当 key 大于 node.key 时，向右去找
            node.right = this.removeNode(key, node.right);
            return node;
        } else {
            // 此时已经查到了要删除的节点
            if (!node.left && !node.right) {
                // 当要删除的节点为叶子节点
                return undefined;
            } else if (!node.left) {
                // 当要删除的节点只有一个子节点
                node = node.right;
                return node;
            } else if (!node.right) {
                // 同样删除的节点只有一个子节点
                node = node.left;
                return node;
            } else {
                // 当要删除的节点有两个子节点
                const aux = this.minNode(node.right);
                if (aux != undefined) {
                    node.key = aux.key;
                    node.right = this.removeNode(aux.key, node.right);
                }
                return node;
            }
        }
    }
}
