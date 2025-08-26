import { usePatientData } from '@/src/contexts/PatientDataContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ReviewScreen() {
    const { colors } = useTheme()
    const { patientData, savePatientData, clearPatientData } = usePatientData();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // const handleSubmit = async () => {
    //     const finalPID = await PatientIdGenerator.generatePatientId()
    //     router.push('/') // TODO - reroute to prediction screen, not home

    // }

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
        <Card style={[Styles.cardWrapper, { marginBottom: 16 }]}>
            <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{title}</Text>
                    <Button mode="outlined" onPress={onEdit} compact>
                        Edit
                    </Button>
                </View>
                <Divider style={{ marginBottom: 12 }} />
                {children}
            </Card.Content>
        </Card>
    );

    const InfoRow = ({ label, value }: { label: string; value: string }) => (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', flex: 1 }}>{label}:</Text>
            <Text style={{ flex: 2 }}>{value || 'Not provided'}</Text>
        </View>
    );
  
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <ReviewSection 
                    title="Patient Information" 
                    onEdit={() => handleEdit('patientInformation')}
                >
                    <InfoRow label="Full Name" value={`${patientData.firstName} ${patientData.otherName} ${patientData.surname}`.trim()} />
                    <InfoRow label="Sex" value={patientData.sex} />
                    <InfoRow label="Age Information" value={formatAge()} />
                    <InfoRow label="Under 6 months" value={patientData.isUnderSixMonths ? 'Yes' : 'No'} />
                    <InfoRow label="Admission Started" value={formatDateTime(patientData.admissionStartedAt)} />
                </ReviewSection>

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