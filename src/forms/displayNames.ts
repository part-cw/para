
export const displayNames: Record<string, string> = {
    // Patient Information
    patientInformation: 'Patient Information',
    surname: 'Surname',
    firstName: 'First Name',
    otherName: 'Other Name',
    sex: 'Sex',
    dob: 'Date of Birth',
    birthYear: 'Birth Year',
    birthMonth: 'Birth Month',
    approxAge: 'Approximate Age',
    isUnderSixMonths: 'Patient is less than 6 months old',
    isDOBUnknown: 'Exact date of birth (DOB) unknown',
    isYearMonthUnknown: 'Birth year and month unknown',
    
    // Admission Clinical Data (6-60 months)
    admissionClinicalData: 'Admission Clincial Data',
    lastHospitalized: 'Last Hospitalized',
    hivStatus: 'HIV Status',
    hivQuestion: 'Is the patient known to be HIV-positive or HIV-negative?',
    temperature: 'Temperature',
    rrate: 'Respiratory Rate',
    heartRate: 'Heart Rate',
    eyeMovement: 'Eye movement',
    motorResponse: 'Best motor response',
    verbalResponse: 'Verbal response',

    // Admission Clinical Data (0-60 months)
    illnessDuration: 'Duration of present illness',
    neonatalJaundice: 'Neonatal Jaundice',
    jaundiceQuestion: 'Does the child have any evidence of jaundice?',
    bulgingFontanelle: 'Bulging Fontanelle',
    fontanelleQuestion: 'Does the child have bulging fontanelle?',
    feedingWell: 'Feeding Status',
    feedingStatusQuestion: 'Is the child sucking well when breastfeeding (or feeding well if the child is not being breasfed)?',

    // AdmissionClinical Data (all ages)
    muac: 'MUAC',
    spo2: 'SpO₂',
    weight: 'Weight',

    // Medical Conditions
    medicalConditions: 'Medical Conditions',
    anaemia: 'Severe anaemia',
    pneumonia: 'Pneumonia',
    chronicIllness: 'Chronic Illnesses',
    chronicIllnessQuestion: 'Does the patient have any of the following chronic illnesses? Select all that apply:',
    acuteDiarrhea: 'Acute Diarrhea',
    malaria: 'Malaria',
    sepsis: 'Sepsis',
    meningitis: 'Meningitis/Encephalitis',
    malnutritionStatus: 'Malnutrition Status',
    sickYoungInfant: 'Sick young infant',

    // vhtReferral info
    vhtReferral: 'VHT Referral',
    village: 'Village',
    subvillage: 'Subvillage',
    vhtName: 'VHT Name', 
    vhtTelephone: 'VHT Telephone',

    // caregiverContact
    caregiverContact: 'Caregiver Contact Information',
    caregiverName: 'Name of Head of Family',
    caregiverTel: 'Telephone',
    confirmTel: 'Confirm Telephone',
    sendReminders: 'Receive reminders by text message',
    isCaregiversPhone: 'Phone number belongs to caregiver'
};
