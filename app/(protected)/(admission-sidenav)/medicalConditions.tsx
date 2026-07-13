import CheckboxGroup from '@/src/components/CheckboxGroup';
import PaginationControls from '@/src/components/PaginationControls';
import SearchableDropdown from '@/src/components/SearchableDropdown';
import ValidationSummary from '@/src/components/ValidationSummary';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { useValidation } from '@/src/contexts/ValidationContext';
import { displayNames } from '@/src/forms/displayNames';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { formatText } from '@/src/utils/inputValidator';
import { toDisplayConditionValue, toStoredConditionValue } from '@/src/utils/medicalConditionDisplay';
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
        severeAnaemia: anaemia,
        pneumonia,
        chronicIllnesses: chronicIllness,
        diarrhea,
        malaria,
        sepsis,
        meningitis_encephalitis: meningitis,
        malnutritionStatus,
        sickYoungInfant,
     otherChronicIllness,
        isUnderSixMonths
    } = patientData
    // Standard options for most conditions, exceptions use the others below
    const conditionOptions = [
        { value: 'Yes', key: 'yes'},
        { value: 'No', key: 'no'},
        { value: 'Suspected', key: 'suspected'},
    ]

    const malariaOptions = [
        { value: 'Yes - positive diagnosis', key: 'yes'},
        { value: 'No - negative diagnosis', key: 'no'},
        { value: 'Suspected', key: 'suspected'},
        { value: 'Unsure', key: 'unsure'},
    ]

    const meningitisOptions = [
        { value: 'Yes - positive diagnosis', key: 'yes'},
        { value: 'No - negative diagnosis', key: 'no'},
        { value: 'Suspected', key: 'suspected'},
    ]

    const diarrheaOptions = [
        { value: 'Acute diarrhea', key: 'acute'},
        { value: 'Persistent diarrhea', key: 'persistent'},
        { value: 'Not acute or peristent', key: 'none'},
    ]

    const validateAllFields = () => {
        const errors: string[] = []

        if (!anaemia) errors.push('Severe anaemia is missing a selection');
        if (!pneumonia) errors.push('Pneumonia is missing a selection');
        if (!diarrhea) errors.push('Diarrhea is missing a selection');
        if (!malaria) errors.push('Malaria is missing a selection');
        if (!sepsis) errors.push('Sepsis is missing a selection');
        if (!meningitis) errors.push('Meningitis/encaphalitis is missing a selection');
        if (chronicIllness?.length === 0) errors.push('Chronic illnesses is missing a selection. Select all that apply.');

        return errors;
    }

    // Find errors when relevant data changes
    useEffect(() => {
        const errorMessages = validateAllFields();
        setValidationErrors('medicalConditions', errorMessages)
    }, [anaemia, pneumonia, chronicIllness, diarrhea, malaria, sepsis, meningitis])

    // autoselect 'hiv' if hivStatus is positive when page first renders 
    // TODO - make sure this is accurately reflectd in storage
    useEffect(() => {
        if (patientData.hivStatus === 'positive') {
            updatePatientData({chronicIllnesses: ['HIV']})
        }
    }, [])

    const handleChronicIllnessChange = (selected: string[]) => {
        const isOtherSelected = selected.some(item => item.startsWith('other'))
        const clickedNone = selected.includes('none') && !chronicIllness?.includes('none');
        const clickedUnsure = selected.includes('unsure') && !chronicIllness?.includes('unsure');
      
        if (clickedNone) {
            updatePatientData({
                chronicIllnesses: ['none'],
                otherChronicIllness: ''
            });
            return;
        }

        if (clickedUnsure) {
            updatePatientData({
               chronicIllnesses: ['unsure'],
               otherChronicIllness: '' 
            })
            return;
        }

        if (!isOtherSelected) {
            updatePatientData({otherChronicIllness: ''})
        } 
 
        updatePatientData({chronicIllnesses: selected})
    };

    const isNoneSelected = chronicIllness?.includes('none') || false;
    const isUnsureSelected = chronicIllness?.includes('unsure') || false;
    const chronicIllnessOptions =
     [
        {label: 'HIV', value: 'HIV'},
        {label: 'Tuberculosis', value: 'Tuberculosis'},
        {label: 'Sickle cell anaemia', value: 'sickle cell anaemia'},
        {label: 'Unsure', value: 'unsure'},
        {label: 'None', value: 'none'},
        {label: 'Other', value: 'other'}
    ].filter(opt => opt.value !== 'HIV' || isUnderSixMonths)


    const getChronicIllnessOptions = () => {
        if (isNoneSelected) {
            return chronicIllnessOptions.map(opt => ({
                ...opt,
                disabled: opt.value === 'none' ? false : true
            }));
        }

        if (isUnsureSelected) {
            return chronicIllnessOptions.map(opt => ({
                ...opt,
                disabled: opt.value === 'unsure' ? false : true
            }));
        }

        return chronicIllnessOptions;
    };

    
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
                            or does not have any of the following targeted medical conditions. 
                            If a <Text style={{ fontWeight: 'bold' }}>condition is unclear and no testing</Text> has been done, select
                            ‘unsure’ where applicable</Text>
                    </Card.Content>
                </Card>
                
                <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                    <TextInput 
                        label={isUnderSixMonths ? "Growth Status" : "Nutritional Status"}
                        mode="flat" 
                        value={
                            malnutritionStatus === 'moderate' ? 'Moderate Acute Malnourished' :
                            malnutritionStatus === 'severe' ? 'Severe Acute Malnourished' :
                            malnutritionStatus ? formatText(malnutritionStatus) : ''
                        }
                        style={{flex: 1}}
                        disabled />
                    <IconButton
                        icon="help-circle-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => {
                        alert(isUnderSixMonths ? 'Growth status is based on WAZ (weight-for-age z-score), or set to Severe if edematous malnutrition (Kwashiorkor) is present.' : 'Nutritional status is based on MUAC and WAZ, or set to Severe if edematous malnutrition (Kwashiorkor) is present. The more severe result is applied.');
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
                    data={conditionOptions}
                    label={'Pneumonia'}
                    placeholder='select option below' 
                    onSelect={(item) => updatePatientData({ pneumonia: item.value })}
                    value={pneumonia}
                    search={false}
                />
                <SearchableDropdown 
                    data={conditionOptions}
                    label={'Severe anaemia'}
                    placeholder='select option below' 
                    onSelect={(item) => updatePatientData({ severeAnaemia: item.value })}
                    value={anaemia}
                    search={false}
                />

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
                    data = {malariaOptions}
                    value = {toDisplayConditionValue(malaria)}
                    placeholder='select option below'
                    onSelect={(item) => updatePatientData({ malaria: toStoredConditionValue(item.value) })}
                    search={false}
                />
                <SearchableDropdown 
                    label = {'Sepsis'}
                    data = {conditionOptions}
                    value = {sepsis}
                    placeholder='select option below' 
                    onSelect = {(item) => updatePatientData({ sepsis: item.value })}
                    search={false}
                />
                <SearchableDropdown 
                    label = {'Meningitis/Encephalitis'}
                    data = {meningitisOptions}
                    value = {toDisplayConditionValue(meningitis)}
                    placeholder='select option below'
                    onSelect = {(item) => updatePatientData({ meningitis_encephalitis: toStoredConditionValue(item.value) })}
                    search={false}
                />
                <View style={{marginRight: 10, marginLeft: 10, marginTop: -10}}>
                   <Text style={[Styles.accordionSubheading, {fontWeight: 'bold'}]}>Chronic Conditions <Text style={Styles.required}>*</Text></Text>
                    <Text>{displayNames['chronicIllnessQuestion']}</Text>
                    <CheckboxGroup 
                        options={getChronicIllnessOptions()} 
                        selected={chronicIllness as string[]} 
                        onSelectionChange={handleChronicIllnessChange}
                    />
                    {chronicIllness?.some(item => item.toLowerCase().startsWith('other')) &&
                        <TextInput 
                            label="Specify other illnesses (optional)" 
                            mode="outlined" 
                            style={{marginTop: -10, marginLeft: 32}}
                            value={otherChronicIllness}
                            onChangeText={(value) => updatePatientData({otherChronicIllness: value})}
                        />
                    }
                </View>

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
                onPrevious={() => router.push('/(protected)/(admission-sidenav)/admissionClinicalData')}
                onNext={() => {
                    if (hasValidationErrors) {
                        setShowErrorSummary(true)
                    } else {
                        setShowErrorSummary(false)
                        router.push('/(protected)/(admission-sidenav)/vhtReferral')
                    }
                }}
            /> 
        </SafeAreaView>
    );
}
