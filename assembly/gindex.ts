export type Gindex = ArrayBuffer;

export class GindexIterator {
  public byteOffset: u32;
  public bitMask: u8;

  constructor(
    public readonly gindex: Gindex
  ) {
    const ptr = changetype<usize>(gindex);
    let byteOffset = gindex.byteLength;
    let byteVal: u8;
    // calculate first byte value and offset, starting from the end (le)
    do {
      byteOffset--;
      byteVal = load<u8>(ptr + byteOffset);
    } while(byteVal == 0);
    this.bitMask = 1 << (31 - clz(byteVal));
    this.byteOffset = byteOffset;
  }

  next(): bool {
    if (!this.byteOffset && this.bitMask == 0x01) {
      return false;
    }
    if ((this.bitMask == 0x01)) {
      this.bitMask = 0x80;
      this.byteOffset--;
    } else {
      this.bitMask >>= 1;
    }
    return true;
  }

  // 0 = go left
  // < 0 = go right
  currentTarget(): u8 {
    const ptr = changetype<usize>(this.gindex);
    const byteVal: u8 = load<u8>(ptr + this.byteOffset);
    let target = byteVal & this.bitMask;
    // 1 is reserved for the final value
    if (this.bitMask == 0x01) {
      target <<= 1;
    }
    return target;
  }

  // 0 = go left
  // 1 = exact target
  // < 1 = go right
  nextTarget(): u8 {
    if (this.next()) {
      return this.currentTarget();
    }
    return 1;
  }
}
