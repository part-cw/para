    
 
  /**
 * Patient form validation schema with conditional requirements
 * 'required' and 'oneOf' are fields that must be filled
 * 'optional' are fields that are NOT required
 * 'conditionalRequired' are fields required based on given condition
 * Section name must match keys in displayNames.ts
 */

export interface FormSection {
    sectionName: string;
    required?: string[];
    optional?: string[];
    oneOf?: string[][];
    conditionalRequired?: {
        underSixMonths?: string[];
        sixMonthsAndOver?: string[];
    };
}

export const patientFormSchema = [
    {
        sectionName: 'patientInformation', 
        required: ['surname', 'firstName', 'sex'],
        oneOf: [
            ['dob'],
            ['birthYear', 'birthMonth'],
            ['approxAge']
        ],
        optional: ['otherName']
    },
    {
        sectionName: 'admissionClinicalData', 
        required: ['muac', 'weight', 'spo2'],
        conditionalRequired: {
            isNeonate: ['neonatalJaundice'],
            underSixMonths: ['illnessDuration', 'bulgingFontanelle', 'feedingWell'],
            sixMonthsAndOver: ['lastHospitalized', 'hivStatus', 'temperature', 'rrate', 'eyeMovement', 'motorResponse', 'verbalResponse']
        }
    },
    {
        sectionName: 'medicalConditions', 
        required: ['anaemia', 'pneumonia', 'chronicIllness', 
                    'acuteDiarrhea', 'malaria', 'sepsis', 'meningitis']
    },
    {
        sectionName: 'vhtReferral',
        required: ['village', 'vhtName', 'vhtTelephone'],
        optional: ['subvillage']
    },
    {
        sectionName: 'caregiverContact',
        required: ['caregiverName'],
        optional: ['telephone', 'isCaregiversPhone', 'sendReminders'],
        conditionalRequired: {
            hasTelephone: ['confirmTel'] // if telephone entered, must confirm
        }
    }
]