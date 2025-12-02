import PaginationControls from '@/src/components/PaginationControls';
import { CaregiverContactSection } from '@/src/components/sections/CaregiverContactSection';
import ValidationSummary from '@/src/components/ValidationSummary';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Note: did not use ValidationContext to get screen errors becuase don't want to affect side nav

export default function CaregiverContactScreen() {
    const { colors } = useTheme();
    const { patientData, updatePatientData, isDataLoaded } = usePatientData();
    
    const [ pageErrors, setPageErrors] = useState<string[]>([])
    const [ showErrorSummary, setShowErrorSummary ] = useState<boolean>(false)

    const {
        caregiverName,
        caregiverTel,
        confirmTel,
        sendReminders,
        isCaregiversPhone
    } = patientData


    // Don't render until data is loaded
    if (!isDataLoaded) {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                <Text>Loading...</Text>
            </SafeAreaView>
        );
    }    

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
                <CaregiverContactSection
                    caregiverName={caregiverName}
                    caregiverTel={caregiverTel}
                    confirmTel={confirmTel}
                    sendReminders={sendReminders}
                    isCaregiversPhone={isCaregiversPhone}
                    onUpdate={updatePatientData}
                    colors={colors}
                    mode="admission"
                    showHeader={true}
                    showClearButton={false}
                    onValidationChange={(isValid, errors) => {
                        setPageErrors(errors);
                    }}
                />
            </ScrollView>
        
          {/* Display error summary*/}
            { showErrorSummary &&
                <ValidationSummary 
                    errors={pageErrors}
                    variant='error'
                    title= 'ALERT: Fix Errors Below'
                />
            }

            <PaginationControls
                showPrevious={true}
                showNext={true}
                onPrevious={() => router.push('/(admission-sidenav)/vhtReferral')}
                onNext={() => {
                    if (pageErrors.length > 0) {
                        setShowErrorSummary(true)
                    } else {
                        setShowErrorSummary(false)
                        router.push('/(admission-sidenav)/review')
                    }
                }}
            />            
        </SafeAreaView>
    );
}