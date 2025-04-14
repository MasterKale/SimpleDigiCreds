import { assertEquals } from '@std/assert';

import { parseDisclosure } from './parseDisclosure.ts';

Deno.test('parse typical disclosures', () => {
  const disclosure1 = parseDisclosure(
    'WyJpSHd0OVg5WEpxS05CVndUM3J5NlNRIiwgImZhbWlseV9uYW1lIiwgIk11c3Rlcm1hbm4iXQ',
  );

  assertEquals(disclosure1, ['iHwt9X9XJqKNBVwT3ry6SQ', 'family_name', 'Mustermann']);

  const disclosure2 = parseDisclosure(
    'WyIwY3d0UTBQakJvaXBhZm1la3ZnVFRnIiwgImdpdmVuX25hbWUiLCAiRXJpa2EiXQ',
  );

  assertEquals(disclosure2, ['0cwtQ0PjBoipafmekvgTTg', 'given_name', 'Erika']);
});
