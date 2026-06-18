/**
 * Minimal, hand-rolled FHIR (R4) resource types for the resources PARA sends to eCHIS.
 *
 * These mirror only the data PARA actually collects. Expand as needed based on what Medic can use.
 *
 * For now, we deliberately avoid an external FHIR library to keep the bundle small and dependency-free.
 */

export interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Identifier {
  system?: string;
  value?: string;
}

export interface HumanName {
  family?: string;
  given?: string[];
}

export interface ContactPoint {
  system: 'phone';
  value: string;
}

export interface Address {
  line?: string[]; // e.g. [subvillage, village]
  district?: string;
  country?: string;
}

export interface Reference {
  reference?: string; // e.g. "urn:uuid:..." or "Patient/123"
  display?: string;
}

export interface PatientContact {
  relationship?: CodeableConcept[];
  name?: HumanName;
  telecom?: ContactPoint[];
}

/** PARA only collects male/female. */
export type AdministrativeGender = 'male' | 'female';

export interface Patient {
  resourceType: 'Patient';
  identifier?: Identifier[];
  name?: HumanName[];
  gender?: AdministrativeGender;
  birthDate?: string; // YYYY-MM-DD
  address?: Address[];
  contact?: PatientContact[];
}

export interface RelatedPerson {
  resourceType: 'RelatedPerson';
  patient: Reference;
  relationship?: CodeableConcept[];
  name?: HumanName[];
  telecom?: ContactPoint[];
}

export interface Observation {
  resourceType: 'Observation';
  status: 'final';
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject: Reference;
  effectiveDateTime?: string;
  valueCodeableConcept?: CodeableConcept;
}

export type Resource = Patient | RelatedPerson | Observation;

export interface BundleEntryRequest {
  method: 'POST';
  url: string;
}

export interface BundleEntry {
  fullUrl?: string;
  resource: Resource;
  request?: BundleEntryRequest;
}

export interface Bundle {
  resourceType: 'Bundle';
  type: 'transaction';
  entry: BundleEntry[];
}
