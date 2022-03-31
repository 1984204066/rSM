class SomeX {
    xid: string;
    url: string;
    tag: string;
    kind: number;
    constructor(id: string, u: string, k: number) {
        this.xid = id;
        this.url = u;
	this.tag = ""
        this.kind = k;
    }
    addTag(tag:string, ...rest: string[]) {
	this.tag += (';' + tag + rest.join(';'))
    }
    hasTag(tag:string) {
	return this.tag.indexOf(tag) != -1;
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

    constructor(protected compareFn: ICompareFunction<T> = defaultCompare) {
        // this.root = null;
    }
    /**
     * @description: 返回根节点
     */
    getRoot(): Node<T> | undefined {
        return this.root;
    }

    /**
     * @description: 返回树中的最小元素
     */
    min(): Node<T> | undefined {
        // 调用迭代方法
        return this.minNode(this.root);
    }

    /**
     * @description: 返回指定子树下的最小元素
     */
    protected minNode(node?: Node<T>): Node<T> | undefined {
        let current = node;
        // 不断向左查
        while (current != null && current.left != null) {
            current = current.left;
        }
        return current;
    }

    /**
     * @description: 返回树中的最大元素
     */
    max(): Node<T> | undefined {
        // 调用迭代方法
        return this.maxNode(this.root);
    }

    /**
     * @description: 返回指定子树下的最大元素
     */
    protected maxNode(node?: Node<T>): Node<T> | undefined {
        let current = node;
        // 不断向右查
        while (current != null && current.right != null) {
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
        // 调用后序遍历迭代方法
        this.postOrderTraverseNode(callback, this.root);
    }

    private postOrderTraverseNode(callback: Function, node?: Node<T>) {
        // 基线条件
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
    search(key: T): Node<T> | undefined {
        return this.searchNode(key, this.root);
    }

    /**
     * @description: 递归搜索
     */
    private searchNode(key: T, node?: Node<T>): Node<T> | undefined {
        // 基线条件：查到尽头返回false
        if (!node) {
            return undefined;
        }

        if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
            // key 比 node.key 小，向左查
            return this.searchNode(key, node.left);
        } else if (this.compareFn(key, node.key) === Compare.BIGGER_THAN) {
            // key 比 node.key 大，向右查
            return this.searchNode(key, node.right);
        } else {
            // 基线条件：既不大也不小，说明查到该元素，返回true
            return node;
        }
    }
    /**
     * @description: 插入元素
     */
    insert(key: T) {
        if (this.root == null) {
            // 边界情况：插入到根节点
            this.root = new Node(key);
        } else {
            // 递归找到插入位置
            this.insertNode(this.root, key);
        }
    }

    /**
     * @description: 递归插入方法
     */
    protected insertNode(node: Node<T>, key: T) {
        if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
            // key 比 node.key 小就向左查
            if (node.left == null) {
                // 基线条件：左面为空直接赋值
                node.left = new Node(key);
            } else {
                // 否则就接着递归
                this.insertNode(node.left, key);
            }
        } else {
            // key 比 node.key 大就向右查
            if (node.right == null) {
                // 基线条件：右面为空直接赋值
                node.right = new Node(key);
            } else {
                // 否则就接着递归
                this.insertNode(node.right, key);
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
        if (node == null) {
            return undefined;
        }

        if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
            // 当 key 小于 node.key 时，向左去找
            node.left = this.removeNode(key, node.left);
            return node;
        } else if (this.compareFn(key, node.key) === Compare.BIGGER_THAN) {
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
