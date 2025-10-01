import { DropdownItem } from "../components/SearchableDropdown";

// Data structure type delcarations based on all screens
export interface PatientData {
  // Metadata
  admissionStartedAt: string | null;
  
  // Patient Information
  surname: string;
  firstName: string;
  otherName: string;
  sex: string;
  isUnderSixMonths: boolean;
  isDOBUnknown: boolean;
  isYearMonthUnknown: boolean;
  dob: Date | null;
  birthYear: string;
  birthMonth: string;
  approxAgeInYears: string;
  ageInMonths: number | null;
  isNeonate: boolean | null;
  
  // Admission Clinical Data (all ages)
  weight: string;
  waz: number | null;
  muac: string;
  spo2: string;
 
  // Admission Clinical Data (6-60 months only)
  hivStatus: string;
  temperature: string;
  rrate: string;
  lastHospitalized: string;
  eyeMovement: DropdownItem | null;
  motorResponse: DropdownItem | null;
  verbalResponse: DropdownItem | null;
  bcsScore: number | null;
  abnormalBCS: boolean | null;

  // Admission Clinical Data (0-6 months only)
  illnessDuration: string;
  neonatalJaundice: boolean | null;
  bulgingFontanelle: boolean | null;
  feedingWell: boolean | null;

  // Medical Conditions
  anaemia: string;
  pneumonia: string;
  chronicIllness: string;
  acuteDiarrhea: string;
  malaria: string;
  sepsis: string;
  meningitis: string;
  malnutritionStatus: string;
  sickYoungInfant: boolean;
  
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
  spo2: '',
  
  // Admission Clinical Data (6-60 months only)
  lastHospitalized: '',
  hivStatus: '',
  temperature: '',
  rrate: '',
  eyeMovement: null,
  motorResponse: null,
  verbalResponse: null,
  bcsScore: null,
  abnormalBCS: null,

  // Admission Clinical Data (0-6 months only)
  illnessDuration: '',
  neonatalJaundice: null,
  bulgingFontanelle: null,
  feedingWell: null,

  // medical conditions
  anaemia: '',
  pneumonia: '',
  chronicIllness: '',
  acuteDiarrhea: '',
  malaria: '',
  sepsis: '',
  meningitis: '',
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
};