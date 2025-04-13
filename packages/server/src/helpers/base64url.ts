import * as base64 from '@hexagon/base64';

import type { Uint8Array_ } from './types.ts';

export function bufferToBase64URL(buffer: Uint8Array_): string {
  return base64.fromArrayBuffer(buffer.buffer, true);
}

export function bufferToBase64(buffer: Uint8Array_): string {
  return base64.fromArrayBuffer(buffer.buffer, false);
}

export function base64URLToBuffer(val: string): Uint8Array_ {
  return new Uint8Array(base64.toArrayBuffer(val, true));
}

export function base64ToBuffer(val: string): Uint8Array_ {
  return new Uint8Array(base64.toArrayBuffer(val, false));
}

export function isBase64URLString(val: string): boolean {
  return base64.validate(val, true);
}
