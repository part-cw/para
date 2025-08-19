import { PatientIdGenerator } from '@/src/utils/patientIdGenerator';
import { router } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReviewScreen() {
    const { colors } = useTheme()

    const handleSubmit = async () => {
        const finalPID = await PatientIdGenerator.generatePatientId()
        console.log('final patientId', finalPID)
        router.push('/') // TODO - reroute to prediction screen, not home

    }
  
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