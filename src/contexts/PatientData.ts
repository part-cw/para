
// Data structure type delcarations based on all screens
export interface PatientData {
  // Metadata
  patientId?: string;
  admissionStartedAt: string | null;
  
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
  weight: string;
  waz: number | null;
  muac: string;
  spo2_admission: string;
 
  // Admission Clinical Data (6-60 months only) - todo - remove?
  hivStatus?: string;
  temperature?: string;
  temperatureSquared?: number | null,
  rrate?: string;
  lastHospitalized?: string;
  eyeMovement?: string; //DropdownItem | null;
  motorResponse?: string; //DropdownItem | null;
  verbalResponse?: string;//DropdownItem | null;
  bcsScore?: number | null;
  abnormalBCS?: boolean | null;

  // Admission Clinical Data (0-6 months only) - todo - remove?
  illnessDuration?: string;
  neonatalJaundice?: string;
  bulgingFontanelle?: string;
  feedingWell?: string;

  // Medical Conditions
  severeAnaemia: string;
  pneumonia: string;
  chronicIllnesses: string[];
  otherChronicIllness: string;
  diarrhea: string;
  malaria: string;
  sepsis: string;
  meningitis_encephalitis: string;
  malnutritionStatus: string;
  sickYoungInfant: boolean;
  // TODO add socialVulnerability 
  
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
  dischargeDiagnosis?: string;
  spo2_discharge?: string;
  dischargeReason?: string;
  feedingWell_discharge?: boolean;

}

export const initialPatientData: PatientData = {
  // patient information
  admissionStartedAt: null,
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

  // admission clinical data (all)
  weight: '',
  waz: null,
  muac: '',
  spo2_admission: '',
  
  // Admission Clinical Data (6-60 months only)
  // lastHospitalized: '',
  // hivStatus: '',
  // temperature: '',
  // temperatureSquared: null,
  // rrate: '',
  // eyeMovement: null,
  // motorResponse: null,
  // verbalResponse: null,
  // bcsScore: null,
  // abnormalBCS: null,

  // Admission Clinical Data (0-6 months only)
  // illnessDuration: '',
  // neonatalJaundice: null,
  // bulgingFontanelle: null,
  // feedingWell: null,

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

  // discharge info:
  // dischargeReason: '', // TODO - move to ClinicalVariables? 
  // dischargeDiagnosis: '',
  // spo2_discharge: '',
  // feedingWell_discharge: null,
};