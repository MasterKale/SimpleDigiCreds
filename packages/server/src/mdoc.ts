/**
 * 7.1 mDL document type and namespace
 */
export type NamespaceMDLv1 = 'org.iso.18013.5.1';
export type DocumentTypeMDLv1 = `${NamespaceMDLv1}.mDL`;

/**
 * 7.2.1 Overview
 *
 * RFC 8610 defines the following types (https://www.rfc-editor.org/rfc/rfc8610):
 *
 * - tstr
 * - uint
 * - bstr
 * - bool
 * - tdate
 *   - "shall contain a date-time string as specified in RFC 3339"
 *   - https://www.rfc-editor.org/rfc/rfc3339
 *     - date-fullyear   = 4DIGIT
 *     - date-month      = 2DIGIT  ; 01-12
 *     - date-mday       = 2DIGIT  ; 01-28, 01-29, 01-30, 01-31 based on
 *     -                            ; month/year
 *     - time-hour       = 2DIGIT  ; 00-23
 *     - time-minute     = 2DIGIT  ; 00-59
 *     - time-second     = 2DIGIT  ; 00-58, 00-59, 00-60 based on leap second
 *     -                            ; rules
 *     - time-secfrac    = "." 1*DIGIT
 *     - time-numoffset  = ("+" / "-") time-hour ":" time-minute
 *     - time-offset     = "Z" / time-numoffset
 *     -
 *     - partial-time    = time-hour ":" time-minute ":" time-second
 *     -                   [time-secfrac]
 *     - full-date       = date-fullyear "-" date-month "-" date-mday
 *     - full-time       = partial-time time-offset
 *     -
 *     - date-time       = full-date "T" full-time
 *   - "YYYY-MM-DDT00:00:00Z" (a.k.a. ISO8601)
 * - full-date = #6.1004(tstr), ("tag 1004 is specified in RFC 8943")
 *   - RFC 8943 - Concise Binary Object Representation (CBOR) Tags for Date
 *   - https://www.rfc-editor.org/rfc/rfc8943
 *   - "YYYY-MM-DD"
 *
 * Dates
 *   - No fraction of seconds
 *   - Use UTC only, so "Z" for time-offset
 */
export type tstr = string;
export type uint = number;
export type bstr = Uint8Array;
export type bool = boolean;
export type tdate = string; // "YYYY-MM-DD"
export type fulldate = string; // "YYYY-MM-DDT00:00:00Z" (a.k.a. ISO8601)

/**
 * 7.2 mDL Data - Table 5 - Data Elements
 */
type EncodingFormat = 'tstr' | 'uint' | 'bstr' | 'bool' | 'tdate' | 'full-date';
type DataElement = {
  identifier: string;
  meaning: string;
  definition: string;
  presence: 'M' | 'O';
  encodingFormat: EncodingFormat[];
  characterSet?: 'latin1';
  maxLength?: number;
};

/**
 * Required Data Elements
 */
const DataElementFamilyName: DataElement = {
  identifier: 'family_name',
  meaning: 'Family name',
  definition: 'Last name, surname, or primary identifier, of the mDL holder',
  presence: 'M',
  encodingFormat: ['tstr'],
  characterSet: 'latin1',
  maxLength: 150,
};

const DataElementGivenName: DataElement = {
  identifier: 'given_name',
  meaning: 'Given names',
  definition: 'First name(s), other name(s), or secondary identifier, of the mDL holder',
  presence: 'M',
  encodingFormat: ['tstr'],
  characterSet: 'latin1',
  maxLength: 150,
};

const DataElementBirthDate: DataElement = {
  identifier: 'birth_date',
  meaning: 'Date of birth',
  definition:
    'Day, month, and year on which the mDL holder was born. If unknown, approximate date of birth',
  presence: 'M',
  encodingFormat: ['full-date'],
};

const DataElementIssueDate: DataElement = {
  identifier: 'issue_date',
  meaning: 'Date of issue',
  definition: 'Date when mDL was issued',
  presence: 'M',
  encodingFormat: ['tdate', 'full-date'],
};

const DataElementExpiryDate: DataElement = {
  identifier: 'expiry_date',
  meaning: 'Date of expiry',
  definition: 'Date when mDL expires',
  presence: 'M',
  encodingFormat: ['tdate', 'full-date'],
};

const DataElementIssuingCountry: DataElement = {
  identifier: 'issuing_country',
  meaning: 'Issuing country',
  definition:
    "Alpha-2 country code, as defined in ISO 3166-1, of the issuing authority's country or territory",
  presence: 'M',
  encodingFormat: ['tstr'],
};

const DataElementIssuingAuthority: DataElement = {
  identifier: 'issuing_authority',
  meaning: 'Issuing authority',
  definition: 'Issuing authority name.',
  presence: 'M',
  encodingFormat: ['tstr'],
  characterSet: 'latin1',
  maxLength: 150,
};

const DataElementDocumentNumber: DataElement = {
  identifier: 'document_number',
  meaning: 'Licence number',
  definition: 'The number assigned or calculated by the issuing authority',
  presence: 'M',
  encodingFormat: ['tstr'],
  characterSet: 'latin1',
  maxLength: 150,
};

const DataElementPortrait: DataElement = {
  identifier: 'portrait',
  meaning: 'Portrait of mDL holder',
  definition: "A reproduction of the mDL holder's portrait.",
  presence: 'M',
  encodingFormat: ['bstr'],
};

// TODO: See 7.2.4 for encoding format
// const DataElementDrivingPrivileges: DataElement = {
//   identifier: 'driving_privileges',
//   meaning: 'Categories of vehicles/restrictions/conditions',
//   definition: 'Driving privileges of the mDL holder',
//   presence: 'M',
//   encodingFormat: [],
// };

const DataElementUNDistinguishingSign: DataElement = {
  identifier: 'un_distinguishing_sign',
  meaning: 'UN distinguishing sign',
  definition:
    'Distinguishing sign of the issuing country according to ISO/IEC 18013-1:2018, Annex F.',
  presence: 'M',
  encodingFormat: ['tstr'],
};

/**
 * Optional Data Elements
 *
 * - [ ] administrative_number
 * - [ ] sex
 * - [ ] height
 * - [ ] weight
 * - [ ] eye_colour
 * - [ ] hair_colour
 * - [ ] birth_place
 * - [ ] resident_address
 * - [ ] portrait_capture_date
 * - [ ] age_in_years
 * - [ ] age_birth_year
 * - [ ] age_over_NN
 * - [ ] issuing_jurisdiction
 * - [ ] nationality
 * - [ ] resident_city
 * - [ ] resident_state
 * - [ ] resident_postal_code
 * - [ ] resident_country
 * - [ ] family_name_national_character
 * - [ ] given_name_national_character
 * - [ ] signature_usual_mark
 */

// const DataElement: DataElement = {
//   identifier: '',
//   meaning: '',
//   definition: '',
//   presence: 'M',
// };
