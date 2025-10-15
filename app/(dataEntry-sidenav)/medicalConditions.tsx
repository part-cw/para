import PaginationControls from '@/src/components/PaginationControls';
import SearchableDropdown from '@/src/components/SearchableDropdown';
import ValidationSummary from '@/src/components/ValidationSummary';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { useValidation } from '@/src/contexts/ValidationContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { formatText } from '@/src/utils/inputValidator';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function MedicalConditionsScreen() {
    const { colors } = useTheme();
    const { patientData, updatePatientData, isDataLoaded } = usePatientData();
    const { setValidationErrors , getScreenErrors } = useValidation();

    const [showErrorSummary, setShowErrorSummary] = useState<boolean>(false);
    
    const validationErrors = getScreenErrors('medicalConditions')
    const hasValidationErrors = validationErrors.length > 0;

    const {
        anaemia,
        pneumonia,
        chronicIllness,
        diarrhea,
        malaria,
        sepsis,
        meningitis,
        malnutritionStatus,
        sickYoungInfant
    } = patientData

    const diagnosisOptions = [
        { value: 'Yes - positive diagnosis', key: 'yes'},
        { value: 'No - negative diagnosis', key: 'no'},
        { value: 'Suspected', key: 'suspected'},
        { value: 'Unsure', key: 'unsure'},
    ]

    const diarrheaOptions = [
        { value: 'Acute diarrhea', key: 'acute'},
        { value: 'Persistent diarrhea', key: 'persistent'},
        { value: 'Not acute or peristent', key: 'none'}, // TODO -- what's a better label for this
    ]

    const validateAllFields = () => {
        const errors: string[] = []

        if (!anaemia) errors.push('Severe anaemia is missing a diagnosis');
        if (!pneumonia) errors.push('Pneumonia is missing a diagnosis');
        if (!chronicIllness) errors.push('Chronic illnesses is missing diagnoses. Select all that apply.');
        if (!diarrhea) errors.push('Diarrhea is missing a diagnosis');
        if (!malaria) errors.push('Malaria is missing a diagnosis');
        if (!sepsis) errors.push('Sepsis is missing a diagnosis');
        if (!meningitis) errors.push('Meningitis/encaphalitis is missing a diagnosis');

        return errors;
    }

    // Find errors when relevant data changes
    useEffect(() => {
        const errorMessages = validateAllFields();
        setValidationErrors('medicalConditions', errorMessages)
    }, [anaemia, pneumonia, chronicIllness, diarrhea, malaria, sepsis, meningitis])
    
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
            {/* <DebugStack/> */}
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
                <Card style={Styles.cardWrapper}>
                    <Card.Content>
                        <Text variant="bodyLarge">
                            Indicate whether the patient is confirmed to have, suspected to have, 
                            or does not have any of the following common medical conditions. 
                            If a <Text style={{ fontWeight: 'bold' }}>diagnosis is unclear and no testing</Text> has been done, select 
                            ‘unsure’ where applicable</Text>
                    </Card.Content>
                </Card>
                
                <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                    <TextInput 
                        label="Malnutrition Status" 
                        mode="flat" 
                        value={`${malnutritionStatus && formatText(malnutritionStatus)}`}
                        style={{flex: 1}}
                        disabled />
                    <IconButton
                        icon="help-circle-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => {
                        alert('Malnutrition status is assessed using both MUAC and WAZ (calculated on the previous page). The more severe of the two results is applied.');
                        }}
                    />
                </View>
                
               <View style = {{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                    <TextInput 
                        label="Sick young infant" 
                        mode="flat" 
                        value={sickYoungInfant ? 'Yes' : 'No'}
                        style={{flex: 1}}
                        disabled />
                    <IconButton
                        icon="help-circle-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => {
                        alert("Applies to infants less than 28 days old. \nAutomatically determined based on patient's age");
                        }}
                    />
                </View>
                
                <SearchableDropdown 
                    data={diagnosisOptions} 
                    label={'Pneumonia'}
                    placeholder='select option below' 
                    onSelect={(item) => updatePatientData({ pneumonia: item.value })}
                    value={pneumonia}
                    search={false}
                />
                <SearchableDropdown 
                    data={diagnosisOptions} 
                    label={'Severe anaemia'}
                    placeholder='select option below' 
                    onSelect={(item) => updatePatientData({ anaemia: item.value })}
                    value={anaemia}
                    search={false}
                />

                <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={{flex: 1}}>
                        <SearchableDropdown 
                            data={diagnosisOptions} 
                            label={'Chronic illnesses'}
                            placeholder='select option below' 
                            onSelect={(item) => updatePatientData({ chronicIllness: item.value })}
                            value={chronicIllness}
                            search={false}
                        />
                    </View>
                    <IconButton
                        icon="help-circle-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => {
                        alert('Chronic illnesses include genetic/congenital diseases, sickle cell anemia, HIV, and TB');
                        }}
                    />
                </View>
                <SearchableDropdown 
                    label = {'Diarrhea'}
                    data = {diarrheaOptions}
                    value = {diarrhea}
                    placeholder='select option below'
                    onSelect={(item) => updatePatientData({ diarrhea: item.value})}
                    search={false}
                />
                <SearchableDropdown 
                    label = {'Malaria'}
                    data = {diagnosisOptions}
                    value = {malaria}
                    placeholder='select option below' 
                    onSelect={(item) => updatePatientData({ malaria: item.value })}
                    search={false}
                />
                <SearchableDropdown 
                    label = {'Sepsis'}
                    data = {diagnosisOptions}
                    value = {sepsis}
                    placeholder='select option below' 
                    onSelect = {(item) => updatePatientData({ sepsis: item.value })}
                    search={false}
                />
                <SearchableDropdown 
                    label = {'Meningitis/Encephalitis'}
                    data = {diagnosisOptions}
                    value = {meningitis}
                    placeholder='select option below' 
                    onSelect = {(item) => updatePatientData({ meningitis: item.value })}
                    search={false}
                />

            </ScrollView>

            {/* Display error summary*/}
            { showErrorSummary &&
                <ValidationSummary 
                    errors={validationErrors}
                    variant='error'
                    title= 'ALERT: Fix Errors Below'
                />
            }

            <PaginationControls
                showPrevious={true}
                showNext={true}
                onPrevious={() => router.push('/(dataEntry-sidenav)/admissionClinicalData')}
                onNext={() => {
                    if (hasValidationErrors) {
                        setShowErrorSummary(true)
                    } else {
                        setShowErrorSummary(false)
                        router.push('/(dataEntry-sidenav)/vhtReferral')
                    }
                }}
            /> 
        </SafeAreaView>
    );
}
