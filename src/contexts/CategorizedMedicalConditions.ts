
/**
 * A patient's targeted medical conditions, categorized by status.
 * This is the processed form of the raw medical-conditions map returned by
 * getMedicalConditions() — see getCategorizedMedicalConditions().
 */
export interface CategorizedMedicalConditions {
    positive: string[];
    suspected: string[];
    diarrhea?: string;
}

export const initialCategorizedMedicalConditions: CategorizedMedicalConditions = {
    positive: [],
    suspected: []
}