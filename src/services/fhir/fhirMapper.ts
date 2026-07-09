/**
 * Converts PARA app data into FHIR (R4) resources for transmission to eCHIS.
 *
 * Pure functions only (no I/O), so they're easy to unit-test. Fields produced: one Patient, an optional RelatedPerson (caregiver),
 * and one Observation per positive/suspected condition plus one for the risk category.
 */

import { CategorizedMedicalConditions } from '../../contexts/CategorizedMedicalConditions';
import { PatientData } from '../../contexts/PatientData';
import { RiskAssessment } from '../../models/types';
import {
  Address,
  AdministrativeGender,
  Bundle,
  BundleEntry,
  CodeableConcept,
  ContactPoint,
  HumanName,
  Observation,
  Patient,
  Reference,
  RelatedPerson,
} from './fhirTypes';

/** RFC4122-ish v4 UUID. Sufficient for bundle-internal references in this example payload. */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function buildName(patient: PatientData): HumanName | null {
  const given = [patient.firstName, patient.otherName].map((s) => s?.trim()).filter(Boolean) as string[];
  const family = patient.surname?.trim();
  if (given.length === 0 && !family) return null;

  const name: HumanName = {};
  if (given.length > 0) name.given = given;
  if (family) name.family = family;
  return name;
}

function normalizeGender(sex: string): AdministrativeGender | undefined {
  const s = sex?.trim().toLowerCase();
  if (s === 'male' || s === 'female') return s;
  return undefined;
}

