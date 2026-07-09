
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


// TODO: CAREPLAN TYPES - implement when building careplan feature
// 
// export interface CareplanIntervention {
//     id: string;
//     condition: string;              // Which condition this intervention treats
//     intervention: string;           // What to do (e.g., "Oxygen therapy")
//     priority: 'critical' | 'high' | 'medium' | 'low';
//     description?: string;           // Additional details
//     frequency?: string;             // How often (e.g., "Every 4 hours")
//     duration?: string;              // How long (e.g., "Until SpO2 > 92%")
// }
// 
// Example interventions by condition:
// - Sick Young Infant: ["Monitor vital signs every 2 hours", "Ensure proper feeding", "Watch for danger signs"]
// - Severe Acute Malnutrition (SAM): ["Therapeutic feeding", "Monitor for complications", "Vitamin A supplementation"]
// - Severe Anaemia: ["Blood transfusion if Hb < 4g/dL", "Iron supplementation", "Folic acid supplementation"]
// - Pneumonia: ["Oxygen therapy if SpO2 < 90%", "Antibiotics as prescribed", "Monitor respiratory rate"]
// - etc.