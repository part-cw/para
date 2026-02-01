import { PatientIdGenerator } from '@/src/utils/patientIdGenerator';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getModelSelectorInstance } from '../models/modelSelectorInstance';
import { ModelContext, RiskAssessment, RiskPrediction } from '../models/types';
import { normalizeBoolean } from '../utils/normalizer';
import { Diagnosis, initialDiagnosis } from './Diagnosis';
import { initialPatientData, PatientData } from './PatientData';
import { useStorage } from './StorageContext';

interface PatientDataContextType {
  patientData: PatientData;
  updatePatientData: (updates: Partial<PatientData>) => void;
  clearPatientData: () => void;
  savePatientData: () => Promise<{
      patientId: string;
      riskAssessment: RiskAssessment;
      diagnosis: Diagnosis;
      patientName: string;}>;
  completeDischarge: () => Promise<{
    patientId: string;
    riskAssessment: RiskAssessment;
    diagnosis: Diagnosis;
    patientName: string;}>;
  startAdmission: () => void;
  loadDraft: (patientId: string) => Promise<void>;
  loadPatient: (patientId: string) => Promise<void>;
  isDataLoaded: boolean;
  handleAgeChange: (isUnderSixMonths: boolean) => void;
  calculateAdmissionRisk: () => RiskPrediction | null;
  calculateDischargeRisk: () => RiskPrediction | null;
  calculateAdmissionRiskWithData: (data: PatientData) => RiskPrediction | null;
  getCurrentRiskAssessment: (patientId: string) => Promise<RiskAssessment | null>;
  getCurrentPatientId: () => string | null;
  getCurrentDiagnosis: (patientId: string) => Promise<Diagnosis | null>;
  riskAssessment: RiskAssessment;
  diagnosis: Diagnosis;
  admissionLastCalculated: string;
}

const PatientDataContext = createContext<PatientDataContextType | undefined>(undefined);

