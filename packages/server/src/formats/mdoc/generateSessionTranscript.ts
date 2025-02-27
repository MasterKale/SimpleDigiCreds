import { encodeCBOR } from '@levischuck/tiny-cbor';

import type { DCAPIRequestOID4VP } from '../../dcapi.ts';
import type { DCAPIOID4VPSessionTranscript } from './types.ts';

/**
 * See OID4VP for SessionTranscript composition: https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#appendix-B.3.4
 */
export async function generateSessionTranscript(request: DCAPIRequestOID4VP): Promise<Uint8Array> {
  type OpenID4VPDCAPIHandoverInfo = [
    origin: string,
    client_id: string,
    nonce: string,
  ];

  // Intentionally out of order as per CMWallet; `OpenID4VPDCAPIHandoverInfo` type is "correct"
  const handoverInfo: OpenID4VPDCAPIHandoverInfo = [
    request.client_id,
    request.nonce,
    'http://localhost:8000',
  ];
  const handoverInfoCBOR = encodeCBOR(handoverInfo);
  // Encoded CBOR Data Item (Tag No. 24) https://www.rfc-editor.org/rfc/rfc8949.html#embedded-di
  const handoverDataCBORBstr = encodeCBOR(new CBORTag(24, handoverInfoCBOR));
  const handoverInfoHash = await crypto.subtle.digest('SHA-256', handoverDataCBORBstr);

  // console.log('handover', encodeHex(handoverInfoHash));

  const sessionTranscript: DCAPIOID4VPSessionTranscript = [
    null,
    null,
    [
      // @ts-ignore: CMWallet uses "OID4VPDCAPIHandover" here
      'OID4VPDCAPIHandover',
      new Uint8Array(handoverInfoHash),
    ],
  ];
  const sessionTranscriptCBOR = encodeCBOR(sessionTranscript);
  const sessionTranscriptCBORBstr = encodeCBOR(new CBORTag(24, sessionTranscriptCBOR));

  return sessionTranscriptCBORBstr;
}
