import { base64url } from '../../helpers/index.ts';
import { SelectiveDisclosureAlgorithm } from './types.ts';

/**
 * Compute an SD-JWT-VC disclosure's hash value as might be present in the JWT payload's `_sd` array
 */
export async function hashDisclosure(
  disclosure: string,
  algorithm: SelectiveDisclosureAlgorithm = 'sha-256',
): Promise<string> {
  const disclosureBytes = new TextEncoder().encode(disclosure);

  const disclosureHash = await crypto.subtle.digest(algorithm, disclosureBytes);
  const disclosureHashBase64URL = base64url.bufferToBase64URL(new Uint8Array(disclosureHash));

  return disclosureHashBase64URL;
}
