import { decodeCBOR, encodeCBOR } from '@levischuck/tiny-cbor';
import { AsnParser } from '@peculiar/asn1-schema';
import { Certificate } from '@peculiar/asn1-x509';

import { COSEHEADER, COSEKEYS, isCOSEPublicKeyEC2 } from '../../cose.ts';
import { SimpleDigiCredsError, verifyEC2, x509 } from '../../helpers/index.ts';
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

  const x5chain = issuerAuth[1].get(COSEHEADER.X5CHAIN);
  let leafCert: Uint8Array;
  if (x509.isX509Array(x5chain)) {
    leafCert = x5chain[0];
  } else {
    leafCert = x5chain;
    // console.log('x5chain:', issuerAuth[1].get(COSEHEADER.X5CHAIN));
    console.log('PEM:\n', x509.convertX509BufferToPEM(x5chain));
    // const x509 = AsnParser.parse(x5chain, Certificate);
    // console.log(x509.tbsCertificate.issuer);
    // console.log(x509.tbsCertificate.subject);
    // console.log(x509.tbsCertificate.signature);
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
    data: encodeCBOR(issuerData),
    signature: issuerAuth[3],
    shaHashOverride: hashAlg,
  });

  return { verified };
}
