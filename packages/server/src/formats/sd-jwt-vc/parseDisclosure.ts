import { base64url, SimpleDigiCredsError } from '../../helpers/index.ts';
import type { DisclosureArrayElement, DisclosureObjectProperty } from './types.ts';

/**
 * Take a base64url-encoded disclosure from an SD-JWT-VC and parse it into JSON
 */
export function parseDisclosure(
  disclosure: string,
): DisclosureArrayElement | DisclosureObjectProperty {
  if (typeof disclosure !== 'string' || !base64url.isBase64URLString(disclosure)) {
    throw new SimpleDigiCredsError({
      message: 'Disclosure was not a base64url-encoded string',
      code: 'SDJWTVerificationError',
    });
  }

  const disclosureBytes = base64url.base64URLToBuffer(disclosure);
  const disclosureString = new TextDecoder().decode(disclosureBytes);

  const disclosureJSON = JSON.parse(disclosureString);

  if (!Array.isArray(disclosureJSON)) {
    throw new SimpleDigiCredsError({
      message: `Parsed disclosure ${disclosureString} is not an array`,
      code: 'SDJWTVerificationError',
    });
  }

  if (disclosureJSON.length === 2) {
    return disclosureJSON as DisclosureArrayElement;
  }

  if (disclosureJSON.length === 3) {
    return disclosureJSON as DisclosureObjectProperty;
  }

  throw new SimpleDigiCredsError({
    message: `Parsed disclosure ${disclosureString} did not have the expected number of elements`,
    code: 'SDJWTVerificationError',
  });
}

/**
 * Help understand when a parsed disclosure is an Object Property
 */
export function isDisclosureObjectProperty(
  disclosure: DisclosureObjectProperty | DisclosureArrayElement,
): disclosure is DisclosureObjectProperty {
  return Array.isArray(disclosure) && disclosure.length === 3;
}

/**
 * Help understand when a parsed disclosure is an Array Element
 */
export function isDisclosureArrayElement(
  disclosure: DisclosureObjectProperty | DisclosureArrayElement,
): disclosure is DisclosureArrayElement {
  return Array.isArray(disclosure) && disclosure.length === 2;
}
