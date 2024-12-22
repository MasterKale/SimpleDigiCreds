/**
 * - CBOR structures shall be encoded according to RFC 7049.
 * - RFC 7049, section 3.9 describes four rules for canonical CBOR. Three of those rules shall be
 *   implemented for all CBOR structures as follows:
 *   - Integers (major types 0 and 1) shall be as small as possible
 *   - The expression of lengths in major types 2 through 5 shall be as short as possible
 *   - Indefinite-length items shall be made into definite-length items
 * - Because canonical map ordering is not required, all CBOR maps that are used in a cryptographic
 *   operation are communicated in a tagged CBOR bytestring. For any cryptographic operation, an
 *   mdoc, mdoc reader or issuing authority infrastructure shall use these bytestrings as they were
 *   sent or received, without attempting to re-create them from the underlying maps.
 */
