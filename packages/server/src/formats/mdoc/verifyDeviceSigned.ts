import { CBORTag, decodeCBOR, encodeCBOR } from '@levischuck/tiny-cbor';

import type { DCAPIRequestOID4VP } from '../../dcapi.ts';
import { generateSessionTranscript } from './generateSessionTranscript.ts';
import { verifyEC2 } from '../../helpers/verifyEC2.ts';
import { COSEALG, COSEHEADER, COSEKEYS, isCOSEPublicKeyEC2 } from '../../cose.ts';
import type {
  DecodedDocument,
  MdocCOSESign1SigStructure,
  MdocIssuerAuthProtected,
  MobileSecurityObject,
} from './types.ts';
import { SimpleDigiCredsError } from '../../helpers/simpleDigiCredsError.ts';

export async function verifyDeviceSigned(
  document: DecodedDocument,
  request: DCAPIRequestOID4VP,
) {
  const issuerSigned = document.get('issuerSigned');
  const deviceSigned = document.get('deviceSigned');
  // console.log('deviceSigned:', deviceSigned);
  const issuerAuth = issuerSigned.get('issuerAuth');

  // These bytes were provably signed above during IssuerAuth verification
  const decodedMSOBytes = decodeCBOR(issuerAuth[2]) as CBORTag;
  const decodedMSO = decodeCBOR(decodedMSOBytes.value as Uint8Array) as MobileSecurityObject;

  // console.log('decodedMSO:', decodedMSO);
  // TODO: Validate `decodedMSO.validityInfo.validFrom` and `decodedMSO.validityInfo.validUntil`

  const documentDocType = document.get('docType');
  const decodedMSODocType = decodedMSO.get('docType');
  if (decodedMSODocType !== documentDocType) {
    throw new SimpleDigiCredsError({
      message: `mso docType "${decodedMSODocType}" did not match doc docType "${documentDocType}"`,
      code: 'MdocVerificationError',
    });
  }

  const sessionTranscript = await generateSessionTranscript(request);

  const deviceSignedNameSpaces = deviceSigned.get('nameSpaces');

  /**
   * The shape of this is defined in mdoc
   */
  const deviceAuthentication = [
    'DeviceAuthentication',
    sessionTranscript,
    document.get('docType'),
    deviceSignedNameSpaces,
  ];
  const deviceAuthenticationCBOR = encodeCBOR(deviceAuthentication);
  const deviceAuthenticationCBORBstr = encodeCBOR(new CBORTag(24, deviceAuthenticationCBOR));

  const deviceAuth = deviceSigned.get('deviceAuth');
  const deviceSignature = deviceAuth.get('deviceSignature');

  const deviceData: MdocCOSESign1SigStructure = [
    'Signature1',
    deviceSignature[0],
    new Uint8Array(),
    deviceAuthenticationCBORBstr,
  ];

  const deviceKeyInfo = decodedMSO.get('deviceKeyInfo');
  const devicePublicKey = deviceKeyInfo.get('deviceKey');

  // Add a default alg if it's missing (`digestAlg` will override it within verifyEC2())
  if (!devicePublicKey.get(COSEKEYS.alg)) {
    devicePublicKey.set(COSEKEYS.alg, COSEALG.ES256);
  }

  if (!isCOSEPublicKeyEC2(devicePublicKey)) {
    throw new SimpleDigiCredsError({
      message: `Unsupported public key type ${devicePublicKey.get(COSEKEYS.kty)}`,
      code: 'MdocVerificationError',
    });
  }

  const decodedMdocIssuerAuthProtected = decodeCBOR(issuerAuth[0]) as MdocIssuerAuthProtected;
  const hashAlg = decodedMdocIssuerAuthProtected.get(COSEHEADER.ALG);

  const verified = await verifyEC2({
    cosePublicKey: devicePublicKey,
    data: encodeCBOR(deviceData),
    signature: deviceSignature[3],
    shaHashOverride: hashAlg,
  });

  return { verified };
}
