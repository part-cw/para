
import { PatientData } from "../contexts/PatientData";
import { IStorageService } from "./StorageService";

/**
 * TODO - rename class + implement methods
 */
export class WebStorage implements IStorageService {
     init(): Promise<void> {
         throw new Error("Method not implemented.");
     }
     saveDraft(key: string, data: PatientData): Promise<void> {
         throw new Error("Method not implemented.");
     }
     deleteDraft(key: string): Promise<void> {
         throw new Error("Method not implemented.");
     }
     getAllDrafts(): Promise<Array<{ key: string; data: PatientData; }>> {
         throw new Error("Method not implemented.");
     }
     getDraft(key: string): Promise<PatientData | null> {
         throw new Error("Method not implemented.");
     }
     getCurrentDraftKey(): Promise<string | null> {
         throw new Error("Method not implemented.");
     }
     setCurrentDraftKey(key: string): Promise<void> {
         throw new Error("Method not implemented.");
     }
     saveCompletedPatient(data: PatientData): Promise<void> {
         throw new Error("Method not implemented.");
     }
     deleteCompletedPatient(id: string): Promise<void> {
         throw new Error("Method not implemented.");
     }
     getAllCompletedPatients(): Promise<PatientData[]> {
         throw new Error("Method not implemented.");
     }
     getCompletedPatient(id: string): Promise<PatientData | null> {
         throw new Error("Method not implemented.");
     }
     clearAll(): Promise<void> {
         throw new Error("Method not implemented.");
     }
    
 }