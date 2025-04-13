export function isX509Array(
  x5chain: Uint8Array<ArrayBuffer> | Uint8Array<ArrayBuffer>[],
): x5chain is Uint8Array<ArrayBuffer>[] {
  return Array.isArray(x5chain);
}
