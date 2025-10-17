import { usePatientData } from '@/src/contexts/PatientDataContext';
import { displayNames } from '@/src/forms/displayNames';
import { patientFormSchema } from '@/src/forms/patientFormSchema';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Card, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO -- allow submit even if VHT and caregiver pages incomplete. Say 'Missing Information... are you sure you want to submit? OK or Cancel
export default function ReviewScreen() {
    const { colors } = useTheme()
    const { patientData, savePatientData } = usePatientData();


    const [reviewedSections, setReviewedSections] = useState<Set<string>>(new Set());
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const allSections = new Set<string>([
        'patientInformation',
        'admissionClinicalData',
        'medicalConditions',
        'vhtReferral',
        'caregiverContact'
    ]);

    // track which sections are completed
    useEffect(() => {
        const missingSectionFields = validateRequiredFields(); // section objects
        const incompleteSections = Object.keys(missingSectionFields) // display names

        for (const section of allSections) {
            // check that section is complete
            if (!incompleteSections.includes(displayNames[section])) {
                setCompletedSections(prev => new Set([...prev, section]))
            }
        }
    }, [patientData])

    const validateRequiredFields = () => {
        console.log('validating required fields...')
        const missingSectionFields: { [key: string]: string[] } = {};

        for (const section of patientFormSchema) {
            const missingFields: string[] = [];

            // check required fields
            for (const fieldName of section.required) {
                const fieldValue = patientData[fieldName as keyof typeof patientData];

                // Check if field is empty or null
                if (isEmptyField(fieldValue)) {
                    missingFields.push(displayNames[fieldName] || fieldName); // if no display name, push fieldName
                }
            }

            // check optional and 'oneof' fields
            if (section.oneOf) {
                let hasValidOption = false;
 
                for (const option of section.oneOf) {
                    // check if all fields in this option are filled
                    const allFieldsFilled = option.every(fieldName => {
                        const fieldValue = patientData[fieldName as keyof typeof patientData]
                        // true if field value not empty string or null
                        return !isEmptyField(fieldValue)
                    })

                    if (allFieldsFilled) {
                        hasValidOption = true;
                        break;
                    }
                }

                if (!hasValidOption){
                    // TODO - hardcode message for now - only age info has 'oneof'. In the future we may want to create a more dynamic message
                    missingFields.push('Age information')
                }
            }

            // check conditionally required fields
            if (section.conditionalRequired) {
                if (section.sectionName === 'admissionClinicalData') {
                    // add missing required clinical data fields for 0-6 mo patients
                    if (patientData.isUnderSixMonths) {
                        const underSixMonthsFields = section.conditionalRequired.underSixMonths || []
                        
                        for (const fieldName of underSixMonthsFields) {
                            const fieldValue = patientData[fieldName as keyof typeof patientData]
                            if (isEmptyField(fieldValue)) {
                                 missingFields.push(displayNames[fieldName] || fieldName);
                            }
                        }
                    } else if (patientData.isNeonate) {
                        const neonateFields = section.conditionalRequired.isNeonate || []

                        for (const fieldName of neonateFields) {
                            const fieldValue = patientData[fieldName as keyof typeof patientData]
                            if (isEmptyField(fieldValue)) {
                                 missingFields.push(displayNames[fieldName] || fieldName);
                            }
                        }
                    } else {
                         // add missing required clinical data fields for 6-60 mo patients
                        const overSixMonthsFields = section.conditionalRequired.sixMonthsAndOver || []
                        
                        for (const fieldName of overSixMonthsFields) {
                            const fieldValue = patientData[fieldName as keyof typeof patientData]
                            if (isEmptyField(fieldValue)) {
                                 missingFields.push(displayNames[fieldName] || fieldName);
                            }
                        }
                    }
                }

                if (section.sectionName === 'caregiverContact') {
                    // Check if telephone is provided, then confirmTelephone is required
                    if (patientData.caregiverTel && patientData.caregiverTel.trim() !== '') {
                        const hasTelephoneFields = section.conditionalRequired.hasTelephone || [];
                        
                        for (const fieldName of hasTelephoneFields) {
                            const fieldValue = patientData[fieldName as keyof typeof patientData];
                            if (isEmptyField(fieldValue)) {
                                missingFields.push(displayNames[fieldName] || fieldName);
                            }
                        }
                    }
                }
            }

            if (missingFields.length > 0) {
                const sectionTitle = displayNames[section.sectionName]
                missingSectionFields[sectionTitle] = missingFields;
            }
        }

        return missingSectionFields;
    }

    const isEmptyField = (value: any): boolean => {
        if (value === null || value === undefined) {
            return true;
        }

        if (typeof(value) === 'string') {
            return value.trim() === ''
        }

        // everything else (numbers, objects, arrays, booleans) -- treat as NOT empty
        // TODO handle objects and arrays (if these types are ever added to PatientData type)
        return false
    }

    const formatMissingFieldsMessage = (missingSectionFields: {[key: string]: string[]}) => {
        let message = 'Please fill in:\n\n'
        
        for (const [sectionTitle, fields] of Object.entries(missingSectionFields)) {
            message += `${sectionTitle.toUpperCase()}: ${fields.join(', ')}\n\n`
        }
        
        return message.trim()
    }

    const handleAccordionPress = (sectionId: string) => {
        setReviewedSections(prev => new Set([...prev, sectionId]));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
        
            const missingData = validateRequiredFields();
            console.log('missingData', missingData)
            
            function isSubset<T>(a: Set<T>, b: Set<T>): boolean {
                for (const item of a) {
                    if (!b.has(item)) return false;
                }
                return true;
            }
    
            // show error if any data is missing
            if (Object.keys(missingData).length > 0) {
                if (Platform.OS === 'web') {
                    alert(`Missing Information. ${formatMissingFieldsMessage(missingData)}`)
                    return;
                }

                Alert.alert('Missing Information', `${formatMissingFieldsMessage(missingData)}`);
                return;
            }

            // check that all sections have been reviewed
            if (!isSubset(allSections, reviewedSections)) {
                if (Platform.OS === 'web') {
                    alert('Unreviewed Sections\nPlease review all sections before submitting patient record')
                    return;
                }

                Alert.alert('Unreviewed Sections', `Please review all sections before submitting patient record`);
                return;
            }

            // Save patient data permanently and get the final patient ID
            const { patientId, riskAssessment, patientName } = await savePatientData();

            // TODO calculate risk score
            
            Alert.alert(
                'Success', 
                `Patient data has been saved successfully!\nPatient ID: ${patientId}`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.push({
                                        pathname: '/riskDisplay',
                                        params: {
                                            patientId: patientId,
                                            patientName: patientName,
                                            // Serialize the risk assessment
                                            riskAssessment: JSON.stringify(riskAssessment)
                                        }
                                    })
                    }
                ]
            );
        } catch (error) {
            console.error('Error submitting patient data:', error);
            Alert.alert('Error', 'Failed to save patient data. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return 'Not provided';
        return date.toISOString().split('T')[0];
    };

    const formatAge = () => {
        if (patientData.dob) {
            return formatDate(patientData.dob);
        } else if (patientData.birthYear && patientData.birthMonth) {
            return `${patientData.birthMonth} ${patientData.birthYear}`;
        } else if (patientData.approxAgeInYears) {
            return `${patientData.approxAgeInYears} years old`;
        }
        return 'Not provided';
    };

    const InfoCard = () => (
        <Card style={[Styles.cardWrapper, { marginBottom: 16, padding: 8 }]}>
            <Card.Content>
            <Text variant='bodyLarge' style={{ fontWeight: 'bold', marginBottom: 8 }}>
                Expand each section to review information:
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <MaterialIcons name="error-outline" size={18} color="orange" style={{ marginRight: 6 }} />
                <Text>Alert marks incomplete or unreviewed sections</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="check-circle-outline" size={18} color="green" style={{ marginRight: 6 }} />
                <Text>Check marks completed & reviewed sections</Text>
            </View>

            <Text style={{ marginBottom: 4 }}>
                If any data is incorrect or missing, navigate to that section and fix it.
            </Text>
            <Text>
                If all information is correct, click <Text style={{ fontWeight: 'bold' }}>"Submit"</Text>
            </Text>
            </Card.Content>
        </Card>
    );

    const InfoRow = ({ label, value }: { label: string; value: string | string[] }) => (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', flex: 1 }}>{label}:</Text>
            <Text style={{ flex: 2 }}>{value || 'Not provided'}</Text>
        </View>
    );

    const CustomAccordionIcon = ({ sectionId }: { sectionId: string }) => (
        <MaterialIcons 
            name={getAccordionIcon(sectionId) as any}
            size={24} 
            color={getAccordionIconColor(sectionId)}
            style={{ marginLeft: 16, marginTop: 5 }}
        />
    );

    const getAccordionIcon = (sectionId: string) => {
        const isReviewed = reviewedSections.has(sectionId);
        const isComplete = completedSections.has(sectionId);
        return isReviewed && isComplete ? 'check-circle-outline' : 'error-outline';
    };

    const getAccordionIconColor = (sectionId: string) => {
        const isReviewed = reviewedSections.has(sectionId);
        const isComplete = completedSections.has(sectionId);
        return isReviewed && isComplete ? 'green' : 'orange';
    };

    const otherChronicIllnessSelected = patientData.chronicIllness.includes('other')

    const formatChronicIllness = (items: string[] = []): string => {
        if (!items || items.length === 0) return 'Not provided';

        // Capitalize the first letter of each illness and normalize spacing
        const formatted = items.map(item => {
            const trimmed = item.trim();
            if (!trimmed) return null;

            // Capitalize only the first letter (including after "other:")
            const formattedText =
            trimmed.length > 0
                ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
                : trimmed;

            return `• ${formattedText}`;
        }).filter(Boolean);

        return formatted.join('\n');
    };
  
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <InfoCard/>

                <View style={Styles.accordionListWrapper}>
                    <List.Accordion
                      title="Patient Information"
                      titleStyle={Styles.accordionListTitle}
                      left={props => <CustomAccordionIcon sectionId="patientInformation" />}
                      onPress={() => handleAccordionPress('patientInformation')}
                    >
                        <View style={Styles.accordionContentWrapper}>
                            <InfoRow label="Full Name" value={`${patientData.firstName} ${patientData.otherName} ${patientData.surname}`.trim()} />
                            <InfoRow label="Sex" value={patientData.sex} />
                            <InfoRow label="DOB/Age" value={formatAge()} />
                            <InfoRow label="Under 6 months" value={patientData.isUnderSixMonths ? 'Yes' : 'No'} />
                        </View>
                    </List.Accordion>
                </View>

                <View style={Styles.accordionListWrapper}>
                    <List.Accordion
                      title="Admission Clinical Data"
                      titleStyle={Styles.accordionListTitle}
                      left={props => <CustomAccordionIcon sectionId="admissionClinicalData" />}
                      onPress={() => handleAccordionPress('admissionClinicalData')}
                    >
                        {
                            patientData.isUnderSixMonths
                            ?
                             <View style={Styles.accordionContentWrapper}>
                                <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Health History & Observations</Text>
                                <InfoRow label={displayNames['illnessDuration']} value={patientData.illnessDuration || 'Not provided'} />
                                {patientData.isNeonate && <InfoRow label="Neonatal Jaundice" value={patientData.neonatalJaundice ? 'Yes' : 'No'} />}
                                <InfoRow label="Bugling fontanelle" value={patientData.bulgingFontanelle ? 'Yes' : 'No'} />
                                <InfoRow label="Feeding well?" value={patientData.feedingWell ? 'Yes': 'No'} />
                                
                                <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Body Measurements & Vitals</Text>
                                <InfoRow label="Weight" value={patientData.weight ? `${patientData.weight} kg`: 'Not provided'} />
                                <InfoRow label="MUAC" value={patientData.muac ? `${patientData.muac} mm` : 'Not provided'} />
                                <InfoRow label="SpO₂" value={patientData.spo2 ? `${patientData.spo2} %` : 'Not provided'} />
                            </View>
                            :
                            <View style={Styles.accordionContentWrapper}>
                                <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Health History</Text>
                                <InfoRow label="Last Hopitalized" value={patientData.lastHospitalized || 'Not provided'} />
                                <InfoRow label="HIV Status" value={patientData.hivStatus} />
                                
                                <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Body Measurements & Vitals</Text>
                                <InfoRow label="Weight" value={patientData.weight ? `${patientData.weight} kg`: 'Not provided'} />
                                <InfoRow label="MUAC" value={patientData.muac ? `${patientData.muac} mm` : 'Not provided'} />
                                <InfoRow label="Temperature" value={patientData.temperature ? `${patientData.temperature} °C` : 'Not provided'} />
                                <InfoRow label="Respiratory Rate" value={patientData.rrate ? `${patientData.rrate} breaths per min` : 'Not provided'} />
                                <InfoRow label="SpO2" value={patientData.spo2 ? `${patientData.spo2} %` : 'Not provided'} />
                                
                                <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Blantyre Coma Scale</Text>
                                <InfoRow label="Eye movement" value={patientData.eyeMovement?.value || 'Not provided'} />
                                <InfoRow label="Best motor response" value={patientData.motorResponse?.value || 'Not provided'} />
                                <InfoRow label="Best verbal response" value={patientData.verbalResponse?.value || 'Not provided'} />
                            </View>
                        }
                    </List.Accordion>
                </View>

                <View style={Styles.accordionListWrapper}>
                    <List.Accordion
                      title="Common Medical Conditions"
                      titleStyle={Styles.accordionListTitle}
                      left={props => <CustomAccordionIcon sectionId="medicalConditions" />}
                      onPress={() => handleAccordionPress('medicalConditions')}
                    >
                        <View style={Styles.accordionContentWrapper}>
                            <InfoRow label="Pneumonia" value={patientData.pneumonia || 'Not provided'} />
                            <InfoRow label="Severe anaemia" value={patientData.anaemia || 'Not provided'} />
                            <InfoRow label="Diarrhea" value={patientData.diarrhea || 'Not provided'} />
                            <InfoRow label="Malaria" value={patientData.malaria ||'Not provided' } />
                            <InfoRow label="Sepsis" value={patientData.sepsis|| 'Not provided'} />
                            <InfoRow label="Meningitis/ Encephalitis" value={patientData.meningitis || 'Not provided'} />
                            <InfoRow label="Chronic Illnesses" value={formatChronicIllness(patientData.chronicIllness) || 'Not provided'} />
                            {otherChronicIllnessSelected && 
                                <InfoRow label="Other chronic illness" value={patientData.otherChronicIllness || 'Not provided'} />
                            }
                        </View>
                    </List.Accordion>
                </View>

                <View style={Styles.accordionListWrapper}>
                    <List.Accordion
                      title="VHT Referral"
                      titleStyle={Styles.accordionListTitle}
                      left={props => <CustomAccordionIcon sectionId="vhtReferral" />}
                      onPress={() => handleAccordionPress('vhtReferral')}
                    >
                        <View style={Styles.accordionContentWrapper}>
                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Patient Address</Text>
                            <InfoRow label="Village" value={patientData.village || 'Not provided'} />
                            <InfoRow label="Subvillage" value={patientData.subvillage || 'Not provided'} />
                            
                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>VHT Contact Information</Text>
                            <InfoRow label="Name" value={patientData.vhtName || 'Not provided'} />
                            <InfoRow label="Telephone" value={patientData.vhtTelephone || 'Not provided'} />
                        </View>
                    </List.Accordion>
                </View>

                 <View style={Styles.accordionListWrapper}>
                    <List.Accordion
                      title="Caregiver Contact Information"
                      titleStyle={Styles.accordionListTitle}
                      left={props => <CustomAccordionIcon sectionId="caregiverContact" />}
                      onPress={() => handleAccordionPress('caregiverContact')}
                    >
                        <View style={Styles.accordionContentWrapper}>
                            <InfoRow label="Head of Household" value={patientData.caregiverName || 'Not provided'} />
                            <InfoRow label="Telephone" value={patientData.caregiverTel || 'Not provided'} />
                            {(patientData.caregiverTel !== '') &&
                            <>
                                <InfoRow label="Telephone belongs to caregiver" value={patientData.isCaregiversPhone ? 'Yes' : 'No'} />
                                <InfoRow label="Receive reminders" value={patientData.sendReminders ? 'Yes' : 'No'} />
                            </>
                            }
                        </View>
                    </List.Accordion>
                </View>

                <Button
                    style={{ alignSelf: 'center' }}
                    mode="elevated"
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving Patient Record...' : 'Submit'}
                </Button>
            </ScrollView>
        </SafeAreaView>
    )
}