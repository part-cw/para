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
  birthMonth: DropdownItem | null;
  approxAge: string;
  
  // Admission Clinical Data
  hivStatus: string;
  weight: string;
  muac: string;
  temperature: string;
  rrate: string;
  spo2: string;
  heartRate: string;
  lastHospitalized: DropdownItem | null;
  eyeMovement: DropdownItem | null;
  motorResponse: DropdownItem | null;
  verbalResponse: DropdownItem | null;

  // Medical Conditions
  anaemia: DropdownItem | null;
  pneumonia: DropdownItem | null;
  chronicIllness: DropdownItem | null;
  acuteDiarrhea: DropdownItem | null;
  malaria: DropdownItem | null;
  sepsis: DropdownItem | null;
  meningitis: DropdownItem | null;
  malnutritionStatus: string;
  sickYoungInfant: boolean | null;
  
  // vhtReferral info
  village: DropdownItem | null;
  subvillage: string;
  vhtName: DropdownItem | null;
  vhtTelephone: DropdownItem | null;
  
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
  birthMonth: null,
  approxAge: '',

  // admission clinical data
  hivStatus: '',
  weight: '',
  muac: '',
  temperature: '',
  rrate: '',
  spo2: '',
  heartRate: '',
  lastHospitalized: null,
  eyeMovement: null,
  motorResponse: null,
  verbalResponse: null,

  // medical conditions
  anaemia: null,
  pneumonia: null,
  chronicIllness: null,
  acuteDiarrhea: null,
  malaria: null,
  sepsis: null,
  meningitis: null,
  malnutritionStatus: '',
  sickYoungInfant: null, // TODO - change to false?

  // vht referral information
  village: null,
  subvillage: '',
  vhtName: null,
  vhtTelephone: null,

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