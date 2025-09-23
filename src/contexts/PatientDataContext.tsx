// src/contexts/PatientDataContext.tsx
import { PatientIdGenerator } from '@/src/utils/patientIdGenerator';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { DropdownItem } from '../components/SearchableDropdown';

// Define your data structure based on all screens
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
  neonatalJaundice: string;
  bulgingFontanelle: string; // TODO - change to boolean
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

const initialPatientData: PatientData = {
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
  neonatalJaundice: '',
  bulgingFontanelle: '', // TODO - change to boolean?
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

interface PatientDataContextType {
  patientData: PatientData;
  updatePatientData: (updates: Partial<PatientData>) => void;
  clearPatientData: () => void;
  savePatientData: () => Promise<string>;
  getPreviewPatientId: () => Promise<string>;
  startAdmission: () => void;
  isDataLoaded: boolean;
  handleAgeChange: (isUnderSixMonths: boolean) => void;
}

const PatientDataContext = createContext<PatientDataContextType | undefined>(undefined);

const TEMP_STORAGE_KEY = 'temp_patient_data';
const SUBMITTED_DATA_KEY = 'submitted_patient_data';

export function PatientDataProvider({ children }: { children: ReactNode }) {
  const [patientData, setPatientData] = useState<PatientData>(initialPatientData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load temporary data on app start
  useEffect(() => {
    loadTempData();
  }, []);

  const loadTempData = async () => {
    try {
      const tempData = await SecureStore.getItemAsync(TEMP_STORAGE_KEY);
      if (tempData) {
        const parsedData = JSON.parse(tempData);
        // Convert date strings back to Date objects
        if (parsedData.dob) {
          parsedData.dob = new Date(parsedData.dob);
        }
        setPatientData(parsedData);
      }
    } catch (error) {
      console.error('Error loading temp data:', error);
    } finally {
      setIsDataLoaded(true);
    }
  };

  const updatePatientData = async (updates: Partial<PatientData>) => {
    const newData = { ...patientData, ...updates };
    setPatientData(newData);
    
    // Auto-save to temporary storage
    try {
      await SecureStore.setItemAsync(TEMP_STORAGE_KEY, JSON.stringify(newData));
      console.log('🔄 Auto-saved patient data:', JSON.stringify(updates, null, 2));
    } catch (error) {
      console.error('Error auto-saving data:', error);
    }
  };

  const handleAgeChange = async (isUnderSixMonths: boolean) => {
    if (isUnderSixMonths) {
      // Clear 6-60 months specific fields
      const updates = {
        isUnderSixMonths,
        hivStatus: '',
        temperature: '',
        rrate: '',
        lastHospitalized: '',
        eyeMovement: null,
        motorResponse: null,
        verbalResponse: null,
      };
      await updatePatientData(updates);
    } else {
      // Clear 0-6 months specific fields
      const updates = {
        isUnderSixMonths,
        illnessDuration: '',
        neonatalJaundice: '',
        bulgingFontanelle: '',
        feedingWell: null,
      };
      await updatePatientData(updates);
    }
  };

  const clearPatientData = async () => {
    setPatientData(initialPatientData);
    try {
      await SecureStore.deleteItemAsync(TEMP_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing temp data:', error);
    }
  };

  const savePatientData = async (): Promise<string> => {
    try {
      // Save to permanent storage
      const existingData = await SecureStore.getItemAsync(SUBMITTED_DATA_KEY);
      const submittedData = existingData ? JSON.parse(existingData) : [];
      
      // Generate the final patient ID using your existing generator
      const finalPatientId = await PatientIdGenerator.generatePatientId();
      
      const patientRecord = {
        ...patientData,
        patientId: finalPatientId,
        submittedAt: new Date().toISOString(),
      };
      
      submittedData.push(patientRecord);
      await SecureStore.setItemAsync(SUBMITTED_DATA_KEY, JSON.stringify(submittedData));
      
      console.log('✅ Patient data saved successfully!');
      console.log('📄 Patient Record:', JSON.stringify(patientRecord, null, 2));
      console.log('📊 Total submitted patients:', submittedData.length);

      // Clear temporary data
      await clearPatientData();
      
      return finalPatientId;
    } catch (error) {
      console.error('Error saving patient data:', error);
      throw error;
    }
  };

  const getPreviewPatientId = async (): Promise<string> => {
    return await PatientIdGenerator.getPreviewPatientId();
  };

  const startAdmission = () => {
    if (!patientData.admissionStartedAt) {
      updatePatientData({ admissionStartedAt: new Date().toISOString() });
    }
  };

   // Debug functions for testing
//   const getAllSubmittedPatients = async (): Promise<any[]> => {
//     try {
//       const existingData = await SecureStore.getItemAsync(SUBMITTED_DATA_KEY);
//       return existingData ? JSON.parse(existingData) : [];
//     } catch (error) {
//       console.error('Error getting submitted patients:', error);
//       return [];
//     }
//   };

//   const clearAllSubmittedPatients = async (): Promise<void> => {
//     try {
//       await SecureStore.deleteItemAsync(SUBMITTED_DATA_KEY);
//       console.log('All submitted patients cleared');
//     } catch (error) {
//       console.error('Error clearing submitted patients:', error);
//     }
//   };

//   const getTempPatientData = async (): Promise<any> => {
//     try {
//       const tempData = await SecureStore.getItemAsync(TEMP_STORAGE_KEY);
//       return tempData ? JSON.parse(tempData) : null;
//     } catch (error) {
//       console.error('Error getting temp data:', error);
//       return null;
//     }
//   };

  return (
    <PatientDataContext.Provider
      value={{
        patientData,
        updatePatientData,
        clearPatientData,
        savePatientData,
        getPreviewPatientId,
        startAdmission,
        isDataLoaded,
        handleAgeChange
        // getAllSubmittedPatients,
        // clearAllSubmittedPatients,
        // getTempPatientData,
      }}
    >
      {children}
    </PatientDataContext.Provider>
  );
}

export const usePatientData = () => {
  const context = useContext(PatientDataContext);
  if (context === undefined) {
    throw new Error('usePatientData must be used within a PatientDataProvider');
  }
  return context;
};