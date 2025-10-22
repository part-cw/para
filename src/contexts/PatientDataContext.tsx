import { PatientIdGenerator } from '@/src/utils/patientIdGenerator';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getModelSelectorInstance } from '../models/modelSelectorInstance';
import { ModelContext, RiskAssessment, RiskPrediction } from '../models/types';
import { getStorageInstance } from '../services/StorageInstance';
import { IStorageService } from '../services/StorageService';
import { initialPatientData, PatientData } from './PatientData';

// TODO add draft id stuff here
interface PatientDataContextType {
  patientData: PatientData;
  updatePatientData: (updates: Partial<PatientData>) => void;
  clearPatientData: () => void;
  savePatientData: () => Promise<{
      patientId: string;
      riskAssessment: RiskAssessment;
      patientName: string;}>;
  getPreviewPatientId: () => Promise<string>;
  startAdmission: () => void;
  isDataLoaded: boolean;
  handleAgeChange: (isUnderSixMonths: boolean) => void;

  calculateAdmissionRisk: () => RiskPrediction | null;
  calculateDischargeRisk: () => RiskPrediction | null;
  getCurrentRiskAssessment: () => RiskAssessment;
  riskAssessment: RiskAssessment;
}

const PatientDataContext = createContext<PatientDataContextType | undefined>(undefined);

const TEMP_STORAGE_KEY = 'temp_patient_data';
const SUBMITTED_DATA_KEY = 'submitted_patient_data';

export function PatientDataProvider({ children }: { children: ReactNode }) {
  const [patientData, setPatientData] = useState<PatientData>(initialPatientData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>({});
  const [storage] = useState<IStorageService>(() => getStorageInstance())

  const modelSelector = getModelSelectorInstance();
  // TODO use hook useRiskCalcualtion instead???

  console.log('storage', storage)

  // Load storage on app start
  useEffect(() => {
    (async () => {
      await storage.init();
      setIsDataLoaded(true);
    })(); // initialize database

    loadTempData(); // TODO remove this
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
        neonatalJaundice: null,
        bulgingFontanelle: null,
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

  const savePatientData = async (): 
    Promise<{patientId: string; riskAssessment: RiskAssessment; patientName: string;}> => {
    try {
      // Calculate final risk assessments before saving - TODO make this work with discharge risks
      // TODO - only calculate risk if we have all required info
      const finalRiskAssessment: RiskAssessment = {
        admission: calculateAdmissionRisk(),
        // discharge: calculateDischargeRisk(),
      };

      // Save to permanent storage
      const existingData = await SecureStore.getItemAsync(SUBMITTED_DATA_KEY);
      const submittedData = existingData ? JSON.parse(existingData) : [];
      
      // Generate the final patient ID using your existing generator
      const finalPatientId = await PatientIdGenerator.generatePatientId();

      // Store patient name before clearing
      const patientName = `${patientData.firstName} ${patientData.surname}`;
      
      const patientRecord = {
        ...patientData,
        patientId: finalPatientId,
        submittedAt: new Date().toISOString(),
        riskAssessment: finalRiskAssessment
      };
      
      submittedData.push(patientRecord);
      await SecureStore.setItemAsync(SUBMITTED_DATA_KEY, JSON.stringify(submittedData));
      
      console.log('✅ Patient data saved successfully!');
      console.log('📄 Patient Record:', JSON.stringify(patientRecord, null, 2));
      console.log('📊 Total submitted patients:', submittedData.length);

      // Clear temporary data
      await clearPatientData();
      
      // return finalPatientId;
      return {
        patientId: finalPatientId,
        riskAssessment: finalRiskAssessment,
        patientName 
      };
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

  const calculateAdmissionRisk = (): RiskPrediction | null => {
    const context: ModelContext = {
      isUnderSixMonths: patientData.isUnderSixMonths,
      usageTime: 'admission'
    };

    const model = modelSelector.getModel(context)
    const strategy = model && modelSelector.getStrategy(model?.modelName)

    return strategy && strategy?.calculateRisk(patientData)
  };

  const calculateDischargeRisk = (): RiskPrediction | null => {
    const context: ModelContext = {
      isUnderSixMonths: patientData.isUnderSixMonths,
      usageTime: 'discharge'
    };

    const model = modelSelector.getModel(context)
    const strategy = model && modelSelector.getStrategy(model?.modelName)

    return strategy && strategy?.calculateRisk(patientData)
  };

  const getCurrentRiskAssessment = (): RiskAssessment => {
    return riskAssessment;
  };

  // TODO - loading spinner if data not ready
  // if (!isDataLoaded) return load screen

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
        handleAgeChange,
        calculateAdmissionRisk,
        calculateDischargeRisk,
        getCurrentRiskAssessment,
        riskAssessment
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