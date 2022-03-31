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
    add(tags:string[]) {
        if (this.tag.length === 0) {
            this.tag = tags.join(";");
        } else {
            this.tag += ";" + tags.join(";");
        }
	// this.addTag(tags.join(';'))
    }
    
    addTags(tag: string, ...rest: string[]) {
        if (this.tag.length === 0) {
            this.tag = tag + ";" + rest.join(";");
        } else {
            this.tag += ";" + tag + ";" + rest.join(";");
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
    ids(id: string, ...restOf: string[]) {
        this.xid = id + "/" + restOf.join("/");
    }
    id1(): string {
        const index = this.xid.indexOf("/");
        return this.xid.substring(0, index);
    }
    id2(): string {
        const index = this.xid.indexOf("/");
        return this.xid.substring(index + 1);
    }
}

export class Board extends SomeX {
    Butchers: string[];
    onlinesPeople: number;
    todaysPeople: number;
    topics: number;
    articles: number;
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
        onlines: number = 0,
        todays: number = 0,
        tps: number = 0,
        arts: number = 0,
    ) {
        super(xid, u, k);
        this.Butchers = killer;
        this.onlinesPeople = onlines;
        this.todaysPeople = todays;
        this.topics = tps;
        this.articles = arts;
    }
    ename(): string {
        return this.id1();
    }
    cname(): string {
        return this.id2();
    }
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