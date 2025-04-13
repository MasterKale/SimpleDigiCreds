import type { Uint8Array_ } from '../types.ts';

export function isX509Array(x5chain: Uint8Array_ | Uint8Array_[]): x5chain is Uint8Array_[] {
  return Array.isArray(x5chain);
}
