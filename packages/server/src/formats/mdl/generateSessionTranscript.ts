import { encodeCBOR } from '@levischuck/tiny-cbor';

import type { DCAPIRequestOID4VP } from '../../dcapi/types.ts';
import type { DCAPIOID4VPSessionTranscript } from './types.ts';
import type { GeneratedPresentationRequestMetadata } from '../../generatePresentationRequest.ts';

/**
 * See OID4VP for SessionTranscript composition:
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#appendix-B.3.4
 */
export async function generateSessionTranscript(
  request: DCAPIRequestOID4VP,
  requestMetadata: GeneratedPresentationRequestMetadata,
): Promise<DCAPIOID4VPSessionTranscript> {
  type OpenID4VPDCAPIHandoverInfo = [
    origin: string,
    client_id: string,
    nonce: string,
  ];

  const handoverInfo: OpenID4VPDCAPIHandoverInfo = [
    requestMetadata.requestOrigin,
    requestMetadata.clientID,
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
