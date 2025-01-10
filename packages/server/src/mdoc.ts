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
  identifier: Identifier;
  meaning: string;
  definition: string;
  presence: 'M' | 'O';
  encodingFormat: EncodingFormat[];
  characterSet?: 'latin1';
  maxLength?: number;
};

const identifiers = [
  'family_name',
  'given_name',
  'birth_date',
  'issue_date',
  'expiry_date',
  'issuing_country',
  'issuing_authority',
  'document_number',
  'portrait',
  'un_distinguishing_sign',
  'age_in_years',
  'age_birth_year',
  'age_over_NN',
] as const;
export type Identifier = typeof identifiers[number];
// Punting on age_over_NN for now
export type SupportedIdentifier = Exclude<Identifier, 'age_over_NN'>;

/**
 * Mandatory Data Elements
 *
 * - [x] family_name
 * - [x] given_name
 * - [x] birth_date
 * - [x] issue_date
 * - [x] expiry_date
 * - [x] issuing_country
 * - [x] issuing_authority
 * - [x] document_number
 * - [x] portrait
 * - [ ] driving_privileges
 * - [x] un_distinguishing_sign
 */

/**
 * Required Data Elements
 */
const dataElementFamilyName: DataElement = {
  identifier: 'family_name',
  meaning: 'Family name',
  definition: 'Last name, surname, or primary identifier, of the mDL holder',
  presence: 'M',
  encodingFormat: ['tstr'],
  characterSet: 'latin1',
  maxLength: 150,
};

const dataElementGivenName: DataElement = {
  identifier: 'given_name',
  meaning: 'Given names',
  definition: 'First name(s), other name(s), or secondary identifier, of the mDL holder',
  presence: 'M',
  encodingFormat: ['tstr'],
  characterSet: 'latin1',
  maxLength: 150,
};

const dataElementBirthDate: DataElement = {
  identifier: 'birth_date',
  meaning: 'Date of birth',
  definition:
    'Day, month, and year on which the mDL holder was born. If unknown, approximate date of birth',
  presence: 'M',
  encodingFormat: ['full-date'],
};

const dataElementIssueDate: DataElement = {
  identifier: 'issue_date',
  meaning: 'Date of issue',
  definition: 'Date when mDL was issued',
  presence: 'M',
  encodingFormat: ['tdate', 'full-date'],
};

const dataElementExpiryDate: DataElement = {
  identifier: 'expiry_date',
  meaning: 'Date of expiry',
  definition: 'Date when mDL expires',
  presence: 'M',
  encodingFormat: ['tdate', 'full-date'],
};

const dataElementIssuingCountry: DataElement = {
  identifier: 'issuing_country',
  meaning: 'Issuing country',
  definition:
    "Alpha-2 country code, as defined in ISO 3166-1, of the issuing authority's country or territory",
  presence: 'M',
  encodingFormat: ['tstr'],
};

const dataElementIssuingAuthority: DataElement = {
  identifier: 'issuing_authority',
  meaning: 'Issuing authority',
  definition: 'Issuing authority name.',
  presence: 'M',
  encodingFormat: ['tstr'],
  characterSet: 'latin1',
  maxLength: 150,
};

const dataElementDocumentNumber: DataElement = {
  identifier: 'document_number',
  meaning: 'Licence number',
  definition: 'The number assigned or calculated by the issuing authority',
  presence: 'M',
  encodingFormat: ['tstr'],
  characterSet: 'latin1',
  maxLength: 150,
};

const dataElementPortrait: DataElement = {
  identifier: 'portrait',
  meaning: 'Portrait of mDL holder',
  definition: "A reproduction of the mDL holder's portrait.",
  presence: 'M',
  encodingFormat: ['bstr'],
};

// TODO: See 7.2.4 for encoding format
// const dataElementDrivingPrivileges: DataElement = {
//   identifier: 'driving_privileges',
//   meaning: 'Categories of vehicles/restrictions/conditions',
//   definition: 'Driving privileges of the mDL holder',
//   presence: 'M',
//   encodingFormat: [],
// };

const dataElementUNDistinguishingSign: DataElement = {
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
 * - [x] age_in_years
 * - [x] age_birth_year
 * - [x] age_over_NN
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

const dataElementAgeInYears: DataElement = {
  identifier: 'age_in_years',
  meaning: 'Age attestation: How old are you (in years)?',
  definition: 'The age of the mDL holder',
  presence: 'O',
  encodingFormat: ['uint'],
};

const dataElementAgeBirthYear: DataElement = {
  identifier: 'age_birth_year',
  meaning: 'Age attestation: In what year were you born?',
  definition: 'The year when the mDL holder was born',
  presence: 'O',
  encodingFormat: ['uint'],
};

/**
 * Notes:
 * - NN is a value from 00 to 99
 * - "Provide the nearest age attestation equal to or larger than NN with value True, or smaller than NN with value False"
 * - If multiple ages are specified, return value indicates the NN CLOSEST to their actual age
 *   - Ex: "age_over_18" -> "age_over_21" is true, "age_over_35" is false -> response ONLY contains "age_over_21: true"
 *   - Ex: "age_over_18" -> "age_over_21" is true, "age_over_35" is true -> response ONLY contains "age_over_21: true"
 *   - Ex: "age_over_18" -> "age_over_21" is false, "age_over_35" is false -> response ONLY contains "age_over_21: false"
 * - Reader "shall not" request more than two age_over_NN values, and mDL/IA "should not" return more than two
 * - Request can include two age_over_NN statements to support determining whether age falls within a range
 * - When mDL does not have an age_over_NN value, mLD Reader can make back-up request with "age_in_years" and "birth_date"
 */
const dataElementAgeOverNN: DataElement = {
  identifier: 'age_over_NN',
  meaning: 'Age attestation: Nearest "true" attestation above request',
  definition: '',
  presence: 'O',
  encodingFormat: ['bool'],
};
