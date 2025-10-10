import { Platform } from "react-native";
import { PatientData } from "../contexts/PatientData";
import { WebStorage } from "./WebStorage";


export interface IStorageService {
    init(): Promise<void>;

    // draft operations - retrieve or save to database
    saveDraft(key: string, data: PatientData): Promise<void>;
    deleteDraft(key: string): Promise<void>;
    getAllDrafts(): Promise<Array<{ key: string; data: PatientData }>>;
    getDraft(key: string): Promise<PatientData | null>;
    getCurrentDraftKey(): Promise<string | null>;
    setCurrentDraftKey(key: string): Promise<void>;

    // completed patient operations
    saveCompletedPatient(data: PatientData): Promise<void>;
    deleteCompletedPatient(id: string): Promise<void>;
    getAllCompletedPatients(): Promise<PatientData[]>;
    getCompletedPatient(id: string): Promise<PatientData | null>

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



