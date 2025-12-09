    
 
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

export const dischargeFormSchema = [
    {
        sectionName: 'dischargeData', 
        isRequired: true,
        requiredFields: ['dischargeStatus', 'feedingStatus_discharge', 'spo2_discharge'],
    },
    {
        sectionName: 'updateAdmissionData', 
        isRequired: false,
        conditionalRequired: {
            sixMonthsAndOver: ['hivStatus']
        },
        optionalFields: ['dob']
    },
    {
        sectionName: 'medicalConditions', 
        isRequired: false,
        requiredFields: ['severeAnaemia', 'pneumonia', 'chronicIllnesses', 
                    'diarrhea', 'malaria', 'sepsis', 'meningitis_encephalitis']
    },
    {
        sectionName: 'vhtReferral',
        isRequired: true,
        requiredFields: ['village', 'vhtName', 'vhtTelephone'],
        optionalFields: ['subvillage']
    },
    {
        sectionName: 'caregiverContact',
        isRequired: true,
        requiredFields: ['caregiverName'],
        optionalFields: ['telephone', 'isCaregiversPhone', 'sendReminders'],
        conditionalRequired: {
            hasTelephone: ['confirmTel'] // if telephone entered, must confirm
        }
    }
]