import { verifyMDocPresentation } from './formats/mdoc/index.ts';
import { verifySDJWTPresentation } from './formats/sd-jwt-vc/index.ts';
import { base64url, isDCAPIResponse, SimpleDigiCredsError } from './helpers/index.ts';
import type { Uint8Array_, VerifiedPresentation } from './helpers/types.ts';
import type { DCAPIResponse } from './dcapi/types.ts';
import { isEncryptedDCAPIResponse } from './dcapi/isEncryptedDCAPIResponse.ts';
import { decryptDCAPIResponse } from './dcapi/decryptDCAPIResponse.ts';
import { decryptNonce } from './helpers/nonce.ts';

/**
 * Verify and return a credential presentation out of a call to the Digital Credentials API
 */
export async function verifyPresentationResponse({
  data,
  nonce,
  expectedOrigin,
  serverAESKeySecret,
}: {
  data: object | string;
  nonce: string;
  expectedOrigin: string | string[];
  serverAESKeySecret: Uint8Array_;
}): Promise<VerifiedPresentation> {
  const verifiedValues: VerifiedPresentation = {};

  // If the data is a string then parse it as JSON as the DC API sometimes returns stringified JSON
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }

  if (typeof data !== 'object') {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: `data was type ${typeof data}, not an object`,
    });
  }

  // Extract values like expiration time and privateKeyJWK from the nonce
  const { expiresOn, responseEncryptionKeys } = await decryptNonce({ nonce, serverAESKeySecret });
  const now = new Date();

  if (expiresOn < now) {
    throw new SimpleDigiCredsError({
      message: `Nonce expired at ${expiresOn.toISOString()}, current time is ${now.toISOString()}`,
      code: 'InvalidDCAPIResponse',
    });
  }

  /**
   * Presence of a private key JWK in the request metadata indicates that the response should be
   * encrypted.
   */
  if (responseEncryptionKeys?.privateKeyJWK) {
    if (!isEncryptedDCAPIResponse(data)) {
      throw new SimpleDigiCredsError({
        message: 'Response did not appear to be encrypted JWT',
        code: 'InvalidDCAPIResponse',
      });
    }

    data = await decryptDCAPIResponse(
      data.response,
      responseEncryptionKeys.privateKeyJWK,
    ) as DCAPIResponse;
  }

  if (!isDCAPIResponse(data)) {
    throw new SimpleDigiCredsError({
      message: 'data was not the expected shape',
      code: 'InvalidDCAPIResponse',
    });
  }

  let possibleOrigins: string[] = [];
  if (Array.isArray(expectedOrigin)) {
    possibleOrigins = expectedOrigin;
  } else {
    possibleOrigins = [expectedOrigin];
  }

  // We've verified the shape of the response, now verify it
  for (const key of Object.keys(data.vp_token)) {
    const presentation = data.vp_token[key];

    if (!presentation) {
      console.warn(`could not find matching response for cred id "${key}", skipping`);
      continue;
    }

    if (isMdocPresentation(presentation)) {
      const verifiedCredential = await verifyMDocPresentation({
        presentation,
        nonce,
        possibleOrigins,
        verifierPublicKeyJWK: responseEncryptionKeys?.publicKeyJWK,
      });

      verifiedValues[key] = verifiedCredential;
    } else if (isSDJWTPresentation(presentation)) {
      const verifiedCredential = await verifySDJWTPresentation({
        presentation,
        nonce,
        possibleOrigins,
      });

      verifiedValues[key] = verifiedCredential;
    } else {
      throw new SimpleDigiCredsError({
        message: `Could not determine type of presentation for "${key}"`,
        code: 'InvalidDCAPIResponse',
      });
    }
  }

  return verifiedValues;
}

/**
 * Type guard to make sure a query is for an mDL
 */
function isMdocPresentation(presentation: string): boolean {
  // Best I can come up with is to make sure it's a base64url string. JWT periods and SD-JWT tildes
  // will definitely fail this test.
  return base64url.isBase64URLString(presentation);
}

/**
 * Type guard to make sure a query is for an SD-JWT
 */
function isSDJWTPresentation(presentation: string): boolean {
  // JWTs are two periods each, with a KB JWT there can be up to four matches
  const jwtSeparators = presentation.match(/\./g);
  // SD-JWTs have at least one match in the worst case of no disclosures and no KB JWT
  const sdJWTVCSeparators = presentation.match(/~/g);

  return !!(
    jwtSeparators && jwtSeparators.length >= 2 &&
    sdJWTVCSeparators && sdJWTVCSeparators.length >= 1
  );
}
