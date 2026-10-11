// Compares two secret strings in "constant time": it takes the same time
// whether they differ at the first character or the last, so an attacker
// can't learn a secret one character at a time by measuring response times.
// (A plain `a === b` stops at the first difference.)
import { timingSafeEqual } from "node:crypto";

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual needs equal lengths. Different lengths can never match.
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
