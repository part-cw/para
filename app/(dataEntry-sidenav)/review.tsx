import { usePatientData } from '@/src/contexts/PatientDataContext';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, useTheme } from 'react-native-paper';
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
  
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Button
                    style={{ alignSelf: 'center' }}
                    mode="elevated"
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    onPress={handleSubmit}
                >
                    Submit
                </Button>
            </ScrollView>
        </SafeAreaView>
    )
}