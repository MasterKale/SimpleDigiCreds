import { assertEquals } from '@std/assert';

import { hashDisclosure } from './hashDisclosure.ts';

Deno.test('hashes disclosure base64url strings', async () => {
  /**
   * https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-08.html#section-3.3
   */
  assertEquals(
    await hashDisclosure(
      'WyIyR0xDNDJzS1F2ZUNmR2ZyeU5STjl3IiwgImdpdmVuX25hbWUiLCAiSm9obiJd',
    ),
    'jsu9yVulwQQlhFlM_3JlzMaSFzglhQG0DpfayQwLUK4',
  );
  /**
   * Manually collected
   */
  assertEquals(
    await hashDisclosure(
      'WyJpSHd0OVg5WEpxS05CVndUM3J5NlNRIiwgImZhbWlseV9uYW1lIiwgIk11c3Rlcm1hbm4iXQ',
    ),
    '-LhyB8lV4uWuZEBgiGpWP_hfFTE0VGhR0YgQHxDU1U0',
  );
  assertEquals(
    await hashDisclosure(
      'WyIwY3d0UTBQakJvaXBhZm1la3ZnVFRnIiwgImdpdmVuX25hbWUiLCAiRXJpa2EiXQ',
    ),
    'GsDhCDilVoJBpq2PlP2EoDMR_l9eTF5vqNqcEGcbh1U',
  );
});
