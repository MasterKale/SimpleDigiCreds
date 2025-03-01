export function isX509Array(x5chain: Uint8Array | Uint8Array[]): x5chain is Uint8Array[] {
  return Array.isArray(x5chain);
}
