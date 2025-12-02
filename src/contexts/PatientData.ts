
// Data structure type delcarations based on all screens
export interface PatientData {
  // Metadata
  patientId?: string;
  admissionStartedAt: string | null;
  admissionCompletedAt: string | null;
  
  // Patient Information (for all ages)
  surname: string;
  firstName: string;
  otherName: string;
  sex: string;
  isUnderSixMonths: boolean;
  isNeonate: boolean | null;
  isDOBUnknown: boolean;
  isYearMonthUnknown: boolean;
  dob: Date | null;
  birthYear: string;
  birthMonth: string;
  approxAgeInYears: string;
  ageInMonths: number | null;

  
  // Admission Clinical Data (all ages)
  weight?: string;
  waz?: number | null;
  muac?: string;
  spo2_admission?: string;
 
  // Admission Clinical Data (6-60 months only)
  hivStatus?: string;
  temperature?: string;
  temperatureSquared?: number | null,
  rrate?: string;
  lastHospitalized?: string;
  eyeMovement?: string;
  motorResponse?: string;
  verbalResponse?: string;
  bcsScore?: number | null;
  abnormalBCS?: boolean | null;

  // Admission Clinical Data (0-6 months only)
  illnessDuration?: string;
  neonatalJaundice?: string;
  bulgingFontanelle?: string;
  feedingWell?: string;

  // Medical Conditions
  severeAnaemia?: string;
  pneumonia?: string;
  chronicIllnesses?: string[];
  otherChronicIllness?: string;
  diarrhea?: string;
  malaria?: string;
  sepsis?: string;
  meningitis_encephalitis?: string;
  malnutritionStatus?: string;
  sickYoungInfant?: boolean;
  
  // vhtReferral info
  village: string;
  subvillage: string;
  vhtName: string;
  vhtTelephone: string;
  
  // caregiverContact
  caregiverName: string;
  caregiverTel: string;
  confirmTel: string;
  sendReminders: boolean;
  isCaregiversPhone: boolean;

  // discharge info
  spo2_discharge?: string;
  dischargeReason?: string;
  feedingWell_discharge?: boolean;

  // status flags
  isDraftAdmission?: boolean,
  isDischarged?: boolean,
  isArchived?: boolean,
}

export const initialPatientData: PatientData = {
  // patient information
  admissionStartedAt: null,
  admissionCompletedAt: null,
  surname: '',
  firstName: '',
  otherName: '',
  sex: '',
  isUnderSixMonths: false,
  isDOBUnknown: false,
  isYearMonthUnknown: false,
  dob: null,
  birthYear: '',
  birthMonth: '',
  approxAgeInYears: '',
  ageInMonths: null,
  isNeonate: null,
  
  // medical conditions
  severeAnaemia: '',
  pneumonia: '',
  chronicIllnesses: [],
  otherChronicIllness: '',
  diarrhea: '',
  malaria: '',
  sepsis: '',
  meningitis_encephalitis: '',
  malnutritionStatus: '',
  sickYoungInfant: false,

  // vht referral information
  village: '',
  subvillage: '',
  vhtName: '',
  vhtTelephone: '',

  // caregiver info
  caregiverName: '',
  caregiverTel: '',
  confirmTel: '',
  isCaregiversPhone: false,
  sendReminders: false,

  // clinical variables:
  weight: '',
  waz: null,
  muac: '',
  spo2_admission: '',
  
  // 6-60 months
  hivStatus: '',
  temperature: '',
  temperatureSquared: null,
  rrate: '',
  lastHospitalized: '',
  eyeMovement: '',
  motorResponse: '',
  verbalResponse: '',
  bcsScore: null,
  abnormalBCS: null,
  
  // 0-6 months
  illnessDuration: '',
  neonatalJaundice: '',
  bulgingFontanelle: '',
  feedingWell: '',
  
  // discharge fields
  spo2_discharge: '',
  dischargeReason: '',
  feedingWell_discharge: undefined,
};