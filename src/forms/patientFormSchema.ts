    
 
    /**
     * All text input fields in patient admission form that can be modified by user
     * 'required' and 'oneOf' are fields that must be filled
     * 'optional' are fields that are NOT required
     * Section name must match keys in displayNames.ts
     */
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
            required: ['lastHospitalized', 'hivStatus', 'temperature', 
                      'muac', 'rrate', 'spo2', 'heartRate', 'eyeMovement', 
                      "motorResponse", "verbalResponse" ]
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
            optional: ['telephone', 'confirmTelephone']
        }
    ]