/** PARA stores dob as a Date, but it may come back from SQLite as an ISO string. */
function toBirthDate(patient: PatientData): string | undefined {
  if (patient.isDOBUnknown || !patient.dob) return undefined;
  const date = new Date(patient.dob);
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function buildAddress(patient: PatientData): Address | null {
  const line = [patient.subvillage, patient.village].map((s) => s?.trim()).filter(Boolean) as string[];
  if (line.length === 0) return null;
  return { line };
}

function buildCaregiverTelecom(patient: PatientData): ContactPoint[] | undefined {
  const tel = patient.caregiverTel?.trim();
  return tel ? [{ system: 'phone', value: tel }] : undefined;
}

export function buildPatientResource(patient: PatientData): Patient {
  const resource: Patient = { resourceType: 'Patient' };

  if (patient.patientId) {
    resource.identifier = [{ value: patient.patientId }];
  }

  const name = buildName(patient);
  if (name) resource.name = [name];

  const gender = normalizeGender(patient.sex);
  if (gender) resource.gender = gender;

  const birthDate = toBirthDate(patient);
  if (birthDate) resource.birthDate = birthDate;

  const address = buildAddress(patient);
  if (address) resource.address = [address];

  // Caregiver as an in-line contact (alternative/complement to the RelatedPerson resource).
  const caregiverName = patient.caregiverName?.trim();
  const caregiverTelecom = buildCaregiverTelecom(patient);
  if (caregiverName || caregiverTelecom) {
    resource.contact = [
      {
        relationship: [{ text: 'Caregiver' }],
        ...(caregiverName ? { name: { given: [caregiverName] } } : {}),
        ...(caregiverTelecom ? { telecom: caregiverTelecom } : {}),
      },
    ];
  }

  return resource;
}

/**
 * Optional caregiver resource. Returns null when no caregiver info is present.
 * patientRef should point at the Patient resource (e.g. its bundle fullUrl).
 */
export function buildRelatedPersonResource(
  patient: PatientData,
  patientRef: Reference
): RelatedPerson | null {
  const caregiverName = patient.caregiverName?.trim();
  const telecom = buildCaregiverTelecom(patient);
  if (!caregiverName && !telecom) return null;

  const resource: RelatedPerson = {
    resourceType: 'RelatedPerson',
    patient: patientRef,
    relationship: [{ text: 'Caregiver' }],
  };
  if (caregiverName) resource.name = [{ given: [caregiverName] }];
  if (telecom) resource.telecom = telecom;
  return resource;
}

const CONDITION_STATUS_SYSTEM = 'http://terminology.hl7.org/CodeSystem/condition-clinical';

function buildConditionObservation(
  condition: string,
  status: 'positive' | 'suspected',
  patientRef: Reference,
  effectiveDateTime?: string
): Observation {
  const value: CodeableConcept =
    status === 'positive'
      ? { coding: [{ system: CONDITION_STATUS_SYSTEM, code: 'active', display: 'Active' }], text: 'Positive diagnosis' }
      : { text: 'Suspected' };

  return {
    resourceType: 'Observation',
    status: 'final',
    category: [{ text: 'Diagnosis' }],
    // TODO: map condition names to SNOMED-CT codes
    code: { text: condition },
    subject: patientRef,
    ...(effectiveDateTime ? { effectiveDateTime } : {}),
    valueCodeableConcept: value,
  };
}

/** One Observation per positive and suspected targeted medical condition. */
export function buildConditionObservations(
  patient: PatientData,
  medicalConditions: CategorizedMedicalConditions,
  patientRef: Reference
): Observation[] {
  const effectiveDateTime = patient.admissionCompletedAt ?? undefined;
  return [
    ...medicalConditions.positive.map((c) => buildConditionObservation(c, 'positive', patientRef, effectiveDateTime)),
    ...medicalConditions.suspected.map((c) => buildConditionObservation(c, 'suspected', patientRef, effectiveDateTime)),
  ];
}

/**
 * One Observation for the computed risk category. Prefers the discharge category when
 * present, otherwise the admission category (mirrors handleGetRiskCategory in patientRecords).
 * Returns null when no risk has been calculated.
 */
export function buildRiskObservation(
  patient: PatientData,
  riskAssessment: RiskAssessment | null | undefined,
  patientRef: Reference
): Observation | null {
  const prediction = riskAssessment?.discharge ?? riskAssessment?.admission;
  if (!prediction?.riskCategory) return null;

  return {
    resourceType: 'Observation',
    status: 'final',
    category: [{ text: 'Risk assessment' }],
    code: { text: 'Mortality risk category' },
    subject: patientRef,
    ...(patient.admissionCompletedAt ? { effectiveDateTime: patient.admissionCompletedAt } : {}),
    valueCodeableConcept: { text: prediction.riskCategory },
  };
}

/**
 * Assembles a FHIR transaction Bundle: Patient + optional RelatedPerson + condition
 * Observations + risk Observation, with internal references wired via urn:uuid fullUrls.
 */
export function buildPatientBundle(
  patient: PatientData,
  medicalConditions: CategorizedMedicalConditions,
  riskAssessment: RiskAssessment | null | undefined
): Bundle {
  const patientFullUrl = `urn:uuid:${uuid()}`;
  const patientRef: Reference = { reference: patientFullUrl };

  const entries: BundleEntry[] = [
    {
      fullUrl: patientFullUrl,
      resource: buildPatientResource(patient),
      request: { method: 'POST', url: 'Patient' },
    },
  ];

  const relatedPerson = buildRelatedPersonResource(patient, patientRef);
  if (relatedPerson) {
    entries.push({
      fullUrl: `urn:uuid:${uuid()}`,
      resource: relatedPerson,
      request: { method: 'POST', url: 'RelatedPerson' },
    });
  }

  for (const observation of buildConditionObservations(patient, medicalConditions, patientRef)) {
    entries.push({
      fullUrl: `urn:uuid:${uuid()}`,
      resource: observation,
      request: { method: 'POST', url: 'Observation' },
    });
  }

  const riskObservation = buildRiskObservation(patient, riskAssessment, patientRef);
  if (riskObservation) {
    entries.push({
      fullUrl: `urn:uuid:${uuid()}`,
      resource: riskObservation,
      request: { method: 'POST', url: 'Observation' },
    });
  }

  return { resourceType: 'Bundle', type: 'transaction', entry: entries };
}
