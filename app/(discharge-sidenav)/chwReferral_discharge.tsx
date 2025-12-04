import PaginationControls from "@/src/components/PaginationControls";
import RadioButtonGroup from "@/src/components/RadioButtonGroup";
import SearchableDropdown from "@/src/components/SearchableDropdown";
import ValidatedTextInput, { INPUT_TYPES } from "@/src/components/ValidatedTextInput";
import ValidationSummary from "@/src/components/ValidationSummary";
import { usePatientData } from "@/src/contexts/PatientDataContext";
import { useStorage } from "@/src/contexts/StorageContext";
import { useValidation } from "@/src/contexts/ValidationContext";
import { displayNames } from "@/src/forms/displayNames";
import { spo2DischargeInfo } from "@/src/forms/infoText";
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { validateOxygenSaturationRange } from "@/src/utils/clinicalVariableCalculator";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { IconButton, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

    // allow edit medical conditions - DONE
    // collect discharge variables - DONE
    // add VHT and caregiver info if not already complete  - NEXT SCREENS
    // calculate risk prediction & update risk assessment with discharge calc -- REVIEW PAGE
    // set isDischarged to true:   await storage.updatePatient(id, {isDischarged: true}) -- HERE AND REVIEW
    // go to risk display - have buttons to go back to records 

export default function DischargeDataScreen() {
    const { colors } = useTheme()
    const { storage } = useStorage();
    const { setValidationErrors, getScreenErrors } = useValidation();
    const { 
        patientData, 
        riskAssessment, 
        loadPatient, 
        updatePatientData
    } = usePatientData();

    const {
        dischargeStatus,
        feedingStatus_discharge,
        spo2_discharge
    } = patientData
    
    const [loading, setLoading] = useState(true);
    const [showErrorSummary, setShowErrorSummary] = useState<boolean>(false)

    const validationErrors = getScreenErrors('dischargeData');
    const hasValidationErrors = validationErrors.length > 0;

    // Clear errors when component unmounts or navigates away 
    useEffect(() => {
        return () => {
            // Only clear if no errors exist
            if (validateAllFields().length === 0) {
                setValidationErrors('chwReferral_discharge', []);
            }
        };
    }, []);

    // set validation errors whenever fields change
    useEffect(() => {
        const errorMessages = validateAllFields();
        setValidationErrors('chwReferral_discharge', errorMessages)
    }, []); // add fields here


    const validateAllFields = () => {
        const errors: string[] = []

       return errors;
    }
    
    // retrurns a loading screen with spinner
    if (loading) {
        return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16 }}>Loading...</Text>
        </SafeAreaView>
        );
    }

    if (patientData) {    
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
                <ScrollView 
                    contentContainerStyle={{ paddingVertical: 0}}
                >
                    <View style={{margin: 15}}>
                        {/* Info Card */}
                        {/* <Card style={Styles.cardWrapper}>
                            <Card.Content>
                                <Text variant="bodyLarge">
                                    Enter the following discharge data for patient {formatName(patientData.firstName, patientData.surname, patientData.otherName)}.
                                    This information will be used to update the risk prediction. 
                                </Text>
                            </Card.Content> 
                        </Card> */}

                        {/* TODO - ENTER CAREGIVER CONTACT INFO*/}
                        <View style={Styles.accordionListWrapper}>
                            <View style={Styles.accordionContentWrapper}>
                                <SearchableDropdown 
                                    data={[
                                        {value: 'Routine discharge', key: 'routine'},
                                        {value: 'Referred to higher level of care', key: 'referred'},
                                        {value: 'Unplanned discharge', key: 'unplanned'},
                                        {value: 'Deceased', key: 'deceased'},
                                    ]} 
                                    label={"Discharge Status (required)"} 
                                    placeholder='select option below'
                                    onSelect={(item) => updatePatientData({ dischargeStatus: item.value })}
                                    search={false}
                                    value= {patientData.dischargeStatus}
                                    style={{paddingTop: 20}}
                                />

                                <View>
                                    <Text style={[Styles.accordionSubheading, {fontWeight: 'bold'}]}>Feeding Status at Discharge <Text style={Styles.required}>*</Text></Text>
                                    <Text>{displayNames['feedingStatusQuestion']}</Text>
                                    <RadioButtonGroup 
                                        options={[
                                            { label: 'Feeding well', value: 'feeding well'},
                                            { label: 'Feeding poorly', value: 'feeding poorly'},
                                            { label: 'Not feeding at all', value: 'not feeding at all'}
                                        ]} 
                                        selected={patientData.feedingStatus_discharge || null} 
                                        onSelect={(value) => updatePatientData({ feedingStatus_discharge: value})}
                                    />
                                </View>

                                <View style={{flexDirection:'row', alignItems: 'center'}}>
                                    <Text style={[Styles.accordionSubheading, {fontWeight: 'bold'}]}>Oxygen Saturation at Discharge <Text style={Styles.required}>*</Text></Text>
                                    <IconButton
                                        icon="help-circle-outline"
                                        size={20}
                                        iconColor={colors.primary}
                                        onPress={() => {
                                            (Platform.OS !== 'web') ? Alert.alert('Info', spo2DischargeInfo) : alert(spo2DischargeInfo)
                                        }}
                                    />
                                </View>
                                
                                <ValidatedTextInput 
                                    label={'SpO₂ (required)'}
                                    value={patientData.spo2_discharge as string} 
                                    onChangeText={(value) => updatePatientData({ spo2_discharge: value })}
                                    inputType={INPUT_TYPES.NUMERIC}
                                    isRequired={true}
                                    customValidator={(value) => validateOxygenSaturationRange(value).isValid}
                                    customErrorMessage={patientData.spo2_discharge && validateOxygenSaturationRange(patientData.spo2_discharge ).errorMessage } 
                                    right={<TextInput.Affix text="%" />}                             
                                />
                            </View>
                        </View>
                    </View>

                    {/* Display error summary*/}
                    { showErrorSummary &&
                        <ValidationSummary 
                            errors={validationErrors}
                            variant='error'
                            title= 'ALERT: Fix Errors Below'
                        />
                    }
                

                    {/* Pagination controls */}
                    <PaginationControls
                        showPrevious={true}
                        showNext={true}
                        labelPrevious="Patient Records"
                        onPrevious={() => router.back()}
                        onNext={() => {
                            if (hasValidationErrors) {
                                setShowErrorSummary(true)
                            } else {
                                setShowErrorSummary(false)
                                router.push('/(discharge-sidenav)/caregiverContact_discharge')}
                            }
                        }
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }
}