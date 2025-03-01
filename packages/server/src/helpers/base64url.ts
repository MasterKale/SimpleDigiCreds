import * as base64 from '@hexagon/base64';

export function bufferToBase64URL(buffer: ArrayBuffer): string {
  return base64.fromArrayBuffer(new Uint8Array(buffer), true);
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  return base64.fromArrayBuffer(new Uint8Array(buffer), false);
}

export function base64URLToBuffer(val: string): Uint8Array {
  return new Uint8Array(base64.toArrayBuffer(val, true));
}

export function base64ToBuffer(val: string): Uint8Array {
  return new Uint8Array(base64.toArrayBuffer(val, false));
}
