    
 
    /**
     * All text input fields in patient admission form that can be modified by user
     * 'required' and 'oneOf' are fields that must be filled
     * 'optional' are fields that are NOT required
     */
    export const patientFormSchema = [
        {
            section: 'patientInformation', 
            required: ['surname', 'firstName', 'sex'],
            oneOf: [
                ['dob'],
                ['birthYear', 'birthMonth'],
                ['approxAge']
            ],
            optional: ['otherName']
        },
        {
            section: 'admissionClincialData', 
            required: ['lastHospitalized', 'hivStatus', 'temperature', 
                      'muac', 'rrate', 'spo2', 'heartRate', 'eyeMovement', 
                      "motorResponse", "verbalResponse" ]
        },
        {
            section: 'medicalConditions', 
            required: ['anaemia', 'pneumonia', 'chronicIllness', 
                     'acuteDiarrhea', 'malaria', 'sepsis', 'meningitis']
        },
        {
            section: 'vhtReferral',
            required: ['village', 'vhtName', 'vhtTelephone'],
            optional: ['subvillage']
        },
        {
            section: 'caregiverContact',
            required: ['caregiverName'],
            optional: ['telephone', 'confirmTelephone']
        }
    ]