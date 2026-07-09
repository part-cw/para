import { CategorizedMedicalConditions } from '../../../contexts/CategorizedMedicalConditions';
import { initialPatientData, PatientData } from '../../../contexts/PatientData';
import { RiskAssessment } from '../../../models/types';
import {
  buildConditionObservations,
  buildPatientBundle,
  buildPatientResource,
  buildRelatedPersonResource,
  buildRiskObservation,
} from '../fhirMapper';
import { Reference } from '../fhirTypes';

const patientRef: Reference = { reference: 'urn:uuid:test-patient' };

function makePatient(overrides: Partial<PatientData> = {}): PatientData {
  return {
    ...initialPatientData,
    patientId: 'patient-123',
    firstName: 'Jane',
    surname: 'Doe',
    otherName: 'Q',
    sex: 'female',
    dob: new Date('2024-01-15T00:00:00Z'),
    isDOBUnknown: false,
    village: 'Greenville',
    subvillage: 'Westside',
    caregiverName: 'Mary Doe',
    caregiverTel: '0700123456',
    admissionCompletedAt: '2025-03-01T10:00:00Z',
    ...overrides,
  };
}

const emptyMedicalConditions: CategorizedMedicalConditions = { positive: [], suspected: [] };

describe('buildPatientResource', () => {
  it('maps name, gender, birthDate, identifier and address', () => {
    const resource = buildPatientResource(makePatient());

    expect(resource.resourceType).toBe('Patient');
    expect(resource.identifier).toEqual([{ value: 'patient-123' }]);
    expect(resource.name).toEqual([{ given: ['Jane', 'Q'], family: 'Doe' }]);
    expect(resource.gender).toBe('female');
    expect(resource.birthDate).toBe('2024-01-15');
    expect(resource.address).toEqual([{ line: ['Westside', 'Greenville'] }]);
  });

  it('omits birthDate when DOB is unknown', () => {
    const resource = buildPatientResource(makePatient({ isDOBUnknown: true }));
    expect(resource.birthDate).toBeUndefined();
  });

  it('omits birthDate when dob is null', () => {
    const resource = buildPatientResource(makePatient({ dob: null }));
    expect(resource.birthDate).toBeUndefined();
  });

  it('omits gender when sex is not male/female', () => {
    const resource = buildPatientResource(makePatient({ sex: '' }));
    expect(resource.gender).toBeUndefined();
  });

  it('includes caregiver as an inline contact', () => {
    const resource = buildPatientResource(makePatient());
    expect(resource.contact?.[0].name?.given).toEqual(['Mary Doe']);
    expect(resource.contact?.[0].telecom).toEqual([{ system: 'phone', value: '0700123456' }]);
  });
});

describe('buildRelatedPersonResource', () => {
  it('returns null when no caregiver info', () => {
    const patient = makePatient({ caregiverName: '', caregiverTel: '' });
    expect(buildRelatedPersonResource(patient, patientRef)).toBeNull();
  });

  it('maps caregiver name, telecom and patient reference', () => {
    const resource = buildRelatedPersonResource(makePatient(), patientRef);
    expect(resource).not.toBeNull();
    expect(resource!.patient).toEqual(patientRef);
    expect(resource!.name).toEqual([{ given: ['Mary Doe'] }]);
    expect(resource!.telecom).toEqual([{ system: 'phone', value: '0700123456' }]);
  });
});

describe('buildConditionObservations', () => {
  it('produces one observation per positive and suspected condition', () => {
    const medicalConditions: CategorizedMedicalConditions = { positive: ['Pneumonia', 'Sepsis'], suspected: ['Malaria'] };
    const observations = buildConditionObservations(makePatient(), medicalConditions, patientRef);

    expect(observations).toHaveLength(3);
    expect(observations.map((o) => o.code.text)).toEqual(['Pneumonia', 'Sepsis', 'Malaria']);
    expect(observations[0].valueCodeableConcept?.text).toBe('Positive diagnosis');
    expect(observations[2].valueCodeableConcept?.text).toBe('Suspected');
    expect(observations[0].subject).toEqual(patientRef);
    expect(observations[0].effectiveDateTime).toBe('2025-03-01T10:00:00Z');
  });

  it('returns an empty array when there are no conditions', () => {
    expect(buildConditionObservations(makePatient(), emptyMedicalConditions, patientRef)).toEqual([]);
  });
});

describe('buildRiskObservation', () => {
  it('prefers the discharge category over admission', () => {
    // 0-6 month patient: admission via M6PD-C0-6, discharge via D0-6C (values from model test_cases).
    const patient = makePatient({ ageInMonths: 3.9, isUnderSixMonths: true });
    const assessment: RiskAssessment = {
      admission: { riskScore: 4.75, riskCategory: 'Moderate', model: 'M6PD-C0-6' },
      discharge: { riskScore: 22.215891293431, riskCategory: 'Very High', model: 'D0-6C' },
    };
    const observation = buildRiskObservation(patient, assessment, patientRef);
    expect(observation?.valueCodeableConcept?.text).toBe('Very High');
  });

  it('falls back to the admission category', () => {
    // 6-60 month patient: admission via Model 6-60C (values from model6-60 test_cases).
    const patient = makePatient({ ageInMonths: 43.8 });
    const assessment: RiskAssessment = {
      admission: { riskScore: 4.13, riskCategory: 'Moderate', model: 'Model 6-60C' },
    };
    const observation = buildRiskObservation(patient, assessment, patientRef);
    expect(observation?.valueCodeableConcept?.text).toBe('Moderate');
  });

  it('returns null when no risk has been calculated', () => {
    expect(buildRiskObservation(makePatient(), null, patientRef)).toBeNull();
    expect(buildRiskObservation(makePatient(), {}, patientRef)).toBeNull();
  });
});

describe('buildPatientBundle', () => {
  it('assembles a transaction bundle with consistent internal references', () => {
    const medicalConditions: CategorizedMedicalConditions = { positive: ['Pneumonia'], suspected: ['Malaria'] };
    // 6-60 month patient: admission via Model 6-60C (values from model6-60 test_cases).
    const patient = makePatient({ ageInMonths: 43.8 });
    const assessment: RiskAssessment = {
      admission: { riskScore: 11.27, riskCategory: 'Very High', model: 'Model 6-60C' },
    };

    const bundle = buildPatientBundle(patient, medicalConditions, assessment);

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('transaction');

    // Patient + RelatedPerson + 2 condition Observations + 1 risk Observation
    expect(bundle.entry).toHaveLength(5);

    const patientEntry = bundle.entry[0];
    expect(patientEntry.resource.resourceType).toBe('Patient');

    // Every dependent resource references the Patient's fullUrl.
    const patientFullUrl = patientEntry.fullUrl;
    for (const entry of bundle.entry.slice(1)) {
      const resource = entry.resource as any;
      const ref = resource.patient?.reference ?? resource.subject?.reference;
      expect(ref).toBe(patientFullUrl);
    }

    // All entries carry a POST request.
    expect(bundle.entry.every((e) => e.request?.method === 'POST')).toBe(true);
  });

  it('omits the RelatedPerson and risk entries when data is absent', () => {
    const patient = makePatient({ caregiverName: '', caregiverTel: '' });
    const bundle = buildPatientBundle(patient, emptyMedicalConditions, null);

    // Only the Patient resource remains.
    expect(bundle.entry).toHaveLength(1);
    expect(bundle.entry[0].resource.resourceType).toBe('Patient');
  });
});
