import { decodeCBOR, encodeCBOR } from '@levischuck/tiny-cbor';

import { COSEHEADER, COSEKEYS, isCOSEPublicKeyEC2 } from '../../cose.ts';
import { convertX509PublicKeyToCOSE } from '../../helpers/convertX509PublicKeyToCOSE.ts';
import { verifyEC2 } from '../../helpers/verifyEC2.ts';
import type {
  DecodedDocument,
  MdocCOSESign1SigStructure,
  MdocIssuerAuthProtected,
} from './types.ts';

export async function verifyIssuerSigned(document: DecodedDocument) {
  const issuerSigned = document.get('issuerSigned');
  const issuerAuth = issuerSigned.get('issuerAuth');
  // console.log('issuerAuth[0, protected] (decoded):', decodedMdocIssuerAuthProtected);
  // console.log('issuerAuth[1]:', issuerAuth[1]);
  // const x5c = AsnParser.parse(issuerAuth[1].get(COSEHEADER.X5CHAIN), Certificate);
  // console.log('issuerAuth[1, unprotected] (decoded):', x5c);
  // console.log('issuerAuth[2]:', issuerAuth[2]);
  // console.log('issuerAuth[3, signature]:', issuerAuth[3]);

  // console.log('x5chain:', issuerAuth[1].get(COSEHEADER.X5CHAIN));

  const cosePublicKey = convertX509PublicKeyToCOSE(
    issuerAuth[1].get(COSEHEADER.X5CHAIN),
  );

  if (!isCOSEPublicKeyEC2(cosePublicKey)) {
    throw new Error(
      `Unsupported public key type ${cosePublicKey.get(COSEKEYS.kty)}`,
    );
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
    data: encodeCBOR(issuerData),
    signature: issuerAuth[3],
    shaHashOverride: hashAlg,
  });

  return { verified };
}