export function PatientDataProvider({ children }: { children: ReactNode }) {
  const [patientData, setPatientData] = useState<PatientData>(initialPatientData);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(true);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>({});
  const [diagnosis, setDiagnosis] = useState<Diagnosis>(initialDiagnosis);
  const [admissionLastCalculated, setAdmissionLastCalculated] = useState<string>('')
  
  const { storage, isInitialized } = useStorage();
  const modelSelector = getModelSelectorInstance();

  // Autosave draft whenever patientData changes, wait 1000 ms
  useEffect(() => {
    if (!isInitialized || !currentPatientId) return;

    // Only save if user has entered at least SOME required data
    const hasMinimalData = 
        patientData.surname && 
        patientData.firstName &&
        typeof(patientData.ageInMonths) === 'number'

    if (!hasMinimalData) {
        console.log('⏳ Skipping auto-save - not enough data entered yet');
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
    } catch (error) {
      console.error('Error starting admission:', error);
      throw error;
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
      console.log('✨ Created new draft in memory with ID:', patientId);
    } catch (err) {
      console.error('Error creating new draft:', err);
      throw err;
    }
  };

  /**
   * Load specific draft for 'continue admission' workflow
   */
  const loadDraft = async (patientId: string) => {
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
   * Load specifc patient record 
   */
  const loadPatient = async (patientId: string) => {
    try {
      setIsDataLoaded(false)
      const data = await storage.getPatient(patientId);
      if (!data) throw new Error(`Patient ${patientId} not found`);
      
      setPatientData(data);
      setCurrentPatientId(patientId);
      await getCurrentRiskAssessment(patientId);
      console.log(`📋 Loaded patient ${patientId} data`);
    } catch (error) {
        console.error('Error loading patient data:', error);
        throw error;
    } finally {
        setIsDataLoaded(true);
    }
  }


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
        weight: '',
        spo2_admission: '',
        waz: null,
        muac: ''
      };
      updatePatientData(updates);
    } else {
      // Clear 0-6 months specific fields
      const updates: Partial<PatientData> = {
        isUnderSixMonths,
        illnessDuration: '',
        neonatalJaundice: '',
        bulgingFontanelle: '',
        feedingWell: '',
        weight: '',
        spo2_admission: '',
        waz: null,
        muac: ''
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
    setRiskAssessment({});
    setAdmissionLastCalculated('');
  };

   /**
   * Submit patient (convert draft to submitted patient) and calcuclated risk prediction at admission - patient ID stays the same
   * 
   */
  const savePatientData = async (): 
    Promise<{
      patientId: string; 
      riskAssessment: RiskAssessment;
      diagnosis: Diagnosis; 
      patientName: string;
    }> => {
      if (!currentPatientId) throw new Error('No patient ID available for submission');
    
    try {
      // Calculate risk assessments before saving
      const admissionRisk = calculateAdmissionRisk()
      const finalRiskAssessment: RiskAssessment = {
        admission: admissionRisk|| undefined,
      };

      // TODO get diagnosis
      const currDiagnosis = await getCurrentDiagnosis(currentPatientId);

      // Store patient name before clearing
      const patientName = `${patientData.firstName} ${patientData.surname}`;
      const submissionDateTime = new Date().toISOString()

      // submit patient (isDraft change from 1 to 0)
      await storage.submitPatient(currentPatientId, submissionDateTime);

      // Save risk prediction with admission model, if exists
      if (admissionRisk) {
        await storage.saveRiskPrediction(currentPatientId, admissionRisk, 'admission', submissionDateTime);
      }

      setAdmissionLastCalculated(submissionDateTime);

      console.log(`✅ Stored risk prediction for ${currentPatientId}:`, finalRiskAssessment);

      const submittedPatientId = currentPatientId;
      
      // Clear current state and create new draft for next patient
      clearPatientData();
      await createNewDraft();
      
      
      console.log('✅ Cleared current state and create new draft for next patient');
      
      return {
        patientId: submittedPatientId,
        riskAssessment: finalRiskAssessment,
        diagnosis: currDiagnosis || initialDiagnosis,
        patientName 
      };
    } catch (error) {
      console.error('Error saving patient data:', error);
      throw error;
    }
  };

   /**
   * Discharge patient and calcuclated risk prediction at discharge if patient not deceased
   * 
   */
  const completeDischarge = async (): 
    Promise<{patientId: string; riskAssessment: RiskAssessment; diagnosis: Diagnosis; patientName: string;}> => {
      if (!currentPatientId) throw new Error('No patient ID available for submission');
    
    try {
      const discharge = calculateDischargeRisk()
      const finalRiskAssessment: RiskAssessment = {
        admission: riskAssessment.admission,
        discharge: discharge|| undefined
      };

      // Store patient name before clearing
      const patientName = `${patientData.firstName} ${patientData.surname}`;
      const dischargeDateTime = new Date().toISOString()

      await storage.dischargePatient(currentPatientId, dischargeDateTime);
      const currDiagnosis = await getCurrentDiagnosis(currentPatientId);


      if (discharge) {
        await storage.saveRiskPrediction(currentPatientId, discharge, 'discharge', dischargeDateTime);
      }

      console.log(`✅ Stored risk prediction for ${currentPatientId}:`, finalRiskAssessment);

      const submittedPatientId = currentPatientId;
      
      // Clear current state 
      clearPatientData();
      
      console.log('✅ Cleared current local state');
      
      return {
        patientId: submittedPatientId,
        riskAssessment: finalRiskAssessment,
        diagnosis: currDiagnosis || initialDiagnosis,
        patientName 
      };
    } catch (error) {
      console.error('Error discharging patient data:', error);
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
   * Calculate post-discharge mortality risk at admission time,
   *  using patient data stored in context
   */
  const calculateAdmissionRisk = (): RiskPrediction | null => {
    const context: ModelContext = {
      isUnderSixMonths: normalizeBoolean(patientData.isUnderSixMonths),
      usageTime: 'admission'
    };

    const model = modelSelector.getModel(context)
    const strategy = model && modelSelector.getStrategy(model?.modelName)

    return strategy && strategy?.calculateRisk(patientData)
  };


  /**
   * Calculate post-discharge mortality risk at admission time; takes explicit data
   */
  const calculateAdmissionRiskWithData = (data: PatientData): RiskPrediction | null => {
      const context: ModelContext = {
          isUnderSixMonths: normalizeBoolean(data.isUnderSixMonths),
          usageTime: 'admission'
      };

      const model = modelSelector.getModel(context);
      const strategy = model && modelSelector.getStrategy(model?.modelName);

      return strategy && strategy?.calculateRisk(data);
  };

  /**
   * Calculate post-discharge mortality risk at discharge time
   */
  const calculateDischargeRisk = (): RiskPrediction | null => {
    const context: ModelContext = {
      isUnderSixMonths: normalizeBoolean(patientData.isUnderSixMonths),
      usageTime: 'discharge'
    };

    const model = modelSelector.getModel(context)
    const strategy = model && modelSelector.getStrategy(model?.modelName)

    return strategy && strategy?.calculateRisk(patientData)
  };

  const getCurrentRiskAssessment = async (patientId: string): Promise<RiskAssessment | null> => {
    if (!patientId) return null;

    const { assessment, admissionLastCalculated } = await storage.getRiskAssessment(patientId)
    setRiskAssessment(assessment);
    setAdmissionLastCalculated(admissionLastCalculated);

    return riskAssessment;
  };

   /**
   * 
   * @returns current patient diagnosis based on positive and suspected conditions
   */
  const getCurrentDiagnosis = async (patientId: string): Promise<Diagnosis | null> => {
    if (!patientId) return null;


    const diagnosis = await storage.getDiagnosis(patientId)
    setDiagnosis(diagnosis);
    
    return diagnosis;
  }


  return (
    <PatientDataContext.Provider
      value={{
        patientData,
        updatePatientData,
        clearPatientData,
        savePatientData,
        completeDischarge,
        startAdmission,
        loadDraft,
        loadPatient: loadPatient,
        isDataLoaded,
        handleAgeChange,
        calculateAdmissionRisk,
        calculateDischargeRisk,
        calculateAdmissionRiskWithData,
        getCurrentRiskAssessment,
        getCurrentPatientId,
        getCurrentDiagnosis,
        diagnosis,
        riskAssessment,
        admissionLastCalculated
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