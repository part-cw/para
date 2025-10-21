    
 
  /**
 * Patient form validation schema with conditional requirements
 * 'isRequired' denotes whether the section must be filled before submission. If false then fields may be blank
 * 'requiredField' and 'oneOf' are fields that must be filled
 * 'optionalFields' are fields that are NOT required
 * 'conditionalRequired' are fields required based on given condition
 * Section name must match keys in displayNames.ts
 */

export interface FormSection {
    sectionName: string;
    isRequired: boolean;
    requiredFields?: string[];
    optionalFields?: string[];
    oneOf?: string[][];
    conditionalRequired?: {
        underSixMonths?: string[];
        sixMonthsAndOver?: string[];
    };
}

export const patientFormSchema = [
    {
        sectionName: 'patientInformation', 
        isRequired: true,
        requiredFields: ['surname', 'firstName', 'sex'],
        oneOf: [
            ['dob'],
            ['birthYear', 'birthMonth'],
            ['approxAge']
        ],
        optionalFields: ['otherName']
    },
    {
        sectionName: 'admissionClinicalData',
        isRequired: true, 
        requiredFields: ['muac', 'weight', 'spo2_admission'],
        conditionalRequired: {
            isNeonate: ['neonatalJaundice'],
            underSixMonths: ['illnessDuration', 'bulgingFontanelle', 'feedingWell'],
            sixMonthsAndOver: ['lastHospitalized', 'hivStatus', 'temperature', 'rrate', 'eyeMovement', 'motorResponse', 'verbalResponse']
        }
    },
    {
        sectionName: 'medicalConditions', 
        isRequired: true,
        requiredFields: ['anaemia', 'pneumonia', 'chronicIllness', 
                    'diarrhea', 'malaria', 'sepsis', 'meningitis']
    },
    {
        sectionName: 'vhtReferral',
        isRequired: false,
        requiredFields: ['village', 'vhtName', 'vhtTelephone'],
        optionalFields: ['subvillage']
    },
    {
        sectionName: 'caregiverContact',
        isRequired: false,
        requiredFields: ['caregiverName'],
        optionalFields: ['telephone', 'isCaregiversPhone', 'sendReminders'],
        conditionalRequired: {
            hasTelephone: ['confirmTel'] // if telephone entered, must confirm
        }
    }
]