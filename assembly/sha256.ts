// Sha256
// optimized for two 32 byte inputs

// Helpers

@inline
function loadWord(ptr: usize, offset: usize): u32 {
  return load<u32>(ptr + offset);
}

@inline
function bswapLoadWord(ptr: usize, offset: usize): u32 {
  return (<u32>load<u8>(ptr + offset) << 24) |
    (<u32>load<u8>(ptr + offset + 1) << 16) |
    (<u32>load<u8>(ptr + offset + 2) << 8) |
    (<u32>load<u8>(ptr + offset + 3));
}

@inline
function storeWord(ptr: usize, offset: usize, val: u32): void {
  store<u32>(ptr + offset, val);
}

@inline
function CH(x: u32, y: u32, z: u32): u32 {
  return((x & y) ^ (~x & z));
}

@inline
function MAJ(x: u32, y: u32, z:u32): u32 {
  return ((x & y) ^ (x & z) ^ (y & z));
}

@inline
function EP0(x: u32): u32 {
  return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
}

@inline
function EP1(x: u32): u32 {
  return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
}

@inline
function SIG0(x: u32): u32 {
  return rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
}

@inline
function SIG1(x: u32): u32 {
  return rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10);
}

const k: u32[] = [
	0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
	0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
	0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
	0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
	0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
	0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
	0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
	0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];
const kPtr = k.dataStart;

// initial hash values

@inline
const ih0: u32 = 0x6a09e667;

@inline
const ih1: u32 = 0xbb67ae85;

@inline
const ih2: u32 = 0x3c6ef372;

@inline
const ih3: u32 = 0xa54ff53a;

@inline
const ih4: u32 = 0x510e527f;

@inline
const ih5: u32 = 0x9b05688c;

@inline
const ih6: u32 = 0x1f83d9ab;

@inline
const ih7: u32 = 0x5be0cd19;

// state

let s0: u32, s1: u32, s2: u32, s3: u32, s4: u32, s5: u32, s6: u32, s7: u32;

// message blocks

const m = new ArrayBuffer(256);
const mPtr = changetype<usize>(m);

// precomputed message blocks for known padding
const m2: u32[] = [
  0x80000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,
  0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000200,
  0x80000000,0x01400000,0x00205000,0x00005088,0x22000800,0x22550014,0x05089742,0xa0000020,
  0x5a880000,0x005c9400,0x0016d49d,0xfa801f00,0xd33225d0,0x11675959,0xf6e6bfda,0xb30c1549,
  0x08b2b050,0x9d7c4c27,0x0ce2a393,0x88e6e1ea,0xa52b4335,0x67a16f49,0xd732016f,0x4eeb2e91,
  0x5dbf55e5,0x8eee2335,0xe2bc5ec2,0xa83f4394,0x45ad78f7,0x36f3d0cd,0xd99c05e8,0xb0511dc7,
  0x69bc7ac4,0xbd11375b,0xe3ba71e5,0x3b209ff2,0x18feee17,0xe25ad9e7,0x13375046,0x0515089d,
  0x4f0d0f04,0x2627484e,0x310128d2,0xc668b434,0x420841cc,0x62d311b8,0xe59ba771,0x85a7a484
];

// functions

@inline
function expandMessageBlocks(leftPtr: usize, rightPtr: usize, mPtr: usize): void {
  let i: u32;

  for (i = 0; i < 32; i += 4) {
    storeWord(mPtr, i,
      bswapLoadWord(leftPtr, i));
    storeWord(mPtr, i + 32,
      bswapLoadWord(rightPtr, i));
  }
	for (i = 64; i < 256; i += 4)
    storeWord(mPtr, i,
      SIG1(loadWord(mPtr, i - 8)) +
      loadWord(mPtr, i - 28) +
      SIG0(loadWord(mPtr, i - 60)) +
      loadWord(mPtr, i - 64));
}

function mainLoop(mPtr: usize): void {
  let a: u32 = s0,
    b: u32 = s1,
    c: u32 = s2,
    d: u32 = s3,
    e: u32 = s4,
    f: u32 = s5,
    g: u32 = s6,
    h: u32 = s7,
    i: u32,
    t1: u32,
    t2: u32;

  for (i = 0; i < 256; i += 4) {
		t1 = h + EP1(e) + CH(e, f, g) + loadWord(kPtr, i) + loadWord(mPtr, i);
		t2 = EP0(a) + MAJ(a, b, c);
		h = g;
		g = f;
		f = e;
		e = d + t1;
		d = c;
		c = b;
		b = a;
		a = t1 + t2;
	}

  s0 += a;
	s1 += b;
	s2 += c;
	s3 += d;
	s4 += e;
	s5 += f;
	s6 += g;
	s7 += h;
}

@inline
function init(): void {
  s0 = ih0;
  s1 = ih1;
  s2 = ih2;
  s3 = ih3;
  s4 = ih4;
  s5 = ih5;
  s6 = ih6;
  s7 = ih7;
}

@inline
function update(leftPtr: usize, rightPtr: usize): void {
  expandMessageBlocks(leftPtr, rightPtr, mPtr);
  mainLoop(mPtr);
}

@inline
function final(): void {
  mainLoop(m2.dataStart);
}

@inline
function output(): ArrayBuffer {
  const out = new ArrayBuffer(32);
  const outPtr = changetype<usize>(out);
  storeWord(outPtr, 0, bswap(s0));
  storeWord(outPtr, 4, bswap(s1));
  storeWord(outPtr, 8, bswap(s2));
  storeWord(outPtr, 12, bswap(s3));
  storeWord(outPtr, 16, bswap(s4));
  storeWord(outPtr, 20, bswap(s5));
  storeWord(outPtr, 24, bswap(s6));
  storeWord(outPtr, 28, bswap(s7));
  return out;
}

export function hash(left: ArrayBuffer, right: ArrayBuffer): ArrayBuffer {
  assert(left.byteLength == 32);
  assert(right.byteLength == 32);
  init();
  update(
    changetype<usize>(left),
    changetype<usize>(right)
  );
  final();
  return output();
}
