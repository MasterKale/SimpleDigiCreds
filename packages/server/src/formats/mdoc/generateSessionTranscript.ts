import { encodeCBOR } from '@levischuck/tiny-cbor';

import type { DCAPIRequestOID4VP } from '../../dcapi.ts';
import type { DCAPIOID4VPSessionTranscript } from './types.ts';
import { SimpleDigiCredsError } from '../../helpers/simpleDigiCredsError.ts';

/**
 * See OID4VP for SessionTranscript composition:
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#appendix-B.3.4
 */
export async function generateSessionTranscript(
  request: DCAPIRequestOID4VP,
): Promise<DCAPIOID4VPSessionTranscript> {
  type OpenID4VPDCAPIHandoverInfo = [
    origin: string,
    client_id: string,
    nonce: string,
  ];

  // Get the origin out of "web-origin:http://localhost:8000"
  const clientIDParts = request.client_id.match(/web-origin:(?<origin>.*)/i);

  if (!clientIDParts?.groups?.origin) {
    throw new SimpleDigiCredsError({
      message: `Could not find an origin in client ID "${request.client_id}"`,
      code: 'MdocVerificationError',
    });
  }

  const handoverInfo: OpenID4VPDCAPIHandoverInfo = [
    clientIDParts.groups.origin,
    request.client_id,
    request.nonce,
  ];

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
