import { Platform } from "react-native";
import { PatientData } from "../contexts/PatientData";
import { RiskAssessment, RiskPrediction } from "../models/types";
import { WebStorage } from "./WebStorage";


export interface IStorageService {
    init(): Promise<void>;

    // Patient operations
    savePatient(data: PatientData, patientId: string): Promise<void>;
    getPatient(patientId: string): Promise<PatientData | null>;
    updatePatient(patientId: string, updates: Partial<PatientData>): Promise<void>;
    deletePatient(patientId: string): Promise<void>;
  
    // Draft operations
    saveDraft(data: PatientData): Promise<void>;
    getDraft(): Promise<PatientData | null>; // pass in draft id?
    clearDraft(): Promise<void>;
    
    // List operations
    getPatients(): Promise<PatientData[]>;
    getDraftPatients(): Promise<PatientData[]>;
    getSubmittedPatients(): Promise<PatientData[]>;
  
    // Risk operations
    saveRiskPrediction(
        patientId: string,
        prediction: RiskPrediction,
        usageTime: 'admission' | 'discharge'
    ): Promise<void>;
    getRiskAssessment(patientId: string): Promise<RiskAssessment>;
    
    // Archive operations
    archivePatient(patientId: string): Promise<void>;
    getArchivedPatients(): Promise<PatientData[]>;

    // utility
    clearAll(): Promise<void>;
}

// Factory function to get correct storage implemenation
export function getStorageService(): IStorageService {

    if (Platform.OS === 'web') {
        // Expo SQLite not fully supported on web yet
        return new WebStorage(); // TODO dynamically load?? - depends on whether class compatible with mobile 
    } else {
        // dynamic import to avoid potentially breaking on web
        const { SQLiteStorage } = require('./SQLiteStorage');
        return new SQLiteStorage();
    } 

}


