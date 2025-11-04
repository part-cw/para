
import { PatientData } from "../contexts/PatientData";
import { RiskAssessment, RiskPrediction } from "../models/types";
import { IStorageService } from "./StorageService";

/**
 * TODO - rename class + implement methods
 */
export class WebStorage implements IStorageService {
    init(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    submitPatient(patientId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getPatient(patientId: string): Promise<PatientData | null> {
        throw new Error("Method not implemented.");
    }
    updatePatient(patientId: string, updates: Partial<PatientData>): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deletePatient(patientId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    saveDraft(data: PatientData): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getDraft(): Promise<PatientData | null> {
        throw new Error("Method not implemented.");
    }
    deleteDraft(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getPatients(): Promise<PatientData[]> {
        throw new Error("Method not implemented.");
    }
    getDraftPatients(): Promise<PatientData[]> {
        throw new Error("Method not implemented.");
    }
    getSubmittedPatients(): Promise<PatientData[]> {
        throw new Error("Method not implemented.");
    }
    saveRiskPrediction(patientId: string, prediction: RiskPrediction, usageTime: "admission" | "discharge"): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getRiskAssessment(patientId: string): Promise<RiskAssessment> {
        throw new Error("Method not implemented.");
    }
    archivePatient(patientId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getArchivedPatients(): Promise<PatientData[]> {
        throw new Error("Method not implemented.");
    }
    clearAll(): Promise<void> {
        throw new Error("Method not implemented.");
    }

 }