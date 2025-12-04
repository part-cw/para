import PaginationControls from "@/src/components/PaginationControls";
import RadioButtonGroup from "@/src/components/RadioButtonGroup";
import SearchableDropdown from "@/src/components/SearchableDropdown";
import { MedicalConditionsSection } from "@/src/components/sections/EditableMedicalConditions";
import ValidatedTextInput, { INPUT_TYPES } from "@/src/components/ValidatedTextInput";
import ValidationSummary from "@/src/components/ValidationSummary";
import { usePatientData } from "@/src/contexts/PatientDataContext";
import { useStorage } from "@/src/contexts/StorageContext";
import { useValidation } from "@/src/contexts/ValidationContext";
import { displayNames } from "@/src/forms/displayNames";
import { spo2DischargeInfo } from "@/src/forms/infoText";
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { validateOxygenSaturationRange } from "@/src/utils/clinicalVariableCalculator";
import { formatName } from "@/src/utils/formatUtils";
import { isValidNumericFormat } from "@/src/utils/inputValidator";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, RefreshControl, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Card, IconButton, List, Text, TextInput, useTheme } from "react-native-paper";
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
        completeDischarge,
        updatePatientData
    } = usePatientData();

    const {
        dischargeStatus,
        feedingStatus_discharge,
        spo2_discharge
    } = patientData
    

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showErrorSummary, setShowErrorSummary] = useState<boolean>(false)
    const [showDeceasedModal, setShowDeceasedModal] = useState<boolean>(false);    

    const validationErrors = getScreenErrors('dischargeData');
    const hasValidationErrors = validationErrors.length > 0;
    
    const params = useLocalSearchParams();
    const patientId = params.patientId as string;

    // TODO - delete logs once testing complete
    // console.log('discharge status', dischargeStatus)
    // console.log('showmodal', showDeceasedModal)
    // console.log('validation errors', validationErrors)

    // load patient data on mount  
    useEffect(() => {
        loadPatientData();

        // Clear errors when component unmounts or navigates away
        return () => {
            // Only clear if no errors exist
            if (validateAllFields().length === 0) {
                setValidationErrors('dischargeData', []);
            }
        };
    }, []);

    // set validation errors whenever fields change
    useEffect(() => {
        const errorMessages = validateAllFields();
        setValidationErrors('dischargeData', errorMessages)
    }, [dischargeStatus, spo2_discharge, feedingStatus_discharge]);

    useEffect(() => {
        if (dischargeStatus?.toLowerCase() === 'deceased') {
            setShowDeceasedModal(true);
        } else {
            setShowDeceasedModal(false)
        }
    }, [dischargeStatus])


    const loadPatientData = async () => {
        try {
            setLoading(true)
            await loadPatient(patientId)
        } catch (error) {
            Alert.alert('Error', 'Failed to load patient data');
        } finally {
            setLoading(false);
        }
    }

    const validateAllFields = () => {
        const errors: string[] = []

        if (!dischargeStatus) {
            errors.push('Discharge status is required');
        } 

        if (dischargeStatus && dischargeStatus.toLowerCase() !== 'deceased' && !feedingStatus_discharge) {
            errors.push('Feeding status is required');
        }

        if (dischargeStatus && dischargeStatus.toLowerCase() !== 'deceased' && !spo2_discharge) {
            errors.push('Discharge spo₂ is required');
        }

        if (spo2_discharge) {
            if (!isValidNumericFormat(spo2_discharge)) {
                errors.push('Discharge spO₂ is required and must be a valid number');
            } else {
                const spo2Validation= validateOxygenSaturationRange(spo2_discharge);
                if (!spo2Validation.isValid) {
                    spo2Validation.errorMessage && errors.push(spo2Validation.errorMessage);
                }
            }
        }

       return errors;
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPatientData();
        setRefreshing(false);
    }

    const handleCancelDeath = () => {
        updatePatientData({ dischargeStatus: ''})
        setShowDeceasedModal(false);
    }

    const handleConfirmDeath = async () => {
        setShowDeceasedModal(false)
        setLoading(true);

        completeDischarge();
        // TODO reopen modal on storage error?

        setLoading(false)
        router.replace('../patientRecords')
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
                 {/* Deceased modal */}
                <Modal
                    visible={showDeceasedModal}
                    transparent={true}
                    animationType="fade"
                >
                    <View style={Styles.modalOverlay}>
                        <View style={Styles.modalContentWrapper}>
                            <Text style={[Styles.modalHeader, {color: colors.primary}]}>
                                Patient Deceased
                            </Text>
                            
                            <Text style={Styles.modalText}>
                                You have marked this patient as deceased.
                                Please confirm this discharge status or cancel to update status.
                            </Text>
                            <Text style={Styles.modalText}>
                                Once confirmed, the 'deceased' status cannot be undone.
                            </Text>

                            <Text style={[Styles.modalSubheader, {color: colors.primary}]}>
                                Confirm discharge status?
                            </Text>

                            <View style={{
                                flexDirection: 'row',
                                gap: 10,
                                marginTop: 20
                            }}>
                                <Button
                                    mode="contained"
                                    onPress={handleConfirmDeath}
                                    buttonColor={colors.primary}
                                    textColor={colors.onPrimary}
                                    style={{ flex: 1 }}
                                >
                                    Confirm
                                </Button>

                                <Button
                                    mode="contained"
                                    onPress={handleCancelDeath}
                                    buttonColor={colors.secondary}
                                    textColor={colors.onSecondary}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>

                <ScrollView 
                    contentContainerStyle={{ paddingVertical: 0}}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/> }
                >
                    <View style={{margin: 15}}>
                        {/* Info Card */}
                        <Card style={Styles.cardWrapper}>
                            <Card.Content>
                                <Text variant="bodyLarge">
                                    Enter the following discharge data for patient {formatName(patientData.firstName, patientData.surname, patientData.otherName)}.
                                    This information will be used to update the risk prediction. 
                                </Text>
                            </Card.Content> 
                        </Card>

                        {/* Discharge Data Info*/}
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

                        {/* Confirm Medical Info Accordion */}
                        {/* TODO - verify accordion was opened and content reviewd - change color and maybe symbol */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Review Medical Diagnoses"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="medical-bag"/>}
                                description={patientData.isDischarged ? 'Read-only' : ''}
                                
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <MedicalConditionsSection 
                                        patientId={patientId} 
                                        patientData={patientData} 
                                        storage={storage} 
                                        onRefresh={onRefresh} 
                                        colors={colors}
                                    />
                                </View>
                            </List.Accordion>
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
                                router.push('/(discharge-sidenav)/chwReferral_discharge')}
                            }
                        }
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }
}