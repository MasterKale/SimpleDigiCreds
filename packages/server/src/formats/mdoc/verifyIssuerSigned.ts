import { decodeCBOR, encodeCBOR } from '@levischuck/tiny-cbor';

import { COSEHEADER, COSEKEYS, isCOSEPublicKeyEC2 } from '../../cose.ts';
import { SimpleDigiCredsError, verifyEC2, x509 } from '../../helpers/index.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';
import type {
  DecodedDocument,
  MdocCOSESign1SigStructure,
  MdocIssuerAuthProtected,
} from './types.ts';

export async function verifyIssuerSigned(document: DecodedDocument): Promise<VerifiedIssuerSigned> {
  const issuerSigned = document.get('issuerSigned');
  const issuerAuth = issuerSigned.get('issuerAuth');

  const x5chain = issuerAuth[1].get(COSEHEADER.X5CHAIN);
  let leafCert: Uint8Array_;
  let _normalizedX5C: Uint8Array_[];
  if (x509.isX509Array(x5chain)) {
    leafCert = x5chain[0];
    _normalizedX5C = x5chain;
  } else {
    leafCert = x5chain;
    _normalizedX5C = [x5chain];
  }

  const cosePublicKey = x509.convertX509PublicKeyToCOSE(leafCert);

  if (!isCOSEPublicKeyEC2(cosePublicKey)) {
    throw new SimpleDigiCredsError({
      message: `Unsupported public key type ${cosePublicKey.get(COSEKEYS.kty)}`,
      code: 'MdocVerificationError',
    });
  }

  const issuerData: MdocCOSESign1SigStructure = [
    'Signature1', // context
    issuerAuth[0], // body_protected
    new Uint8Array(), // sign_protected
    issuerAuth[2], // payload
  ];

  const decodedMdocIssuerAuthProtected = decodeCBOR(issuerAuth[0]) as MdocIssuerAuthProtected;
  const hashAlg = decodedMdocIssuerAuthProtected.get(COSEHEADER.ALG);

  const verified = await verifyEC2({
    cosePublicKey,
    data: encodeCBOR(issuerData) as Uint8Array_,
    signature: issuerAuth[3],
    shaHashOverride: hashAlg,
  });

  return { verified, x5chain: _normalizedX5C };
}

type VerifiedIssuerSigned = {
  verified: boolean;
  x5chain: Uint8Array_[];
};
