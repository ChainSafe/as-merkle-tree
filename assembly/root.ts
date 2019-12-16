export type Root = ArrayBuffer;

export const ROOT_SIZE = 32;

export function rootEquals(r0: Root, r1: Root): bool {
  return memory.compare(changetype<usize>(r0), changetype<usize>(r1), ROOT_SIZE);
}
