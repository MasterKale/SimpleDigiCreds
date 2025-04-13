import { base64url } from '../index.ts';

/**
 * Convert buffer to an OpenSSL-compatible PEM text format.
 */
export function convertX509BufferToPEM(certBuffer: Uint8Array<ArrayBuffer>): string {
  // We specifically do not want base64url used here, PEM is base64
  const b64cert = base64url.bufferToBase64(certBuffer);

  let PEMKey = '';
  for (let i = 0; i < Math.ceil(b64cert.length / 64); i += 1) {
    const start = 64 * i;

    PEMKey += `${b64cert.substr(start, 64)}\n`;
  }

  PEMKey = `-----BEGIN CERTIFICATE-----\n${PEMKey}-----END CERTIFICATE-----\n`;

  return PEMKey;
}
