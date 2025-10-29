import * as SQLite from "expo-sqlite";
import { PatientData } from "../contexts/PatientData";
import { RiskAssessment, RiskPrediction } from '../models/types';
import { IStorageService } from "./StorageService";

// TODO ADD ENCRYPTION - add sqlCipher AFTER databse test are all working
// will need to add encryption key - stored in Expo SecureStore

type MedicalConditionsRow = {
  patientId: string;
  malnutritionStatus: string;
  sickYoungInfant: number;
  pneumonia: string;
  diarrhea: string;
  malaria: string;
  sepsis: string;
  meningitis_encephalitis: string;
  chronicIllnesses: string;
  otherChronicIllness: string | null;
};


export class SQLiteStorage implements IStorageService {
    private db: SQLite.SQLiteDatabase | null = null;
    private encryptionKey: string | null = null;
    private readonly DB_NAME = 'patient_data_encrypted.db';
    private readonly ENCRYPTION_KEY_STORAGE = 'db_encryption_key';


    async init(): Promise<void> {
        // TOOD uncomment encryption key stuff
        // this.encryptionKey = await this.getOrCreateEncryptionKey();
        this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
        // await this.db.execAsync(`PRAGMA key = '${this.encryptionKey}';`);
        await this.initializeSchema();
        await this.seedData();
    }

