// Human-friendly reference code for a quote request, e.g. "GWS-7F3K-2Q9X".

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function block(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function makeRef(): string {
  return `GWS-${block(4)}-${block(4)}`;
}
