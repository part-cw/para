    
 
    /**
     * All text input fields in patient admission form that can be modified by user
     * 'required' and 'oneOf' are fields that must be filled
     * 'optional' are fields that are NOT required
     * Section is section name in human readable format
     */
    export const patientFormSchema = [
        {
            sectionName: 'Patient Information', 
            required: ['surname', 'firstName', 'sex'],
            oneOf: [
                ['dob'],
                ['birthYear', 'birthMonth'],
                ['approxAge']
            ],
            optional: ['otherName']
        },
        {
            sectionName: 'Admission Clincial Data', 
            required: ['lastHospitalized', 'hivStatus', 'temperature', 
                      'muac', 'rrate', 'spo2', 'heartRate', 'eyeMovement', 
                      "motorResponse", "verbalResponse" ]
        },
        {
            sectionName: 'Medical Conditions', 
            required: ['anaemia', 'pneumonia', 'chronicIllness', 
                     'acuteDiarrhea', 'malaria', 'sepsis', 'meningitis']
        },
        {
            sectionName: 'VHT Referral',
            required: ['village', 'vhtName', 'vhtTelephone'],
            optional: ['subvillage']
        },
        {
            sectionName: 'Caregiver Contact',
            required: ['caregiverName'],
            optional: ['telephone', 'confirmTelephone']
        }
    ]