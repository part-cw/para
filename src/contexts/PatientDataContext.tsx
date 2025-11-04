import { PatientIdGenerator } from '@/src/utils/patientIdGenerator';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getModelSelectorInstance } from '../models/modelSelectorInstance';
import { ModelContext, RiskAssessment, RiskPrediction } from '../models/types';
import { initialPatientData, PatientData } from './PatientData';
import { useStorage } from './StorageContext';

interface PatientDataContextType {
  patientData: PatientData;
  updatePatientData: (updates: Partial<PatientData>) => void;
  clearPatientData: () => void;
  savePatientData: () => Promise<{
      patientId: string;
      riskAssessment: RiskAssessment;
      patientName: string;}>;
  startAdmission: () => void;
  loadDraft: (patientId: string) => Promise<void>;
  isDataLoaded: boolean;
  handleAgeChange: (isUnderSixMonths: boolean) => void;
  calculateAdmissionRisk: () => RiskPrediction | null;
  calculateDischargeRisk: () => RiskPrediction | null;
  getCurrentRiskAssessment: () => RiskAssessment;
  getCurrentPatientId: () => string | null;
  riskAssessment: RiskAssessment;
}

const PatientDataContext = createContext<PatientDataContextType | undefined>(undefined);

export function PatientDataProvider({ children }: { children: ReactNode }) {
  const [patientData, setPatientData] = useState<PatientData>(initialPatientData);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(true);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>({});
  
  const { storage, isInitialized } = useStorage();
  const modelSelector = getModelSelectorInstance();


  // Autosave draft whenever patientData changes, wait 1000 ms
  useEffect(() => {
    if (!isInitialized || !currentPatientId) return;

    // Only save if user has entered at least SOME required data
    const hasMinimalData = 
        patientData.surname || 
        patientData.firstName || 
        patientData.sex;

    if (!hasMinimalData) {
        console.log('⏳ Skipping auto-save - no data entered yet');
        return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        await storage.saveDraft(patientData, currentPatientId);
        console.log('🔄 Auto-saved draft:', currentPatientId);
      } catch (error) {
        console.error('Error auto-saving draft:', error);
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timeoutId);
  }, [patientData, isDataLoaded, currentPatientId]);

  /**
   * Initialize patient workflow - called when user starts adding a patient
   * This is the ONLY place that should load or create drafts
   */
  const startAdmission = async () => {
    // If we already have a patient loaded, don't do anything
    if (currentPatientId) {
      console.log('📋 Patient already loaded:', currentPatientId);
      return;
    }

    try {
      setIsDataLoaded(false);
      await createNewDraft();
      
      // Check for existing drafts
      // const drafts = await storage.getDraftPatients();

      // if (drafts.length > 0) {
        // Load most recent draft
      //   const mostRecent = drafts[0];
      //   setPatientData(mostRecent);
      //   setCurrentPatientId(mostRecent.patientId!);
      //   console.log('📂 Loaded existing draft:', mostRecent.patientId);
      // } else {
      //   // Create new draft with final patient ID
      //   await createNewDraft();
      // }
    } catch (error) {
      console.error('Error starting admission:', error);
      throw error;
      // Still create a new draft as fallback
      // await createNewDraft();
    } finally {
      setIsDataLoaded(true);
    }
  };

  const createNewDraft = async () => {
    try {
      const patientId = await PatientIdGenerator.generatePatientId();
      const newDraftData = {
        ...initialPatientData,
        patientId: patientId,
        admissionStartedAt: new Date().toISOString()
      };

      setCurrentPatientId(patientId);
      setPatientData(newDraftData);

      // save initial draft to database
      // await storage.saveDraft(newDraftData, patientId); -- TODO delete?
      console.log('✨ Created new draft in memory with ID:', patientId);

    } catch (err) {
      console.error('Error creating new draft:', err);
      throw err;
    }
  };

  /**
   * TODO - load specific draft for 'continue admission' workflow
   */
  const loadDraft = async (patientId: string) => {
    console.log('TODO - check load draft working')
     try {

      setIsDataLoaded(false);
      const draft = await storage.getDraft(patientId);
      
      if (!draft) throw new Error(`Draft ${patientId} not found`);

      setPatientData(draft);
      setCurrentPatientId(patientId);
      console.log('📂 Loaded draft:', patientId);
    } catch (error) {
      console.error('Error loading draft:', error);
      throw error;
    } finally {
      setIsDataLoaded(true);
    }
  };


  /**
   * Update data .. triggers autosave via useEffect
   */
  const updatePatientData = (updates: Partial<PatientData>) => {
    setPatientData(prev => ({ ...prev, ...updates }));
  };

  /**
   * Handle age range change (clears incompatible fields)
   */
  const handleAgeChange = async (isUnderSixMonths: boolean) => {
    if (isUnderSixMonths) {
      // Clear 6-60 months specific fields
      const updates: Partial<PatientData> = {
        isUnderSixMonths,
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
      };
      updatePatientData(updates);
    } else {
      // Clear 0-6 months specific fields
      const updates: Partial<PatientData> = {
        isUnderSixMonths,
        illnessDuration: '',
        neonatalJaundice: null,
        bulgingFontanelle: null,
        feedingWell: null,
      };
      updatePatientData(updates);
    }
  };

  /**
   * Clear current patient data
   */
  const clearPatientData = () => {
    setPatientData(initialPatientData);
    setCurrentPatientId(null)
  };

   /**
   * Submit patient (convert draft to submitted patient) - patient ID stays the same
   * 
   */
  const savePatientData = async (): 
    Promise<{patientId: string; riskAssessment: RiskAssessment; patientName: string;}> => {
      if (!currentPatientId) throw new Error('No patient ID available for submission');
    
    try {
      // Calculate final risk assessments before saving
      // TODO make this work with discharge risks; only calculate risk if we have all required info??
      const admissionRisk = calculateAdmissionRisk()
      const finalRiskAssessment: RiskAssessment = {
        admission: admissionRisk|| undefined,
        // discharge: calculateDischargeRisk(),
      };

      // Store patient name before clearing
      const patientName = `${patientData.firstName} ${patientData.surname}`;

      // submit patient (isDraft change from 1 to 0)
      await storage.submitPatient(currentPatientId);

      // Save risk prediction with admission model, if exists
      if (admissionRisk) {
        await storage.saveRiskPrediction(currentPatientId, admissionRisk, 'admission');
      }

      console.log('✅ Patient submitted:', currentPatientId);
      
      const submittedPatientId = currentPatientId;
      
      // Clear current state and create new draft for next patient
      clearPatientData();
      await createNewDraft();
      
      
      console.log('✅ Cleared current state and create new draft for next patient');
      
      return {
        patientId: submittedPatientId,
        riskAssessment: finalRiskAssessment,
        patientName 
      };
    } catch (error) {
      console.error('Error saving patient data:', error);
      throw error;
    }
  };

  /**
   * Get current patient ID
   */
  const getCurrentPatientId = (): string | null => {
    return currentPatientId;
  };


  /**
   * Calculate post-discharge mortality risk at admission time
   */
  const calculateAdmissionRisk = (): RiskPrediction | null => {
    const context: ModelContext = {
      isUnderSixMonths: patientData.isUnderSixMonths,
      usageTime: 'admission'
    };

    const model = modelSelector.getModel(context)
    const strategy = model && modelSelector.getStrategy(model?.modelName)

    return strategy && strategy?.calculateRisk(patientData)
  };

  /**
   * Calculate post-discharge mortality risk at discharge time
   */
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

  // TODO - loading spinner if data not ready ?
  // if (!isDataLoaded) return null;

  return (
    <PatientDataContext.Provider
      value={{
        patientData,
        updatePatientData,
        clearPatientData,
        savePatientData,
        startAdmission,
        loadDraft,
        isDataLoaded,
        handleAgeChange,
        calculateAdmissionRisk,
        calculateDischargeRisk,
        getCurrentRiskAssessment,
        getCurrentPatientId,
        riskAssessment
      }}
    >
      {children}
    </PatientDataContext.Provider>
  );
}

/**
 * Hook to access PatientData  throughout the app
 */
export const usePatientData = () => {
  const context = useContext(PatientDataContext);
  if (context === undefined) {
    throw new Error('usePatientData must be used within a PatientDataProvider');
  }
  return context;
};