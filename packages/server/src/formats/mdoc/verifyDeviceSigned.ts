import { CBORTag, decodeCBOR, encodeCBOR } from '@levischuck/tiny-cbor';

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
import type { Uint8Array_ } from '../../helpers/types.ts';

export async function verifyDeviceSigned({
  document,
  nonce,
  possibleOrigins,
  verifierPublicKeyJWK,
}: {
  document: DecodedDocument;
  nonce: string;
  possibleOrigins: string[];
  verifierPublicKeyJWK?: JsonWebKey;
}): Promise<VerifiedDeviceSigned> {
  const issuerSigned = document.get('issuerSigned');
  const deviceSigned = document.get('deviceSigned');
  const issuerAuth = issuerSigned.get('issuerAuth');

  // These bytes were provably signed above during IssuerAuth verification
  const decodedMSOBytes = decodeCBOR(issuerAuth[2]) as CBORTag;
  const decodedMSO = decodeCBOR(decodedMSOBytes.value as Uint8Array_) as MobileSecurityObject;

  // Make sure the credential is chronologically valid
  const validityInfo = decodedMSO.get('validityInfo');
  const validFrom = validityInfo.get('validFrom').value as string;
  const validUntil = validityInfo.get('validUntil').value as string;
  const signed = validityInfo.get('signed').value as string;

  const dateValidFrom = new Date(Date.parse(validFrom));
  const dateValidUntil = new Date(Date.parse(validUntil));
  const now = new Date(Date.now());

  if (dateValidFrom > now || dateValidUntil < now) {
    throw new SimpleDigiCredsError({
      message: `Credential is not yet valid or is expired`,
      code: 'MdocVerificationError',
    });
  }

  const documentDocType = document.get('docType');
  const decodedMSODocType = decodedMSO.get('docType');
  if (decodedMSODocType !== documentDocType) {
    throw new SimpleDigiCredsError({
      message: `mso docType "${decodedMSODocType}" did not match doc docType "${documentDocType}"`,
      code: 'MdocVerificationError',
    });
  }

  let verified: boolean = false;
  let verifiedOrigin: string = '';
  for (const origin of possibleOrigins) {
    const sessionTranscript = await generateSessionTranscript(
      origin,
      nonce,
      verifierPublicKeyJWK,
    );

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
    const deviceAuthenticationCBORBstr = encodeCBOR(
      new CBORTag(24, deviceAuthenticationCBOR),
    ) as Uint8Array_;

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

    verified = await verifyEC2({
      cosePublicKey: devicePublicKey,
      data: encodeCBOR(deviceData) as Uint8Array_,
      signature: deviceSignature[3],
      shaHashOverride: hashAlg,
    });

    if (verified) {
      verifiedOrigin = origin;
      break;
    }
  }

  if (!verifiedOrigin) {
    throw new SimpleDigiCredsError({
      message:
        'DeviceSigned could not be verified with any combination of expected origin and nonce',
      code: 'MdocVerificationError',
    });
  }

  return {
    verified,
    verifiedOrigin,
    issuedAt: new Date(Date.parse(signed)),
    validFrom: dateValidFrom,
    expiresOn: dateValidUntil,
  };
}

type VerifiedDeviceSigned = {
  verified: boolean;
  verifiedOrigin: string;
  issuedAt: Date;
  validFrom: Date;
  expiresOn: Date;
};
