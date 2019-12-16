import { hash } from "./sha256";
import { Root, rootEquals } from "./root";
import { GindexIterator } from "./gindex";

export class Node {
  constructor(
    public readonly root: Root,
    public leftChild: Node | null = null,
    public rightChild: Node | null = null
  ) {
  }

  isLeaf(): bool {
    return !this.leftChild && !this.rightChild;
  }

  equals(n: Node): bool {
    return rootEquals(this.root, n.root);
  }
  equalsRoot(root: Root): bool {
    return rootEquals(this.root, root);
  }

  get(gindex: GindexIterator): Node | null {
    const t = gindex.nextTarget();
    if (t == 1) {
      return this;
    } else if (!this.leftChild || !this.rightChild) {
      return null;
    } else if (t == 0) {
      return this.leftChild.get(gindex);
    } else {
      return this.rightChild.get(gindex);
    }
  }

  static add(l: Node, r: Node): Node {
    return new Node(hash(l.root, r.root), l, r);
  }
}
