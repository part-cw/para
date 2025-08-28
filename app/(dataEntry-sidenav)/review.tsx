import { usePatientData } from '@/src/contexts/PatientDataContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Card, Divider, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function ReviewScreen() {
    const { colors } = useTheme()
    const { patientData, savePatientData, clearPatientData } = usePatientData();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            
            // Validate required fields TODO -- add more required fields
            const requiredFields = ['surname', 'firstName', 'sex'];
            const missingFields = requiredFields.filter(field => !patientData[field as keyof typeof patientData]);
            
            if (missingFields.length > 0) {
                Alert.alert('Missing Information', `Please fill in: ${missingFields.join(', ')}`);
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

    const handleEdit = (screen: string) => {
        router.push(`/(dataEntry-sidenav)/${screen}` as any);
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

    const ReviewSection = ({ title, children, onEdit }: { 
        title: string; 
        children: React.ReactNode; 
        onEdit: () => void 
    }) => (
        <Card style={[Styles.cardWrapper, { marginBottom: 16 }, ]}>
            <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{title}</Text>
                    <Button mode="elevated" onPress={onEdit} compact buttonColor='white'>
                        Edit
                    </Button>
                </View>
                <Divider style={{ marginBottom: 12 }} />
                {children}
            </Card.Content>
        </Card>
    );

    const InfoCard = () => (
        <Card style={[Styles.cardWrapper, { marginBottom: 16, padding: 8 }]}>
            <Card.Content>
            <Text variant='bodyLarge' style={{ fontWeight: 'bold', marginBottom: 8 }}>
                Expand each section to review information:
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <MaterialIcons name="error-outline" size={18} color="orange" style={{ marginRight: 6 }} />
                <Text>Non-reviewed sections are marked with an alert symbol</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="check-circle-outline" size={18} color="green" style={{ marginRight: 6 }} />
                <Text>Reviewed sections are marked with a check mark</Text>
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

    const iconName = 'alert-circle-outline' 
    //|| 'check-circle-outline'
  
    // TODO - use accordions instead; if opened and viewed icon changed to 'check' and is green
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                
                {/*<ReviewSection 
                    title="Patient Information" 
                    onEdit={() => handleEdit('patientInformation')}>
                    <InfoRow label="Full Name" value={`${patientData.firstName} ${patientData.otherName} ${patientData.surname}`.trim()} />
                    <InfoRow label="Sex" value={patientData.sex} />
                    <InfoRow label="DOB/Age" value={formatAge()} />
                    <InfoRow label="Under 6 months" value={patientData.isUnderSixMonths ? 'Yes' : 'No'} />
                </ReviewSection>*/}
                <InfoCard/>

                <View style={Styles.accordionListWrapper}>
                    <List.Accordion
                      title="Patient Information"
                      titleStyle={Styles.accordionListTitle}
                      left={props => <List.Icon {...props} icon="alert-circle-outline" />}
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
                      left={props => <List.Icon {...props} icon="check-circle-outline" />}>
                        <View style={Styles.accordionContentWrapper}>
                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Health History</Text>
                            <InfoRow label="Last Hopitalized" value={`${patientData.lastHospitalized?.value}`} />
                            <InfoRow label="HIV Status" value={patientData.hivStatus} />
                            
                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Body Measurements & Vitals</Text>
                            <InfoRow label="Weight" value={patientData.weight ? `${patientData.weight} kg`: 'Not provided'} />
                            <InfoRow label="MUAC" value={`${patientData.muac} mm`} />
                            <InfoRow label="Temperature" value={`${patientData.temperature} °C`} />
                            <InfoRow label="Respiratory Rate" value={`${patientData.rrate} breaths per min`} />
                            <InfoRow label="SpO2" value={`${patientData.spo2} %`} />
                            <InfoRow label="Heart Rate" value={`${patientData.heartRate} beats per min`} />
                            
                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Blantyre Coma Scale</Text>
                            <InfoRow label="Eye movement" value={`${patientData.eyeMovement?.value}`} />
                            <InfoRow label="Best motor response" value={`${patientData.motorResponse?.value}`} />
                            <InfoRow label="Best verbal response" value={`${patientData.verbalResponse?.value}`} />
                        </View>
                    </List.Accordion>
                </View>

                <View style={Styles.accordionListWrapper}>
                    <List.Accordion
                      title="Common Medical Conditions"
                      titleStyle={Styles.accordionListTitle}
                      left={props => <List.Icon {...props} icon="check" />}>
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
                      left={props => <List.Icon {...props} icon="check" />}>
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
                      left={props => <List.Icon {...props} icon="check" />}>
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
                    {isSubmitting ? 'Saving Patient Data...' : 'Submit Patient Data'}
                </Button>
            </ScrollView>
        </SafeAreaView>
    )
}