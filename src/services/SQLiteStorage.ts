import * as SecureStore from 'expo-secure-store';
import * as SQLite from "expo-sqlite";
import { PatientData } from "../contexts/PatientData";
import { IStorageService } from "./StorageService";

const CURRENT_DRAFT_KEY = 'current_draft_key';

export class SQLiteStorage implements IStorageService {
    private db: SQLite.SQLiteDatabase | null = null;

    async init(): Promise<void> {
        // open or create db file and return connection -- TODO: add pathname?
        this.db = await SQLite.openDatabaseAsync('patients.db') 

        // create draft table if they don't exist
        await this.db.execAsync(
            `CREATE TABLE IF NOT EXISTS drafts (
                draftKey    TEXT PRIMARY KEY,
                patientData TEXT NOT NULL,
                createdAt   TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt   TEXT DEFAULT CURRENT_TIMESTAMP
            );

             CREATE TABLE IF NOT EXISTS patients (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                patientId           TEXT UNIQUE NOT NULL,
                surname             TEXT,
                firstName           TEXT,
                otherName           TEXT,
                sex                 TEXT,
                dob                 TEXT,
                ageInMonths         REAL,
                weight              REAL,
                muac                TEXT,
                village             TEXT,
                caregiverName       TEXT,
                caregiverTel        TEXT,
                riskScore           REAL,
                riskCategory        TEXT,
                malnutritionStatus  TEXT,
                submittedAt         TEXT NOT NULL,
                isDraft             INTEGER DEFAULT 0,
                patientData         TEXT NOT NULL,
                admissionTime       TEXT NOT NULL,
                createdAt           TEXT DEFAULT CURRENT_TIMESTAMP
                ....TODO
            )`
        )

        console.log('✅ SQLite database initialized');
    }

    // ========== DRAFT OPERATIONS ==========

    async saveDraft(key: string, data: PatientData): Promise<void> {
        if (!this.db) throw new Error('Database not initialized'); 
        
        const jsonData = JSON.stringify(data);

        await this.db.runAsync(`
            INSERT INTO drafts (draftKey, patientData) 
            VALUES (?, ?)
            ON CONFLICT (draftKey) DO UPDATE
                SET patientData = EXCLUDED.patientData,
                    updatedAt = CURRENT_TIMESTAMP
            `,
            [key, jsonData]
        )

        console.log('💾 Draft saved:', key);
    }

    async deleteDraft(key: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized'); 

        await this.db.runAsync('DELETE FROM drafts WHERE draftKey = ?', [key])
        console.log('🗑️ Deleted draft: ', key)
    }

    

    async getAllDrafts(): Promise<Array<{ key: string; data: PatientData; }>> {
        if (!this.db) throw new Error('Database not initialized');

        // get all drafts in descending order of update
        const results = await this.db.getAllAsync<{ 
            draftKey: string; 
            patientData: string;
            updatedAt: string;
        }>(
            `SELECT draftKey, patientData, updatedAt FROM drafts
             ORDERED BY updatedAt DESC
            `
        );

        if (!results) return [];

        return results.map(row => {
            const parsed = JSON.parse(row.patientData);
            if (parsed.dob) parsed.dob = new Date(parsed.dob);
            
            return {
                key: row.draftKey,
                data: parsed
            };
        });
    }

    async getDraft(key: string): Promise<PatientData | null> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.getFirstAsync(
            `
            SELECT patientData FROM drafts
            WHERE draftKey = ?
            `, [key]
        );

        if (!result) return null;

        const parsed = JSON.parse(result as string)

        // convert string dates back to Date object, if they exist
        if (parsed.dob) parsed.dob = new Date(parsed.dob)

        return parsed as PatientData;

    }

    async getCurrentDraftKey(): Promise<string | null> {
        return await SecureStore.getItemAsync(CURRENT_DRAFT_KEY);
    }

    async setCurrentDraftKey(key: string): Promise<void> {
        await SecureStore.setItemAsync(CURRENT_DRAFT_KEY, key);
    }

    // ========== COMPLETED PATIENT OPERATIONS ==========

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

    // ========== UTILITY ==========

    async clearAll(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.execAsync(`
            DELETE * FROM drafts;
            DELETE * FROM patients;
        `);

        await SecureStore.deleteItemAsync(CURRENT_DRAFT_KEY);

        console.log('🧹 All data cleared');
    }
    
}