    // TODO delete draft id stuff
    async initializeSchema(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS patients (
                -- Patient info 
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
                
                -- VHT info
                vhtName                 TEXT,
                vhtTelephone            TEXT
                village                 TEXT,
                subvillage              TEXT,

                -- Caregiver contact
                caregiverName           TEXT,
                caregiverTel            TEXT,
                confirmTel              INTEGER,
                sendReminders           INTEGER DEFAULT 0,
                isCaregiversPhone       INTEGER DEFAULT 0, -- TODO - default to true (1)

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

            CREATE TABLE IF NOT EXISTS medical_conditions (
                patientId               TEXT PRIMARY KEY,
                malnutritionStatus      TEXT NOT NULL,
                sickYoungInfant         INTEGER NOT NULL, -- 0 (false) or 1 (true)
                pneumonia               TEXT NOT NULL,
                diarrhea                TEXT NOT NULL,
                malaria                 TEXT NOT NULL,
                sepsis                  TEXT NOT NULL,
                meningitis_encephalitis TEXT NOT NULL,
                chronicIllnesses        TEXT NOT NULL, -- JSON array e.g.['HIV', 'TB', etc]
                otherChronicIllness     TEXT,

                FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE,
            );

            CREATE TABLE IF NOT EXISTS clinical_variables (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                patientId       TEXT NOT NULL,
                variableName    TEXT NOT NULL,
                variableValue   TEXT, -- store raw value as text, convert later 
                variableType    TEXT,

                -- Metadata
                usageTime       TEXT NOT NULL CHECK (usage_time IN ('admission', 'discharge', 'both')),

                FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE,
                UNIQUE(patientId, variableName, usageTime) -- ensure no dubplicate variables per patient per usageTime
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
                
                action         TEXT NOT NULL,
                fieldChanged   TEXT,
                oldValue       TEXT,
                newValue       TEXT,
                
                changedBy      TEXT,
                changedAt      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE
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

    async seedData(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // TODO seed variable_definitions 
    }

    // ========== PATIENT OPERATIONS ==========

    /**
     * 
     * inserts or replaces the entire row (patient) - run this only on submit -- TODO complete
     */
    // async savePatient(data: PatientData, patientId: string): Promise<void> {
        // const now = new Date().toISOString()
        
        // // open transaction
        // // insert data into patients and medical_conditions
        // // insert initial variables into clinical_variables
        // // reaplce draft id with final id??
        // // update audit_log

        // await this.db?.withTransactionAsync(async () => {
        //     // TODO - change CURRENT_USER to a user id from userTable once that is implemetneed
        //     await this.db?.runAsync(`
        //         INSERT OR REPLACE INTO patients (
        //             patientId, surname, firstName, otherName, sex, dob, birthYear, birthMonth, approxAgeInYears, ageInMonths,
        //             malnutritionStatus, sickYoungInfant, pneumonia, diarrhea, malaria, sepsis, meningitis_encephalitis, chronicIllnesses, otherChronicIllness,
        //             vhtName, vhtTelephone, village, subvillage, caregiverName, caregiverTel, confirmTel, sendReminders, isCaregiversPhone,
        //             admissionStartedAt, admissionCompletedAt, updatedAt, isDraftAdmission, admittedBy
        //         ) 
        //         VALUES (
        //             ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        //             ?, ?, ?, ?, ?, ?, ?, ?, ?,
        //             ?, ?, ?, ?, ?
        //         )
        //     `, [
        //         patientId, data.surname, data.firstName, data.otherName, data.sex, (data.dob ? data.dob.toISOString() : null), data.birthYear, data.birthMonth, data.approxAgeInYears, data.ageInMonths,
        //         data.vhtName, data.vhtTelephone, data.village, data.subvillage, data.caregiverName, data.caregiverTel, data.confirmTel, data.sendReminders, data.isCaregiversPhone,
        //         (data.admissionStartedAt || now), now, now, 0, CURRENT_USER 
        //      ]);

        //     await this.db?.runAsync(`
        //         INSERT OR REPLACE INTO clinical_variables (
        //             id, patientId, variableName, variableValue
        //         )
        //         VALUES ()
        //     `, []);

        //     await this.db?.runAsync(`
        //         INSERT OR REPLACE INTO medical_conditions (
        //             patientId, malnutritionStatus, sickYoungInfant, pneumonia, diarrhea, malaria, sepsis, meningitis_encephalitis, chronicIllnesses, otherChronicIllness
        //         )
        //         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        //     `, [patientId,  data.malnutritionStatus, data.sickYoungInfant, data.pneumonia, data.diarrhea, data.malaria, data.sepsis, data.meningitis_encephalitis, data.chronicIllnesses.toString(), data.otherChronicIllness]);

        //     await this.db?.runAsync(`INSERT ... INTO audit_log`);
        // });
    // }

    async submitPatient(patientId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const now = new Date().toISOString();

        // flip isDraftAdmision flag and add metadata
        await this.db.runAsync(`
            UPDATE patients 
            SET isDraftAdmission = 0, submittedAt = ?, updatedAt = ?
            WHERE patient_id = ?
        `, [now, now, patientId]);

        console.log(`✅ Patient ${patientId} submitted`);
    }

    async getPatient(patientId: string): Promise<PatientData | null> {
        if (!this.db) throw new Error('Database not initialized');

        // get patient demographics (basic info, vht, caregiver, metadata)
        const patientRow = await this.db.getFirstAsync<PatientData>(`
            SELECT * FROM patients WHERE patientId = ?
        `, [patientId]);

        if (!patientRow) return null;
        
        // get patient's medical conditions
        const conditions = await this.getMedicalConditions(patientId)

        // get all clinical data
        const clinicalData = await this.getClinicalData(patientId)

        return {
            patientId: patientRow.patientId,
            admissionStartedAt: patientRow.admissionStartedAt,
            surname: patientRow.surname,
            firstName: patientRow.firstName,
            otherName: patientRow.otherName || '',
            sex: patientRow.sex,
            isUnderSixMonths: patientRow.isUnderSixMonths,
            isNeonate: patientRow.isNeonate,
            isYearMonthUnknown: patientRow.isYearMonthUnknown,
            dob: patientRow.dob,
            birthYear: patientRow.birthYear,
            birthMonth: patientRow.birthMonth,
            approxAgeInYears: patientRow.approxAgeInYears,

            vhtName: patientRow.vhtName,
            vhtTelephone: patientRow.vhtTelephone,
            village: patientRow.village,
            subvillage: patientRow.subvillage,

            caregiverName: patientRow.caregiverName,
            caregiverTel: patientRow.caregiverTel,
            confirmTel: patientRow.confirmTel,
            sendReminders: patientRow.sendReminders,
            isCaregiversPhone: patientRow.isCaregiversPhone,

            dischargeDiagnosis: patientRow.dischargeDiagnosis ? patientRow.dischargeDiagnosis : null,

            ...conditions,
            ...clinicalData
        } as PatientData
    }
    

    updatePatient(patientId: string, updates: Partial<PatientData>): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async deletePatient(patientId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync(
            'DELETE FROM patients WHERE patientId = ?',
            [patientId]
        );

        console.log(`✅ Patient ${patientId} deleted`);
    }

    // TODO
    async addNewPatient() {
        if (!this.db) throw new Error('Database not initialized');

    }

    // TODO
    async updatePatientFields(data: PatientData, id: string, date: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

    }

    // ========== DRAFT OPERATIONS ==========

    async saveDraft(data: PatientData, patientId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        
        const now = new Date().toISOString();

        // Check if draft exists
        const existing = await this.db.getFirstAsync<{ patient_id: string }>(
            `SELECT patientId FROM patients 
                WHERE patient_id = ?`,
            [patientId]
        );

         if (existing) {
            // DRAFT EXISTS: Use UPDATE (only changes what's needed)
            await this.updatePatientFields(data, patientId, now);
        } else {
            // NEW DRAFT: Use INSERT
            await this.addNewPatient(data, patientId, now, true);
        }
    }

        
    // TODO
    private async updateDraft(data: PatientData, draftId: string, now: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');


        await this.db.runAsync(`
            UPDATE patients 
            SET 
            WHERE patientId = ?
        `, [draftId])
    }

  /**
   * 
   * get specific draft admission by id
   */
    async getDraft(patientId: string): Promise<PatientData | null> {
        if (!this.db) throw new Error('Database not initialized');

        // TODO - make sure only selecting from drafts 
        return this.getPatient(patientId);
    }

    /**
     * Get most recent draft (if exists)
     */
    async getMostRecentDraft(): Promise<PatientData | null> {
        if (!this.db) throw new Error('Database not initialized');

        const row = await this.db.getFirstAsync<any>(
            `SELECT patientId FROM patients 
            WHERE isDraftAdmission = 1 
            ORDER BY admissionStartedAt DESC 
            LIMIT 1`
        );

        if (!row) return null;

        return await this.getPatient(row.patientId);
    }

    /**
     * 
     * delete specific draft admission by id
     */
    async deleteDraft(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync(
            'DELETE FROM patients WHERE patientId = ? AND isDraftAdmission = 1',
            [id]
        );

        console.log('✅ Draft deleted (ID can be reused)');
    }

    /*
    * deletes all draft admissions
    */
    async deleteAllDrafts(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync('DELETE FROM patients WHERE isDraftAdmission = 1')
    } 


    // ========== LIST OPERATIONS ==========

    /**
     * Get all patient records (drafts, submissions, discharged, archived)
     */
    async getPatients(): Promise<PatientData[]> {
        if (!this.db) throw new Error('Database not initialized');

        const rows = await this.db.getAllAsync<any>(
            `SELECT patientId FROM patients 
            ORDER BY admissionStartedAt DESC`
        );

        const records = await Promise.all(
            rows.map(row => this.getPatient(row.patientId))
        );

        // remove falsy patient objects (eg null undefined)
        return records.filter(Boolean) as PatientData[];


    }

    /**
     * Get all draft patients 
     */
    async getDraftPatients(): Promise<PatientData[]> {
        if (!this.db) throw new Error('Database not initialized');

        const rows = await this.db.getAllAsync<any>(
            `SELECT patientId FROM patients 
            WHERE isDraftAdmission = 1 
            ORDER BY admissionStartedAt DESC`
        );

        const drafts = await Promise.all(
            rows.map(row => this.getPatient(row.patientId))
        );


        // remove falsy patient objects (eg null undefined)
        return drafts.filter(Boolean) as PatientData[];

    }

    /**
     * Get all completed (admitted) patients - ie not draft, not archived.
     * Includes discharged patients
     */
    async getSubmittedPatients(): Promise<PatientData[]> {
        if (!this.db) throw new Error('Database not initialized');

        const rows = await this.db.getAllAsync<any>(
            `SELECT patientId FROM patients 
            WHERE isDraftAdmission = 0 AND isArchived = 0
            ORDER BY admissionCompletedAt DESC`
        );

        const submissions = await Promise.all(
            rows.map(row => this.getPatient(row.patientId))
        );


        // remove falsy patient objects (eg null undefined)
        return submissions.filter(Boolean) as PatientData[];

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
            DELETE * FROM medical_conditions;
            DELETE * FROM clinical_variables;
            DELETE * FROM risk_predictions;
            DELETE * FROM top_predictors;
            DELETE * FROM audit_log;
        `);

        console.log('🧹 All data cleared');
    }

    // ========== HELPERS ==========

    /**
     * 
     * Get medical conditions for a patient.
     * Returns  object with condition name as keys
     */
    private async getMedicalConditions(patientId: string): Promise<{ [key: string]: any }> {
        if (!this.db) throw new Error('Database not initialized');

        const row = await this.db.getFirstAsync<MedicalConditionsRow>(
            `SELECT * FROM medical_conditions WHERE patientId = ?`, [patientId]
        );

        if (!row) throw new Error(`No medical conditions found for patient ${patientId}`);
  
        // TODO safely parse chronic illnesses JSON array
        const chronicIllnesses = (() => {
            try {
                const parsed = JSON.parse(row.chronicIllnesses || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        })();


        const conditions: { [key: string]: any } = {
            malnutritionStatus: row.malnutritionStatus,
            sickYoungInfant: Boolean(row.sickYoungInfant), // TODO double check what this should look like
            pneumonia: row.pneumonia,
            diarrhea: row.diarrhea,
            malaria: row.malaria,
            sepsis: row.sepsis,
            meningitis_encephalitis: row.meningitis_encephalitis,
            chronicIllnesses: chronicIllnesses,
            otherChronicIllness: row.otherChronicIllness,
        };

        return conditions;
    }   


    /**
   * Get all clinical variables for a patient
   * Returns object with variable names as keys
   */
    private async getClinicalData(
        patientId: string,
        usageTime?: 'admission' | 'discharge' | 'both'
    ): Promise<{ [key: string]: any }> {
        if (!this.db) throw new Error('Database not initialized');

        const query = usageTime
        ? `SELECT variableName, variableValue
            FROM clinical_variables 
            WHERE patientId = ? AND usageTime = ?`
        : `SELECT variableName, variableValue 
            FROM clinical_variables 
            WHERE patientId = ?`;

        const params = usageTime ? [patientId, usageTime] : [patientId];
        const rows = await this.db.getAllAsync<any>(query, params);

        const variables: { [key: string]: any } = {};

        for (const row of rows) {
            const value = this.parseVariableValue(row.variableValue, row.variableType);
            
            // Databse variable names should already match PatientData field names
            variables[row.variableName] = value;
        }

        return variables;
    }

    /**
   * Parse variable value from string to appropriate type
   */
  private parseVariableValue(value: string | null, type: string): any {
    if (value === null) return null;

    // TODO - handle dropdown item types

    switch (type) {
      case 'numeric':
        return parseFloat(value);
      case 'boolean':
        return value === '1' || value === 'true';
      case 'json':
        return JSON.parse(value);
      case 'text':
      default:
        return value;
    }
  }



    // tables i might need if I change my mind:
    //   CREATE TABLE IF NOT EXISTS clinical_variables (
    //             id              INTEGER PRIMARY KEY AUTOINCREMENT,
    //             patientId       TEXT NOT NULL,
    //             variableName    TEXT NOT NULL,
    //             variableValue   TEXT, -- store raw value as text, convert later 

    //             -- Metadata
    //             usageTime       TEXT NOT NULL CHECK (usage_time IN ('admission', 'discharge', 'both')),

    //             FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE,
    //             UNIQUE(patientId, variableName, usageTime) -- ensure no dubplicate variables per patient per usageTime
    //         );

    //         CREATE TABLE IF NOT EXISTS variable_definitions (
    //             id               INTEGER PRIMARY KEY AUTOINCREMENT,
    //             variableName     TEXT NOT NULL UNIQUE,
    //             displayName      TEXT NOT NULL,
    //             variableType     TEXT NOT NULL CHECK (variableType IN ('numeric', 'boolean', 'text', 'json'))

    //             usedByModels     TEXT NOT NULL,   -- JSON array: e.g. ["M6PD-C6-60", "M6PD-C6-60_DISCHARGE"]

    //             -- Validation rules (TODO - remove??)
    //             min_value        REAL,
    //             max_value        REAL,
    //             valid_options    TEXT,             -- JSON array for categorical variables
                
    //             -- UI hints (TODO - remove??)
    //             inputType       TEXT,              -- 'number', 'dropdown', 'radio', 'checkbox'
    //             unit            TEXT,              -- 'kg', '°C', 'bpm', etc.
    //             description     TEXT,
    //         );


    //  CREATE TABLE IF NOT EXISTS admission_clinical_data(
    //             patientId               TEXT PRIMARY KEY,
    //             weight                  TEXT,
    //             waz                     REAL,
    //             muac                    TEXT,
    //             spo2                    TEXT,
    //             temperature             TEXT,
    //             rrate                   TEXT,
    //             // TODO

    //             FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE,
    //         );
          

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