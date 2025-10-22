import * as SecureStore from 'expo-secure-store';
import * as SQLite from "expo-sqlite";
import { PatientData } from "../contexts/PatientData";
import { RiskAssessment, RiskPrediction } from '../models/types';
import { IStorageService } from "./StorageService";

// TODO ADD ENCRYPTION - add sqlCipher AFTER databse test are all working
// will need to add encryption key - stored in Expo SecureStore

export class SQLiteStorage implements IStorageService {
    private db: SQLite.SQLiteDatabase | null = null;
    private DRAFT_KEY = 'DRAFT_';

    async init(): Promise<void> {
        // open or create db file and return connection -- TODO: add pathname?
        this.db = await SQLite.openDatabaseAsync('patient_records.db') 

        // create draft table if they don't exist
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS patients (
                patientId               TEXT PRIMARY KEY,
                surname                 TEXT NOT NULL,
                firstName               TEXT NOT NULL,
                otherName               TEXT,
                sex                     TEXT NOT NULL CHECK (sex IN ('male', 'female')),
                dob                     TEXT,
                birthYear               TEXT,
                birthMonth              TEXT,
                approxAgeInYears        TEXT,
                isUnderSixMonths        INTEGER NOT NULL,
                isNeonate               INTEGER NOT NULL,
                ageInMonths             INTEGER,
                
                -- Core admission clincial data (used by most models)
                weight                  TEXT,
                waz                     REAL,
                spo2_admission          TEXT,

                -- Medical conditions (for risk profiles)
                malnutritionStatus      TEXT NOT NULL,
                sickYoungInfant         INTEGER NOT NULL, -- 0 (false) or 1 (true)
                pneumonia               TEXT NOT NULL,
                diarrhea                TEXT NOT NULL,
                malaria                 TEXT NOT NULL,
                sepsis                  TEXT NOT NULL,
                meningitis_encephalitis TEXT NOT NULL,
                chronicIllnesses        TEXT NOT NULL, -- JSON array e.g.['HIV', 'TB', etc]
                otherChronicIllness     TEXT,
                
                -- VHT and Caregiver info
                vhtName                 TEXT,
                vhtTelephone            TEXT
                village                 TEXT,
                subvillage              TEXT,
                caregiverName           TEXT,
                caregiverTel            TEXT,
                confirmTel              INTEGER,
                sendReminders           INTEGER DEFAULT 0,
                isCaregiversPhone       INTEGER DEFAULT 0, -- TODO - default to true (1)

                -- Core discharge info (always needed)
                dischargeReason         TEXT,
                dischargeDiagnosis      TEXT,

                -- Metadata & status flags
                admissionStartedAt      TEXT NOT NULL,
                admissionCompletedAt    TEXT,
                updatedAt               TEXT,
                dischargedAt            TEXT,
                isDraftAdmission        INTEGER DEFAULT 0,
                isDischarged            INTEGER DEFAULT 0,
                isArchived              INTEGER DEFAULT 0,
                admittedBy              TEXT,
                dischargedBy            TEXT

            );
            
            CREATE TABLE IF NOT EXISTS clinical_variables (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                patientId       TEXT NOT NULL,
                variableName    TEXT NOT NULL,
                variableValue   TEXT, -- store raw value as text, convert later 
                variableType    TEXT NOT NULL, -- TODO delete? may not be necessary  
                usedByModels    TEXT,  -- TODO delete? may not be necessary  

                -- Metadata
                usageTime       TEXT NOT NULL CHECK (usage_time IN ('admission', 'discharge', 'both')),

                FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
                UNIQUE(patientId, variableName, usageTime) -- ensure no dubplicate variables per patient per usageTime
            );

            CREATE TABLE IF NOT EXISTS variable_definitions (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                variableName     TEXT NOT NULL UNIQUE,
                displayName      TEXT NOT NULL,
                variableType     TEXT NOT NULL CHECK (variableType IN ('numeric', 'boolean', 'text', 'json'))

                usedByModels     TEXT NOT NULL,   -- JSON array: e.g. ["M6PD-C6-60", "M6PD-C6-60_DISCHARGE"]

                -- Validation rules (TODO - remove??)
                min_value        REAL,
                max_value        REAL,
                valid_options    TEXT,             -- JSON array for categorical variables
                
                -- UI hints (TODO - remove??)
                inputType       TEXT,              -- 'number', 'dropdown', 'radio', 'checkbox'
                unit            TEXT,              -- 'kg', '°C', 'bpm', etc.
                description     TEXT,
            );

            CREATE TABLE IF NOT EXISTS risk_predictions (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                patientId           TEXT NOT NULL,
                modelName           TEXT NOT NULL,
                usageTime           TEXT (usageTime IN ('admission', 'discharge'),
                riskScore           REAL NOT NULL,
                riskCategory        TEXT NOT NULL,

                variablesUsed       TEXT NOT NULL, -- JSON  object {"temp": ":37.5", "rrate": "56" ...}... Not needed? can join patients instead? TODO delete
                
                -- context/metadata at time of calculation -- TODO: remove ageInMonths and hivStat at calc if keep variablesUsed
                ageInMonths_atCalc  INTEGER NOT NULL,  
                hivStatus_atCalc    TEXT NOT NULL,
                calculatedAt        TEXT NOT NULL,

                FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS top_predictors (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                predictionId    INTEGER NOT NULL,
                featureName     TEXT NOT NULL,
                contribution    REAL NOT NULL,
                rank            INTEGER NOT NULL, -- TODO delete? can find rank with max contribution of prediction id

                FOREIGN KEY(predictionId) REFERENCES risk_predictions(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS audit_log (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                patientId      TEXT NOT NULL,
                
                action          TEXT NOT NULL,
                fieldChanged   TEXT,
                oldValue       TEXT,
                newValue       TEXT,
                
                changedBy      TEXT,
                changedAt      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (patient_id) REFERENCES patients(patientId) ON DELETE CASCADE
            );
            
            -- INDEXES - TODO - add more if necessary
            CREATE INDEX IF NOT EXISTS idx_patients_draft ON patients(isDraft, admissionStartedAt);
            CREATE INDEX IF NOT EXISTS idx_patients_archived ON patients(isArchived);
            CREATE INDEX IF NOT EXISTS idx_clinical_variables_patient ON clinical_variables(patient_id, usageTime);
            CREATE INDEX IF NOT EXISTS idx_clinical_variables_name ON clinical_variables(variableName);
            CREATE INDEX IF NOT EXISTS idx_risk_predictions_patient ON risk_predictions(patientId, usageTime);
            CREATE INDEX IF NOT EXISTS idx_risk_predictions_model ON risk_predictions(modelName);
            --CREATE INDEX IF NOT EXISTS idx_audit_log_patient ON audit_log(patientId, changedAt); -- remove?
        `);

        console.log('✅ SQLite database initialized');
    }

    // ========== PATIENT OPERATIONS ==========

    savePatient(data: PatientData, patientId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async getPatient(patientId: string): Promise<PatientData | null> {
       const patient = await this.db?.getFirstAsync(`
            SELECT * FROM patients WHERE patientId = ?
        `, [patientId]);

        const clinicalData = await  this.db?.getAllAsync(`
            SELECT * FROM clinical_variables where patientId = ? 
        `, [patientId])

        if (!patient) return null;
        
        return (this.mapToPatientData(patient, clinicalData))
    }

    updatePatient(patientId: string, updates: Partial<PatientData>): Promise<void> {
        throw new Error('Method not implemented.');
    }

    deletePatient(patientId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    // ========== DRAFT OPERATIONS ==========

    saveDraft(data: PatientData): Promise<void> {
        throw new Error('Method not implemented.');
    }
    getDraft(): Promise<PatientData | null> {
        throw new Error('Method not implemented.');
    }
    clearDraft(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    // ========== LIST OPERATIONS ==========

    getPatients(): Promise<PatientData[]> {
        throw new Error('Method not implemented.');
    }
    getDraftPatients(): Promise<PatientData[]> {
        throw new Error('Method not implemented.');
    }
    getSubmittedPatients(): Promise<PatientData[]> {
        throw new Error('Method not implemented.');
    }

    // ========== RISK OPERATIONS ==========

    saveRiskPrediction(patientId: string, prediction: RiskPrediction, usageTime: 'admission' | 'discharge'): Promise<void> {
        throw new Error('Method not implemented.');
    }
    getRiskAssessment(patientId: string): Promise<RiskAssessment> {
        throw new Error('Method not implemented.');
    }

    // ========== ARCHIVE OPERATIONS ==========

    archivePatient(patientId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    getArchivedPatients(): Promise<PatientData[]> {
        throw new Error('Method not implemented.');
    }

    // ========== UTILITY ==========

    async clearAll(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.execAsync(`
            DELETE * FROM patients;
            DELETE * FROM 
        `);

        await SecureStore.deleteItemAsync(this.DRAFT_KEY);

        console.log('🧹 All data cleared');
    }

    private mapToPatientData(patient: {}, clinicalData: unknown[] | undefined): PatientData | PromiseLike<PatientData | null> | null {
        throw new Error('Method not implemented.');
    }

    // ========== DRAFT OPERATIONS ==========

    // async saveDraft(key: string, data: PatientData): Promise<void> {
    //     if (!this.db) throw new Error('Database not initialized'); 
        
    //     const jsonData = JSON.stringify(data);

    //     await this.db.runAsync(`
    //         INSERT INTO drafts (draftKey, patientData) 
    //         VALUES (?, ?)
    //         ON CONFLICT (draftKey) DO UPDATE
    //             SET patientData = EXCLUDED.patientData,
    //                 updatedAt = CURRENT_TIMESTAMP
    //         `,
    //         [key, jsonData]
    //     )

    //     console.log('💾 Draft saved:', key);
    // }

    // async deleteDraft(key: string): Promise<void> {
    //     if (!this.db) throw new Error('Database not initialized'); 

    //     await this.db.runAsync('DELETE FROM drafts WHERE draftKey = ?', [key])
    //     console.log('🗑️ Deleted draft: ', key)
    // }

    

    // async getAllDrafts(): Promise<Array<{ key: string; data: PatientData; }>> {
    //     if (!this.db) throw new Error('Database not initialized');

    //     // get all drafts in descending order of update
    //     const results = await this.db.getAllAsync<{ 
    //         draftKey: string; 
    //         patientData: string;
    //         updatedAt: string;
    //     }>(
    //         `SELECT draftKey, patientData, updatedAt FROM drafts
    //          ORDERED BY updatedAt DESC
    //         `
    //     );

    //     if (!results) return [];

    //     return results.map(row => {
    //         const parsed = JSON.parse(row.patientData);
    //         if (parsed.dob) parsed.dob = new Date(parsed.dob);
            
    //         return {
    //             key: row.draftKey,
    //             data: parsed
    //         };
    //     });
    // }

    // async getDraft(key: string): Promise<PatientData | null> {
    //     if (!this.db) throw new Error('Database not initialized');

    //     const result = await this.db.getFirstAsync(
    //         `
    //         SELECT patientData FROM drafts
    //         WHERE draftKey = ?
    //         `, [key]
    //     );

    //     if (!result) return null;

    //     const parsed = JSON.parse(result as string)

    //     // convert string dates back to Date object, if they exist
    //     if (parsed.dob) parsed.dob = new Date(parsed.dob)

    //     return parsed as PatientData;

    // }

    // async getCurrentDraftKey(): Promise<string | null> {
    //     return await SecureStore.getItemAsync(CURRENT_DRAFT_KEY);
    // }

    // async setCurrentDraftKey(key: string): Promise<void> {
    //     await SecureStore.setItemAsync(CURRENT_DRAFT_KEY, key);
    // }
    
}


// -- ====================
// -- SEED DATA: Variable Definitions
// -- ====================
// -- Define variables for current models
// INSERT INTO clinical_variable_definitions (
//   variable_name, display_name, variable_type, used_by_models, 
//   min_value, max_value, input_type, unit, description
// ) VALUES 
//   -- M6PD-C6-60 variables
//   ('temperature', 'Temperature', 'numeric', '["M6PD-C6-60"]', 35.0, 42.0, 'number', '°C', 'Body temperature in Celsius'),
//   ('temperature_squared', 'Temperature Squared', 'numeric', '["M6PD-C6-60"]', NULL, NULL, 'calculated', NULL, 'Automatically calculated'),
//   ('rrate', 'Respiratory Rate', 'numeric', '["M6PD-C6-60"]', 10, 100, 'number', 'bpm', 'Breaths per minute'),
//   ('last_hospitalized', 'Last Hospitalized', 'text', '["M6PD-C6-60"]', NULL, NULL, 'dropdown', NULL, 'Time since last hospitalization'),
//   ('hiv_status', 'HIV Status', 'text', '["M6PD-C6-60"]', NULL, NULL, 'radio', NULL, 'HIV test result'),
//   ('eye_movement', 'Eye Movement', 'json', '["M6PD-C6-60"]', NULL, NULL, 'dropdown', NULL, 'BCS: Eye movement assessment'),
//   ('motor_response', 'Motor Response', 'json', '["M6PD-C6-60"]', NULL, NULL, 'dropdown', NULL, 'BCS: Best motor response'),
//   ('verbal_response', 'Verbal Response', 'json', '["M6PD-C6-60"]', NULL, NULL, 'dropdown', NULL, 'BCS: Verbal response'),
//   ('bcs_score', 'BCS Score', 'numeric', '["M6PD-C6-60"]', 0, 5, 'calculated', NULL, 'Blantyre Coma Scale score'),
//   ('abnormal_bcs', 'Abnormal BCS', 'boolean', '["M6PD-C6-60"]', NULL, NULL, 'calculated', NULL, 'BCS < 3'),
  
//   -- M6PD-C0-6 variables
//   ('illness_duration', 'Illness Duration', 'text', '["M6PD-C0-6"]', NULL, NULL, 'dropdown', NULL, 'How long has child been sick'),
//   ('neonatal_jaundice', 'Neonatal Jaundice', 'boolean', '["M6PD-C0-6"]', NULL, NULL, 'radio', NULL, 'Jaundice present in neonate'),
//   ('bulging_fontanelle', 'Bulging Fontanelle', 'boolean', '["M6PD-C0-6"]', NULL, NULL, 'radio', NULL, 'Fontanelle is bulging'),
//   ('feeding_well', 'Feeding Well', 'boolean', '["M6PD-C0-6", "M6PD-DISCHARGE"]', NULL, NULL, 'radio', NULL, 'Is the child feeding well');