import { encodeCBOR } from '@levischuck/tiny-cbor';
import * as jose from 'jose';

import type { DCAPIOID4VPSessionTranscript } from './types.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';
import { base64url } from '../../helpers/index.ts';

/**
 * See OID4VP for SessionTranscript composition:
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-28.html#appendix-B.2.6
 */
export async function generateSessionTranscript(
  requestOrigin: string,
  nonce: string,
  verifierPublicKeyJWK?: JsonWebKey,
): Promise<DCAPIOID4VPSessionTranscript> {
  type OpenID4VPDCAPIHandoverInfo = [
    origin: string,
    nonce: string,
    jwk_thumbprint: Uint8Array_ | null,
  ];

  let jwkThumbprint: Uint8Array_ | null = null;
  if (verifierPublicKeyJWK) {
    const thumbprintBase64URL = await jose.calculateJwkThumbprint(verifierPublicKeyJWK);
    jwkThumbprint = base64url.base64URLToBuffer(thumbprintBase64URL);
  }

  const handoverInfo: OpenID4VPDCAPIHandoverInfo = [requestOrigin, nonce, jwkThumbprint];

  const handoverInfoCBOR = encodeCBOR(handoverInfo);
  const handoverInfoHash = await crypto.subtle.digest('SHA-256', handoverInfoCBOR);

  const sessionTranscript: DCAPIOID4VPSessionTranscript = [
    null,
    null,
    [
      'OpenID4VPDCAPIHandover',
      new Uint8Array(handoverInfoHash),
    ],
  ];
  return sessionTranscript;
}
