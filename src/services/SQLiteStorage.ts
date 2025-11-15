import * as SQLite from "expo-sqlite";
import { CURRENT_USER } from "../config";
import { PatientData } from "../contexts/PatientData";
import { RiskAssessment, RiskPrediction } from '../models/types';
import { normalizeBoolean } from "../utils/normalizer";
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
    private readonly DB_NAME = 'para.db';
    private readonly ENCRYPTION_KEY_STORAGE = 'db_encryption_key';


    async init(): Promise<void> {
        // TODO uncomment encryption stuff add PRAGMA config to app.json. See https://docs.expo.dev/versions/latest/sdk/sqlite/#configuration-in-app-config
        // this.encryptionKey = await this.getOrCreateEncryptionKey();
        
        this.db = await SQLite.openDatabaseAsync(this.DB_NAME);

        // Enable encryption (if supported)
        // try {
        //     await this.db.execAsync(`PRAGMA key = '${this.encryptionKey}';`);
        // } catch (error) {
        //     console.warn('Encryption not supported in this SQLite build:', error);
        // }

        await this.initializeSchema();
    }

    // private async getOrCreateEncryptionKey(): Promise<string> {
    //     let key = await SecureStore.getItemAsync(this.ENCRYPTION_KEY_STORAGE);
        
    //     if (!key) {
    //         // Generate a new 256-bit key
    //         key = Array.from({ length: 32 }, () => 
    //             Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    //         ).join('');
            
    //         await SecureStore.setItemAsync(this.ENCRYPTION_KEY_STORAGE, key);
    //     }
        
    //     return key;
    // }

    async initializeSchema(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        
        await this.db.execAsync(`
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS patients (
                -- Patient info 
                patientId               TEXT PRIMARY KEY,
                surname                 TEXT NOT NULL,
                firstName               TEXT NOT NULL,
                otherName               TEXT,
                sex                     TEXT,  --  add this? NOT NULL CHECK (sex IN ('male', 'female'))
                dob                     TEXT,
                birthYear               TEXT,
                birthMonth              TEXT,
                approxAgeInYears        TEXT,
                isDOBUnknown            INTEGER DEFAULT 0,
                isYearMonthUnknown      INTEGER DEFAULT 0,
                isUnderSixMonths        INTEGER NOT NULL,
                isNeonate               INTEGER,
                ageInMonths             INTEGER,      
                
                -- VHT info
                village                 TEXT,
                subvillage              TEXT,
                vhtName                 TEXT,
                vhtTelephone            TEXT,

                -- Caregiver contact
                caregiverName           TEXT,
                caregiverTel            TEXT,
                confirmTel              TEXT,
                sendReminders           INTEGER DEFAULT 0,
                isCaregiversPhone       INTEGER DEFAULT 0, -- TODO - default to true (1)

                -- Discharge Info
                dischargeDiagnosis      TEXT,

                -- Metadata & status flags
                admissionStartedAt      TEXT NOT NULL,
                admissionCompletedAt    TEXT,
                updatedAt               TEXT,
                dischargedAt            TEXT,
                isDraftAdmission        INTEGER DEFAULT 1,
                isDischarged            INTEGER DEFAULT 0,
                isArchived              INTEGER DEFAULT 0,
                admittedBy              TEXT,
                dischargedBy            TEXT

            );

            CREATE TABLE IF NOT EXISTS medical_conditions (
                patientId               TEXT PRIMARY KEY,
                malnutritionStatus      TEXT,
                sickYoungInfant         INTEGER, -- 0 (false) or 1 (true)
                pneumonia               TEXT,
                severeAnaemia           TEXT,
                diarrhea                TEXT,
                malaria                 TEXT,
                sepsis                  TEXT,
                meningitis_encephalitis TEXT,
                chronicIllnesses        TEXT, -- JSON array e.g.['HIV', 'TB', etc]
                otherChronicIllness     TEXT,

                FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS clinical_variables (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                patientId       TEXT NOT NULL,
                variableName    TEXT NOT NULL,
                variableValue   TEXT, -- store raw value as text, convert later 
                variableType    TEXT NOT NULL,

                -- Metadata
                usageTime       TEXT NOT NULL CHECK (usageTime IN ('admission', 'discharge', 'both')),

                FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE,
                UNIQUE(patientId, variableName, usageTime) -- ensure no dubplicate variables per patient per usageTime
            );


            CREATE TABLE IF NOT EXISTS risk_predictions (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                patientId           TEXT NOT NULL,
                modelName           TEXT NOT NULL,
                usageTime           TEXT NOT NULL CHECK (usageTime IN ('admission', 'discharge')),
                riskScore           REAL NOT NULL,
                riskCategory        TEXT NOT NULL,
                
                -- context/metadata at time of calculation
                ageInMonths_atCalc  INTEGER NOT NULL,  
                hivStatus_atCalc    TEXT NOT NULL,
                calculatedAt        TEXT NOT NULL,

                FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE
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
            CREATE INDEX IF NOT EXISTS idx_patients_draft ON patients(isDraftAdmission, admissionStartedAt);
            CREATE INDEX IF NOT EXISTS idx_patients_archived ON patients(isArchived);
            CREATE INDEX IF NOT EXISTS idx_clinical_variables_patient ON clinical_variables(patientId, usageTime);
            CREATE INDEX IF NOT EXISTS idx_risk_predictions_patient ON risk_predictions(patientId, usageTime);
            -- CREATE INDEX IF NOT EXISTS idx_risk_predictions_model ON risk_predictions(modelName); -- remove?
            -- CREATE INDEX IF NOT EXISTS idx_audit_log_patient ON audit_log(patientId, changedAt); -- remove?
        `);
    }

    // ========== PATIENT OPERATIONS ==========

    async submitPatient(patientId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const now = new Date().toISOString();

        // flip isDraftAdmision flag and add metadata
        await this.db.runAsync(`
            UPDATE patients 
            SET isDraftAdmission = 0, admissionCompletedAt = ?, updatedAt = ?
            WHERE patientId = ?
        `, [now, now, patientId]);

        await this.logChanges(patientId, 'SUBMIT', null, null, null);
        console.log(`✅ Patient ${patientId} submitted`);
    }

    async getPatient(patientId: string): Promise<PatientData | null> {
        if (!this.db) throw new Error('Database not initialized');

        // get patient demographics (basic info, vht, caregiver, metadata)
        const patientRow = await this.db.getFirstAsync<PatientData>(`
            SELECT * FROM patients WHERE patientId = ?
        `, [patientId]);

        if (!patientRow) return null;
        
        const conditions = await this.getMedicalConditions(patientId)
        const clinicalData = await this.getClinicalData(patientId)

        return this.buildPatientData(patientRow, conditions, clinicalData)
    }
  
    /**
     * use in edit screens - updates all changed fields  in one go
     */
    async updatePatient(patientId: string, updates: Partial<PatientData>): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        
        const now = new Date().toISOString();

        await this.db.withTransactionAsync(async () => {
            // Update patient demographics
            const patientFields = this.extractPatientFields(updates);
            if (Object.keys(patientFields).length > 0) {
                await this.updatePatientTable(patientId, patientFields, now);
            }

            // Update medical conditions
            const conditionFields = this.extractConditionFields(updates);
            if (Object.keys(conditionFields).length > 0) {
                await this.updateMedicalConditions(patientId, conditionFields);
            }

            // Update clinical variables
            const clinicalFields = this.extractClinicalFields(updates);
            for (const [varName, value] of Object.entries(clinicalFields)) {
                await this.upsertClinicalVariable(patientId, varName, value);
            }
        });

        console.log(`✅ Patient ${patientId} updated`);
    }

    async deletePatient(patientId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync(
            'DELETE FROM patients WHERE patientId = ?',
            [patientId]
        );

        console.log(`✅ Patient ${patientId} records deleted`);
    }

    /**
     * 
     * inserts new patient info into patients, medical_conditions, and clinical_varibales tables
     * and updates audit log
     */
    async insertNewPatient(data: PatientData, patientId: string, timestamp: string, isDraft: boolean): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db?.withTransactionAsync(async () => {
            // TODO - add admittedBy CURRENT_USER, make sure it's a user id from userTable once that is implemetneed
            await this.db?.runAsync(`
                INSERT INTO patients (
                    patientId, surname, firstName, otherName, sex, 
                    dob, birthYear, birthMonth, approxAgeInYears, ageInMonths, isDOBUnknown, isYearMonthUnknown, isUnderSixMonths, isNeonate,
                    village, subvillage, vhtName, vhtTelephone, 
                    caregiverName, caregiverTel, confirmTel, sendReminders, isCaregiversPhone,
                    dischargeDiagnosis, admissionStartedAt, updatedAt, isDraftAdmission
                ) 
                VALUES (
                    ?, ?, ?, ?, ?,              -- name/sex
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,  -- age demographics
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,  -- vht + caregiver info
                    ?, ?, ?, ?                  -- discharge & etadata
                )
            `, [
                patientId, 
                data.surname, 
                data.firstName, 
                data.otherName || null, 
                data.sex, 
                data.dob ? data.dob.toISOString() : null, 
                data.birthYear || null, 
                data.birthMonth || null, 
                data.approxAgeInYears || null, 
                data.ageInMonths || null,
                data.isDOBUnknown ? 1 : 0,
                data.isYearMonthUnknown ? 1: 0,
                data.isUnderSixMonths ? 1 : 0, 
                data.isNeonate !== null ? (data.isNeonate ? 1 : 0) : null,
                data.village || null,
                data.subvillage || null, 
                data.vhtName || null, 
                data.vhtTelephone || null, 
                data.caregiverName || null, 
                data.caregiverTel || null, 
                data.confirmTel|| null, 
                data.sendReminders ? 1 : 0, 
                data.isCaregiversPhone ? 1 : 0,
                data.dischargeDiagnosis || null,
                data.admissionStartedAt || timestamp, 
                timestamp, 
                isDraft ? 1 : 0
             ]);

            // Insert medical conditions
            await this.db!.runAsync(`
                INSERT INTO medical_conditions (
                    patientId, malnutritionStatus, sickYoungInfant,
                    pneumonia, severeAnaemia, diarrhea, malaria, sepsis,
                    meningitis_encephalitis, chronicIllnesses, otherChronicIllness
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                patientId,
                data.malnutritionStatus || null,
                data.sickYoungInfant ? 1 : 0,
                data.pneumonia || '',
                data.severeAnaemia || '',
                data.diarrhea || '',
                data.malaria || '',
                data.sepsis || '',
                data.meningitis_encephalitis || '',
                JSON.stringify(data.chronicIllnesses || []),
                data.otherChronicIllness || null
            ]);
        });

        await this.logChanges(patientId, 'CREATE', null, null, null);
        console.log(`✅ New patient ${patientId} created`);
    }


    // ========== DRAFT OPERATIONS ==========

    async saveDraft(data: PatientData, patientId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        
        const now = new Date().toISOString();

        // Check if draft exists
        const existing = await this.db.getFirstAsync<{ patientId: string }>(
            `SELECT patientId FROM patients 
                WHERE patientId = ?`,
            [patientId]
        );

        if (existing) {
            // DRAFT EXISTS: Use UPDATE
            await this.updatePatient(patientId, data);
        } else {
            // NEW DRAFT: Use INSERT
            await this.insertNewPatient(data, patientId, now, true);
        }
    }

  /**
   * 
   * get specific draft admission by id
   */
    async getDraft(patientId: string): Promise<PatientData | null> {
        if (!this.db) throw new Error('Database not initialized');

        const draft = await this.db.getFirstAsync<any>(
            `SELECT patientId FROM patients 
             WHERE patientId = ? AND isDraftAdmission = 1`,
            [patientId]
        );

        if (!draft) return null;
        return this.getPatient(patientId);
    }

    /**
     * Get most recent draft (if exists)
     */
    async getMostRecentDraft(): Promise<PatientData | null> {
        if (!this.db) throw new Error('Database not initialized');

        const draft = await this.db.getFirstAsync<any>(
            `SELECT patientId FROM patients 
            WHERE isDraftAdmission = 1 
            ORDER BY admissionStartedAt DESC 
            LIMIT 1`
        );

        if (!draft) return null;

        return await this.getPatient(draft.patientId);
    }

    /**
     * 
     * delete specific draft admission by id
     */
    async deleteDraft(patientId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db?.runAsync(
            'DELETE FROM patients WHERE patientId = ? AND isDraftAdmission = 1',
            [patientId]
        );

        console.log(`✅ Draft ${patientId} deleted`);
    }

    /*
    * deletes all draft admissions
    */
    async deleteAllDrafts(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync('DELETE FROM patients WHERE isDraftAdmission = 1')
        console.log('✅ All drafts deleted');
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

        return await this.fetchPatientList(rows)
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

        return await this.fetchPatientList(rows)
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

       return await this.fetchPatientList(rows)
    }


    // ========== RISK OPERATIONS ==========

    async saveRiskPrediction(patientId: string, prediction: RiskPrediction, usageTime: 'admission' | 'discharge'): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const now = new Date().toISOString();
        
        // Get current patient context
        const patient = await this.getPatient(patientId);
        if (!patient) throw new Error(`Patient ${patientId} not found`);

        await this.db.withTransactionAsync(async () => {
            const result = await this.db!.runAsync(`
                INSERT OR REPLACE INTO risk_predictions (
                    patientId, modelName, usageTime, riskScore, riskCategory,
                    ageInMonths_atCalc, hivStatus_atCalc, calculatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                patientId,
                prediction.model,
                usageTime,
                prediction.riskScore,
                prediction.riskCategory,
                patient.ageInMonths || 0,
                patient.hivStatus || 'n/a',
                now
            ]);

            // TODO Save top predictors if available
            // const predictionId = result.lastInsertRowId;

            // if (prediction.topPredictors && prediction.topPredictors.length > 0) {
            //     for (let i = 0; i < prediction.topPredictors.length; i++) {
            //         const predictor = prediction.topPredictors[i];
            //         await this.db!.runAsync(`
            //             INSERT INTO top_predictors (
            //                 predictionId, featureName, contribution, rank
            //             ) VALUES (?, ?, ?, ?)
            //         `, [predictionId, predictor.name, predictor.contribution, i + 1]);
            //     }
            // }
        });

        console.log(`✅ Risk prediction saved for ${patientId} at ${usageTime}`);
    }

    async getRiskAssessment(patientId: string): Promise<RiskAssessment> {
        if (!this.db) throw new Error('Database not initialized');

        const predictions = await this.db.getAllAsync<any>(`
            SELECT * FROM risk_predictions
            WHERE patientId = ?
            ORDER BY calculatedAt ASC -- TODO makesure most recent is last
        `, [patientId]);
        
        return await this.buildRiskAssesment(predictions)        
    }

    private async buildRiskAssesment(predictions: any[]): Promise<RiskAssessment> {
        const assessment: RiskAssessment = {};

        for (const pred of predictions) {
            // const topPredictors = await this.db?.getAllAsync<any>(`
            //     SELECT featureName, contribution 
            //     FROM top_predictors 
            //     WHERE predictionId = ?
            //     ORDER BY rank ASC
            // `, [pred.id]);

            const riskPrediction: RiskPrediction = {
                model: pred.modelName,
                riskScore: pred.riskScore,
                riskCategory: pred.riskCategory,
                // topPredictors: topPredictors.map(tp => ({
                //     name: tp.featureName,
                //     contribution: tp.contribution
                // }))
            };

            if (pred.usageTime === 'admission') {
                assessment.admission = riskPrediction;
                // TODO - use most recent admission prediction if we have mulitple risks 
            } else {
                assessment.discharge = riskPrediction;
            }
        }

        return assessment;
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
            DELETE FROM patients;
            DELETE FROM medical_conditions;
            DELETE FROM clinical_variables;
            DELETE FROM risk_predictions;
            DELETE FROM top_predictors;
            DELETE FROM audit_log;
        `);

        console.log('🧹 All data cleared');
    }

    // ========== HELPERS ==========

     private async insertClinicalVariables(patientId: string, data: PatientData): Promise<void> {
        const variables = [
            // Common variables
            { name: 'weight', value: data.weight, type: 'numeric', usage: 'admission' },
            { name: 'waz', value: data.waz?.toString(), type: 'numeric', usage: 'admission' },
            { name: 'muac', value: data.muac, type: 'numeric', usage: 'admission' },
            { name: 'spo2_admission', value: data.spo2_admission, type: 'numeric', usage: 'admission' },
            
            // 6-60 months
            { name: 'hivStatus', value: data.hivStatus, type: 'text', usage: 'admission' },
            { name: 'temperature', value: data.temperature, type: 'numeric', usage: 'admission' },
            { name: 'temperatureSquared', value: data.temperatureSquared?.toString(), type: 'numeric', usage: 'admission' },
            { name: 'rrate', value: data.rrate, type: 'numeric', usage: 'admission' },
            { name: 'lastHospitalized', value: data.lastHospitalized, type: 'text', usage: 'admission' },
            { name: 'eyeMovement', value: data.eyeMovement, type: 'text', usage: 'admission' },
            { name: 'motorResponse', value: data.motorResponse, type: 'text', usage: 'admission' },
            { name: 'verbalResponse', value: data.verbalResponse, type: 'text', usage: 'admission' },
            { name: 'bcsScore', value: data.bcsScore?.toString(), type: 'numeric', usage: 'admission' },
            { name: 'abnormalBCS', value: data.abnormalBCS !== null ? (data.abnormalBCS ? '1' : '0') : null, type: 'boolean', usage: 'admission' },
            
            // 0-6 months
            { name: 'illnessDuration', value: data.illnessDuration, type: 'text', usage: 'admission' },
            { name: 'neonatalJaundice', value: data.neonatalJaundice !== null ? (data.neonatalJaundice ? '1' : '0') : null, type: 'boolean', usage: 'admission' },
            { name: 'bulgingFontanelle', value: data.bulgingFontanelle !== null ? (data.bulgingFontanelle ? '1' : '0') : null, type: 'boolean', usage: 'admission' },
            { name: 'feedingWell', value: data.feedingWell !== null ? (data.feedingWell ? '1' : '0') : null, type: 'boolean', usage: 'admission' },
            
            // Discharge variables
            { name: 'spo2_discharge', value: data.spo2_discharge, type: 'numeric', usage: 'discharge' },
            { name: 'feedingWell_discharge', value: data.feedingWell_discharge !== null ? (data.feedingWell_discharge ? '1' : '0') : null, type: 'boolean', usage: 'discharge' },
            { name: 'dischargeReason', value: data.dischargeReason, type: 'text', usage: 'discharge' },
        ];

        for (const variable of variables) {
            if (variable.value !== undefined && variable.value !== null && variable.value !== '') {
                await this.db!.runAsync(`
                    INSERT OR REPLACE INTO clinical_variables (
                        patientId, variableName, variableValue, variableType, usageTime
                    ) VALUES (?, ?, ?, ?, ?)
                `, [patientId, variable.name, variable.value, variable.type, variable.usage]);
            }
        }
    }

    private async upsertClinicalVariable(
        patientId: string,
        varName: string,
        value: any
    ): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const varType = this.determineVariableType(varName);
        const usageTime = this.determineUsageTime(varName);
        const stringValue = this.convertToString(value, varType);

        // If value is null/undefined/empty, DELETE the row instead of inserting
        if (stringValue === null || stringValue === '') {
            await this.db.runAsync(`
                DELETE FROM clinical_variables 
                WHERE patientId = ? AND variableName = ? AND usageTime = ?
            `, [patientId, varName, usageTime]);
            return;
        }

        await this.db.runAsync(`
            INSERT OR REPLACE INTO clinical_variables (
                patientId, variableName, variableValue, variableType, usageTime
            ) VALUES (?, ?, ?, ?, ?)
        `, [patientId, varName, stringValue, varType, usageTime]);
    }

    private async updatePatientTable(
        patientId: string,
        fields: { [key: string]: any },
        timestamp: string
    ): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const setClauses: string[] = [];
        const values: any[] = [];

        for (const [key, value] of Object.entries(fields)) {
            setClauses.push(`${key} = ?`);
            values.push(value);
        }

        setClauses.push('updatedAt = ?');
        values.push(timestamp);
        values.push(patientId);

        await this.db.runAsync(`
            UPDATE patients 
            SET ${setClauses.join(', ')}
            WHERE patientId = ?
        `, values);
    }

    private async updateMedicalConditions(
        patientId: string,
        fields: { [key: string]: any }
    ): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const setClauses: string[] = [];
        const values: any[] = [];

        for (const [key, value] of Object.entries(fields)) {
            setClauses.push(`${key} = ?`);
            values.push(value);
        }

        values.push(patientId);

        await this.db.runAsync(`
            UPDATE medical_conditions 
            SET ${setClauses.join(', ')}
            WHERE patientId = ?
        `, values);
    }

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
            sickYoungInfant: Boolean(row.sickYoungInfant),
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
        ? `SELECT variableName, variableValue, variableType
            FROM clinical_variables 
            WHERE patientId = ? AND usageTime = ?`
        : `SELECT variableName, variableValue, variableType 
            FROM clinical_variables 
            WHERE patientId = ?`;

        const params = usageTime ? [patientId, usageTime] : [patientId];
        const rows = await this.db.getAllAsync<any>(query, params);

        // console.log('~~~~ rows', rows)

        const variables: { [key: string]: any } = {};

        for (const row of rows) {
            const value = this.parseVariableValue(row.variableValue, row.variableType);
            
            // Databse variable names should already match PatientData field names
            variables[row.variableName] = value;
        }

        return variables;
    }

    private async logChanges(
        patientId: string,
        action: string,
        fieldChanged: string | null,
        oldValue: string | null,
        newValue: string | null
    ): Promise<void> {
        if (!this.db) return;

        try {
            await this.db.runAsync(`
                INSERT INTO audit_log (
                    patientId, action, fieldChanged, oldValue, newValue, changedBy
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [patientId, action, fieldChanged, oldValue, newValue, CURRENT_USER]);
        } catch (error) {
            console.warn('Failed to log audit:', error);
        }
    }

    private buildPatientData(patientRow: any, conditions: { [key: string]: any; }, clinicalData: { [key: string]: any; }): PatientData {
        return {
            patientId: patientRow.patientId,
            admissionStartedAt: patientRow.admissionStartedAt,
            surname: patientRow.surname,
            firstName: patientRow.firstName,
            otherName: patientRow.otherName || '',
            sex: patientRow.sex,
            isDOBUnknown: patientRow.isDOBUnknown,
            isYearMonthUnknown: patientRow.isYearMonthUnknown,
            isUnderSixMonths: patientRow.isUnderSixMonths,
            isNeonate: patientRow.isNeonate,
            dob: !patientRow.dob ? null : new Date(patientRow.dob),
            birthYear: patientRow.birthYear,
            birthMonth: patientRow.birthMonth,
            approxAgeInYears: patientRow.approxAgeInYears,
            ageInMonths: patientRow.ageInMonths,

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
            
            isDraftAdmission: patientRow.isDraftAdmission,
            isDischarged: patientRow.isDischarged,
            isArchived: patientRow.isArchived,

            ...conditions,
            ...clinicalData
        } as PatientData
    }


    private async fetchPatientList(rows: any[]): Promise<PatientData[]> {
        const patients = await Promise.all(
            rows.map(row => this.getPatient(row.patientId))
        );

        // remove falsy patient objects (eg null undefined)
        return patients.filter(Boolean) as PatientData[];
    }

    private extractPatientFields(updates: Partial<PatientData>): { [key: string]: any } {
        const patientFields: { [key: string]: any } = {};
        const fieldMap: { [key: string]: string } = {
            surname: 'surname',
            firstName: 'firstName',
            otherName: 'otherName',
            sex: 'sex',
            dob: 'dob',
            birthYear: 'birthYear',
            birthMonth: 'birthMonth',
            approxAgeInYears: 'approxAgeInYears',
            ageInMonths: 'ageInMonths',
            isDOBUnknown: 'isDOBUnknown',
            isYearMonthUnknown: 'isYearMonthUnknown',
            isUnderSixMonths: 'isUnderSixMonths',
            isNeonate: 'isNeonate',
            village: 'village',
            subvillage: 'subvillage',
            vhtName: 'vhtName',
            vhtTelephone: 'vhtTelephone',
            caregiverName: 'caregiverName',
            caregiverTel: 'caregiverTel',
            confirmTel: 'confirmTel',
            sendReminders: 'sendReminders',
            isCaregiversPhone: 'isCaregiversPhone',
            dischargeDiagnosis: 'dischargeDiagnosis',
            isDischarged: 'isDischarged',
            isArchived: 'isArchived',
            isDraftAdmission: 'isDraftAdmission'
        };

        for (const [key, dbColumn] of Object.entries(fieldMap)) {
            if (key in updates) {
                const value = (updates as any)[key];
                
                if (key === 'dob' && value instanceof Date) {
                    patientFields[dbColumn] = value.toISOString();
                } else if (typeof value === 'boolean') {
                    patientFields[dbColumn] = value ? 1 : 0;
                } else {
                    patientFields[dbColumn] = value;
                }
            }
        }

        return patientFields;
    }

    private extractConditionFields(updates: Partial<PatientData>): { [key: string]: any } {
        const conditionFields: { [key: string]: any } = {};
        const conditionKeys = [
            'malnutritionStatus',
            'sickYoungInfant',
            'pneumonia',
            'severeAnaemia',
            'diarrhea',
            'malaria',
            'sepsis',
            'meningitis_encephalitis',
            'chronicIllnesses',
            'otherChronicIllness'
        ];

        for (const key of conditionKeys) {
            if (key in updates) {
                const value = (updates as any)[key];
                
                if (key === 'sickYoungInfant') {
                    conditionFields[key] = value ? 1 : 0;
                } else if (key === 'chronicIllnesses') {
                    conditionFields[key] = JSON.stringify(value || []);
                } else {
                    conditionFields[key] = value;
                }
            }
        }

        return conditionFields;
    }

    private extractClinicalFields(updates: Partial<PatientData>): { [key: string]: any } {
        const clinicalFields: { [key: string]: any } = {};
        const clinicalKeys = [
            'weight', 'waz', 'muac', 'spo2_admission',
            'hivStatus', 'temperature', 'temperatureSquared', 'rrate', 'lastHospitalized',
            'eyeMovement', 'motorResponse', 'verbalResponse', 'bcsScore', 'abnormalBCS',
            'illnessDuration', 'neonatalJaundice', 'bulgingFontanelle', 'feedingWell',
            'spo2_discharge', 'feedingWell_discharge', 'dischargeReason'
        ];

        for (const key of clinicalKeys) {
            if (key in updates) {
                clinicalFields[key] = (updates as any)[key];
            }
        }

        return clinicalFields;
    }

    private determineVariableType(varName: string): string {
        const numericVars = ['waz', 'temperatureSquared', 'bcsScore'];
        const booleanVars = ['neonatalJaundice', 'bulgingFontanelle', 'feedingWell', 
                           'feedingWell_discharge', 'abnormalBCS'];
        // const jsonVars = ['eyeMovement', 'motorResponse', 'verbalResponse'];

        if (numericVars.includes(varName)) return 'numeric';
        if (booleanVars.includes(varName)) return 'boolean';
        // if (jsonVars.includes(varName)) return 'json';
        return 'text';
    }

    private determineUsageTime(varName: string): 'admission' | 'discharge' | 'both' {
        const dischargeVars = ['spo2_discharge', 'feedingWell_discharge', 'dischargeReason'];
        if (dischargeVars.includes(varName)) return 'discharge';
        return 'admission';
    }

    private convertToString(value: any, variableType: string): string | null {
        if (value === null || value === undefined || value == '') return null;
        
        if (variableType === 'json') {
            return JSON.stringify(value);
        } else if (variableType === 'boolean') {
            return normalizeBoolean(value) ? '1' : '0';
        } else {
            return value.toString();
        }
    }

    /**
   * Parse variable value from string to appropriate type
   */
  private parseVariableValue(value: string | null, type: string): any {
    if (value === null) return null;

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
}
