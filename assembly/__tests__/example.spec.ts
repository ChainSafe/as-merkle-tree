import { hash } from "../sha256";
import { GindexIterator } from "../gindex";
import { Node } from "../node";

let n = new Node(new ArrayBuffer(32));
for(let i = 0; i < 31; i++) {
  n = Node.add(n, n);
}

describe("example", () => {
  it("should correctly hash", () => {
    const a = new Uint8Array(32);
    const b = new Uint8Array(32);
    const output = hash(a.buffer, b.buffer);
    log<Uint8Array>(Uint8Array.wrap(output));
    for(let i = 0; i < 1000000; i++) {
      a[i % a.byteLength] = i
      b[i % b.byteLength] = i
      hash(a.buffer, b.buffer)
    }
    //log<Uint8Array>(input);
  });
  it("should return a next target", () => {
    const x = new ArrayBuffer(8);
    store<u8>(changetype<usize>(x), 0xf0);
    log((new GindexIterator(x)).nextTarget());
  });
  it("should traverse a tree", () => {
    const x = new ArrayBuffer(8);
    store<u8>(changetype<usize>(x) + 3, 0x80);
    log(n.get(new GindexIterator(x)).root);
  });
});
