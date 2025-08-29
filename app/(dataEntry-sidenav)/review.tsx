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



export default function ReviewScreen() {
    const { colors } = useTheme()
    const { patientData, savePatientData, clearPatientData } = usePatientData();
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
        const missingSectionFields: { [key: string]: string[] } = {};

        for (const section of patientFormSchema) {
            const missingFields: string[] = [];

            // check required fields
            for (const fieldName of section.required) {
                const fieldValue = patientData[fieldName as keyof typeof patientData];

                // Check if field is empty or null
                if (!fieldValue || 
                    (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
                    (fieldValue === null)) {
                    missingFields.push(displayNames[fieldName] || fieldName); // if no display name, push fieldName
                }
            }

            // check optional fields
            if (section.oneOf) {
                let hasValidOption = false;
 
                for (const option of section.oneOf) {
                    // check if all fields in this option are filled
                    const allFieldsFilled = option.every(fieldName => {
                        const fieldValue = patientData[fieldName as keyof typeof patientData]
                        // true if field value not empty string or null
                        return fieldValue &&
                               !(typeof fieldValue === 'string' && fieldValue.trim() === '') &&
                               fieldValue !== null
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

            if (missingFields.length > 0) {
                const sectionTitle = displayNames[section.sectionName]
                missingSectionFields[sectionTitle] = missingFields;
            }
        }

        return missingSectionFields;
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
            const finalPatientId = await savePatientData();
            
            Alert.alert(
                'Success', 
                `Patient data has been saved successfully!\nPatient ID: ${finalPatientId}`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.push('/') // todo - change to risk display screen
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

    const formatDateTime = (isoString: string | null): string => {
        if (!isoString) return 'Not recorded';
        const date = new Date(isoString);
        return date.toLocaleString();
    };

    const formatAge = () => {
        if (patientData.dob) {
            return formatDate(patientData.dob);
        } else if (patientData.birthYear && patientData.birthMonth) {
            return `${patientData.birthMonth.value} ${patientData.birthYear}`;
        } else if (patientData.approxAge) {
            return `${patientData.approxAge} years old`;
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

    const InfoRow = ({ label, value }: { label: string; value: string }) => (
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
                        <View style={Styles.accordionContentWrapper}>
                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Health History</Text>
                            <InfoRow label="Last Hopitalized" value={patientData.lastHospitalized?.value || 'Not provided'} />
                            <InfoRow label="HIV Status" value={patientData.hivStatus} />
                            
                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Body Measurements & Vitals</Text>
                            <InfoRow label="Weight" value={patientData.weight ? `${patientData.weight} kg`: 'Not provided'} />
                            <InfoRow label="MUAC" value={patientData.muac ? `${patientData.muac} mm` : 'Not provided'} />
                            <InfoRow label="Temperature" value={patientData.temperature ? `${patientData.temperature} °C` : 'Not provided'} />
                            <InfoRow label="Respiratory Rate" value={patientData.rrate ? `${patientData.rrate} breaths per min` : 'Not provided'} />
                            <InfoRow label="SpO2" value={patientData.spo2 ? `${patientData.spo2} %` : 'Not provided'} />
                            <InfoRow label="Heart Rate" value={patientData.heartRate ? `${patientData.heartRate} beats per min` : 'Not provided'} />
                            
                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Blantyre Coma Scale</Text>
                            <InfoRow label="Eye movement" value={patientData.eyeMovement?.value || 'Not provided'} />
                            <InfoRow label="Best motor response" value={patientData.motorResponse?.value || 'Not provided'} />
                            <InfoRow label="Best verbal response" value={patientData.verbalResponse?.value || 'Not provided'} />
                        </View>
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
                            <InfoRow label="Pneumonia" value={patientData.pneumonia?.value || 'Not provided'} />
                            <InfoRow label="Severe anaemia" value={patientData.anaemia?.value || 'Not provided'} />
                            <InfoRow label="Chronic Illnesses" value={patientData.chronicIllness?.value || 'Not provided'} />
                            <InfoRow label="Acute diarrhea" value={patientData.acuteDiarrhea?.value || 'Not provided'} />
                            <InfoRow label="Malaria" value={patientData.malaria?.value ||'Not provided' } />
                            <InfoRow label="Sepsis" value={patientData.sepsis?.value || 'Not provided'} />
                            <InfoRow label="Meningitis/ Encephalitis" value={patientData.meningitis?.value || 'Not provided'} />
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
                            <InfoRow label="Village" value={patientData.village?.value || 'Not provided'} />
                            <InfoRow label="Subvillage" value={patientData.subvillage || 'Not provided'} />
                            
                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>VHT Contact Information</Text>
                            <InfoRow label="Name" value={patientData.vhtName?.value || 'Not provided'} />
                            <InfoRow label="Telephone" value={patientData.vhtTelephone?.value || 'Not provided'} />
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