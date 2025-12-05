import PaginationControls from "@/src/components/PaginationControls";
import RadioButtonGroup from "@/src/components/RadioButtonGroup";
import SearchableDropdown from "@/src/components/SearchableDropdown";
import { CaregiverContactSection } from "@/src/components/sections/CaregiverContactSection";
import { MedicalConditionsSection } from "@/src/components/sections/EditableMedicalConditions";
import { VHTReferralSection } from "@/src/components/sections/VhtReferralSection";
import ValidatedTextInput, { INPUT_TYPES } from "@/src/components/ValidatedTextInput";
import ValidationSummary from "@/src/components/ValidationSummary";
import { usePatientData } from "@/src/contexts/PatientDataContext";
import { useStorage } from "@/src/contexts/StorageContext";
import { useValidation } from "@/src/contexts/ValidationContext";
import { displayNames } from "@/src/forms/displayNames";
import { spo2DischargeInfo } from "@/src/forms/infoText";
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from "@/src/utils/ageCalculator";
import { calculateWAZ, validateOxygenSaturationRange } from "@/src/utils/clinicalVariableCalculator";
import { formatDateString, formatName } from "@/src/utils/formatUtils";
import { isValidNumericFormat } from "@/src/utils/inputValidator";
import { normalizeBoolean } from "@/src/utils/normalizer";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, RefreshControl, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Card, IconButton, List, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

    // allow edit medical conditions - DONE
    // collect discharge variables - DONE
    // add VHT and caregiver info if not already complete  - NEXT SCREENS
    // calculate risk prediction & update risk assessment with discharge calc -- REVIEW PAGE
    // set isDischarged to true:   await storage.updatePatient(id, {isDischarged: true}) -- HERE AND REVIEW
    // go to risk display - have buttons to go back to records 

    // TODO: if over six months and HIV still unknown ask if they want to update it to a known value
    // TODO: if DOB still unknown ask ifthey want ot update it to a known value
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
    const [expandDischargeAccordion, setExpandDischargeAccordion] = useState<boolean>(true); 
    
    // Add state for updating and editing unknown fields
    const [showUpdateUnknownFields, setShowUpdateUnknownFields] = useState<boolean>(false);
    const [isUpdatingUnknownFields, setIsUpdatingUnknownFields] = useState<boolean>(false);    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editedDOB, setEditedDob] = useState<Date | null>(null);
    const [editedHivStatus, setEditedHivStatus] = useState<string | undefined>('');
    const [initialDobUnknown, setInitialDobUnknown] = useState<boolean>(false);
    const [initialHivUnknown, setInitialHivUnknown] = useState<boolean>(false);

    const validationErrors = getScreenErrors('dischargeData');
    const hasValidationErrors = validationErrors.length > 0;
    
    const params = useLocalSearchParams();
    const patientId = params.patientId as string;

    // cehck what was unknwon at admission
    const wasDobUnknown = initialDobUnknown
    const wasHivUnknown = initialHivUnknown

    // Check if values are still unknown (not yet updated)
    const isDobStillUnknown = wasDobUnknown && (!patientData.dob);
    const isHivStillUnknown = wasHivUnknown && (patientData.hivStatus?.toLowerCase() === 'unknown');
    const hasUnknownAdmissionFields = wasDobUnknown || wasHivUnknown;


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

    // Capture initial state when patient data loads
    useEffect(() => {
        if (patientData && patientData.patientId) {
            // Only set initial state once when data first loads
            if (!initialDobUnknown && !initialHivUnknown) {
                const dobUnknown = normalizeBoolean(patientData.isDOBUnknown || patientData.isYearMonthUnknown);
                const hivUnknown = !patientData.isUnderSixMonths && (patientData.hivStatus?.toLowerCase() === 'unknown');
                
                setInitialDobUnknown(dobUnknown);
                setInitialHivUnknown(hivUnknown);
            }
        }
    }, [patientData.patientId]);

    // set validation errors whenever fields change
    useEffect(() => {
        const errorMessages = validateAllFields();
        setValidationErrors('dischargeData', errorMessages)

        if (hasValidationErrors) {
            setShowErrorSummary(true)
        } else {
            setShowErrorSummary(false)
        }
    }, [dischargeStatus, spo2_discharge, feedingStatus_discharge, hasValidationErrors]);

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

    const handleDobChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === "set" && selectedDate) {
            setEditedDob(selectedDate)
        }

        if (Platform.OS === "android") {
            setShowDatePicker(false);
        }
    };

    const handleSaveDob = async () => {
        if (!editedDOB) {
            Alert.alert('Required', 'Please select a date of birth');
            return;
        }
        // Calculate new age values
        const newAgeInMonths = AgeCalculator.calculateAgeInMonths(editedDOB, '', '', '');
        const newAgeInDays = editedDOB && AgeCalculator.getAgeInDaysFromDob(editedDOB);
        const newIsUnderSixMonths = newAgeInMonths < 6;
        const newIsNeonate = (typeof newAgeInDays === 'number') && (newAgeInDays < 30);
        const newIsSickYoungInfant = (typeof newAgeInDays === 'number') && (newAgeInDays < 28);
        const newWAZ = calculateWAZ(newAgeInMonths, patientData.sex, parseFloat(patientData.weight as string));

        // Store previous age info
        const previous = {
            dob: (patientData?.dob && patientData?.dob.toISOString()) || null,
            birthYear: patientData?.birthYear,
            birthMonth: patientData?.birthMonth,
            approxAgeInYears: patientData?.approxAgeInYears,
            ageInMonths: patientData?.ageInMonths,
            isDOBUnknown: patientData?.isDOBUnknown,
            isYearMonthUnknown: patientData?.isYearMonthUnknown,
            isUnderSixMonths: normalizeBoolean(patientData?.isUnderSixMonths as boolean),
            isNeonate: patientData?.isNeonate,
            sickYoungInfant: patientData?.sickYoungInfant,
            neonatalJaundice: patientData?.neonatalJaundice,
            waz: patientData.waz
        };

        // Check if age range changed
        if (previous.isUnderSixMonths !== newIsUnderSixMonths) {
            Alert.alert(
                '⚠️ UPDATE FAILED',
                'The date of birth you entered would change the patient\'s age category, which affects the AI models used for risk scoring.\n\nThis update cannot be completed. Please verify the DOB is correct.',
                [{ text: 'OK', style: 'cancel' }]
            );
            setEditedDob(null);
            return;
        }

        const confirmUpdate = () => new Promise<boolean>((resolve) => {
            Alert.alert(
                'Confirm Update',
                'Update date of birth? This change cannot be undone',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'OK', onPress: () => resolve(true) }
                ]
            );
        });

        if (Platform.OS !== 'web') {
            const confirmed = await confirmUpdate();
            if (!confirmed) return;
        }

        try {
            setIsUpdatingUnknownFields(true);

            // Build updates object
            let updates = {
                ...((!previous.dob || (previous.dob && editedDOB && formatDateString(previous.dob) !== formatDateString(editedDOB.toISOString()))) && { dob: editedDOB }),
                ...(previous.birthYear && previous.birthYear !== '' && { birthYear: '' }),
                ...(previous.birthMonth && previous.birthMonth !== '' && { birthMonth: '' }),
                ...(previous.approxAgeInYears && previous.approxAgeInYears !== '' && { approxAgeInYears: '' }),
                ...(previous.ageInMonths !== newAgeInMonths && { ageInMonths: newAgeInMonths }),
                ...(previous.waz !== newWAZ && { waz: newWAZ }),
                ...(normalizeBoolean(previous.isDOBUnknown) !== false && { isDOBUnknown: false }),
                ...(normalizeBoolean(previous.isYearMonthUnknown) !== false && { isYearMonthUnknown: false }),
                ...(previous.isNeonate !== newIsNeonate && { isNeonate: newIsNeonate }),
                ...(!newIsNeonate && previous.neonatalJaundice !== undefined && { neonatalJaundice: undefined }),
                ...(previous.sickYoungInfant !== newIsSickYoungInfant && { sickYoungInfant: newIsSickYoungInfant })
            };

            // Update storage
            await storage.doBulkUpdate(patientId, updates, previous);

            // Refresh the UI
            await onRefresh();
            setEditedDob(null);
            
            Alert.alert('Success', 'Date of birth updated successfully');
        } catch (error) {
            console.error('Error updating DOB:', error);
            Alert.alert('Error', 'Failed to update date of birth');
        } finally {
            setIsUpdatingUnknownFields(false);
        }
    };

    const handleSaveHivStatus = async () => {
        if (!editedHivStatus || editedHivStatus === 'unknown') {
            Alert.alert('Required', 'Please select a valid HIV status');
            return;
        }

        const confirmUpdate = () => new Promise<boolean>((resolve) => {
            Alert.alert(
                'Confirm Update',
                'Save HIV status? This will update the patient record.',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'OK', onPress: () => resolve(true) }
                ]
            );
        });

        if (Platform.OS !== 'web') {
            const confirmed = await confirmUpdate();
            if (!confirmed) return;
        }

        try {
            setIsUpdatingUnknownFields(true);

            const prev = patientData?.hivStatus;
            const updates = { hivStatus: editedHivStatus };

            // Update storage
            await storage.updatePatient(patientId, updates);
            await storage.logChanges(patientId, 'UPDATE', 'hivStatus', prev as string, editedHivStatus as string);

            // Refresh the UI
            await onRefresh();
            setEditedHivStatus('');
            
            Alert.alert('Success', 'HIV status updated successfully');
        } catch (error) {
            console.error('Error updating HIV status:', error);
            Alert.alert('Error', 'Failed to update HIV status');
        } finally {
            setIsUpdatingUnknownFields(false);
        }
    };

    const handleRouterBack = () => {
        if (Platform.OS !== 'web') {
            Alert.alert(
                'Go Back to Patient Records?', 
                `Are you sure you want to leave before completing discharge?`,
                [
                    {text: 'Cancel', style: 'cancel'}, 
                    {text: 'OK', onPress: () => router.back()}
                ]
            )
        } else {
            console.log('TODO - implement alert for web?')
        }
       
    }

    const handleDischarge = (patientName: string) => {
        const confirmDischarge = () => {
            console.log('TODO')
        }

        Alert.alert(
            'Confirm Discharge', 
            `Are you sure you want to discharge patient ${patientName}? This action cannot be undone.`,
            [
                {text: 'Cancel', style: 'cancel'}, 
                {text: 'Discharge', onPress: confirmDischarge}
            ]
        )
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
        const fullname = formatName(patientData.firstName, patientData.surname, patientData.otherName)

        return (
            <SafeAreaView style={{flex: 1, backgroundColor: colors.background, marginTop: -50}}>
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
                                Confirm 'deceased' discharge status?
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
                    {/* Header */}
                    <View style={[Styles.pageHeaderContainer, {alignItems: 'center', justifyContent: 'center' }]}>
                        <View 
                            style={{
                                flexDirection: 'column',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                alignItems: 'center',
                                maxWidth: '90%'
                            }}  
                        >
                            <Text style={[Styles.pageHeaderTitle, {flex: 0, color: colors.primary}]}>
                                {fullname.toUpperCase()}
                            </Text>
                            <Text style={[Styles.pageHeaderTitle, { flex: 0} ]}>
                                Discharge Patient
                            </Text>
                            
                        </View>
                    </View>
                    <View style={{margin: 15}}>
                        {/* Discharge Data Info*/}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Discharge Data"
                                titleStyle={[Styles.accordionListTitle]}
                                left={props => <List.Icon {...props} icon='transit-transfer'/>}
                                description={hasValidationErrors ? 'Required: Enter all required fields' : 'Required'}
                                expanded={expandDischargeAccordion}
                                onPress={() => setExpandDischargeAccordion((prev) => !prev)}
                            >
                            <View style={Styles.accordionContentWrapper}>
                                <SearchableDropdown 
                                    data={[
                                        {value: 'Routine discharge', key: 'routine'},
                                        {value: 'Referred to higher level of care', key: 'referred'},
                                        {value: 'Unplanned discharge', key: 'unplanned'},
                                        {value: 'Deceased', key: 'deceased'},
                                    ]} 
                                    label={"Discharge Status (required)"} 
                                    placeholder='Select option below'
                                    onSelect={(item) => updatePatientData({ dischargeStatus: item.value })}
                                    search={false}
                                    value= {patientData.dischargeStatus}
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

                                 <Text variant="bodySmall" style={{ fontStyle: 'italic', color: colors.onSurfaceVariant, marginBottom: 15 }}>
                                    Note: This data will be used to update post-discharge mortality risk predictions.
                                </Text>
                            </View>
                            </List.Accordion>
                        </View>

                        {/* Unknown Fields Update/Display Accordion */}
                        {hasUnknownAdmissionFields && (
                            <View style={Styles.accordionListWrapper}>
                                <List.Accordion
                                    title={isDobStillUnknown || isHivStillUnknown ? "Update Admission Data" : "Updated Admission Data"}
                                    left={props => <List.Icon {...props} icon="heart-pulse"/>}
                                    description={
                                        isDobStillUnknown || isHivStillUnknown 
                                            ? "Optional: Update unknown values" 
                                            : "Data has been updated"
                                    }
                                    expanded={showUpdateUnknownFields}
                                    onPress={() => setShowUpdateUnknownFields(!showUpdateUnknownFields)}
                                >
                                    <View style={Styles.accordionContentWrapper}>
                                        {(isDobStillUnknown || isHivStillUnknown) ? (
                                            // Show editable fields if still unknown
                                            <>
                                                <Text style={[Styles.modalText, { marginBottom: 16 }]}>
                                                    Some patient data was marked as unknown at admission. You can update this information now if it has become available.
                                                </Text>

                                                {isDobStillUnknown && (
                                                    <Card style={{ marginBottom: 12, backgroundColor: colors.errorContainer }}>
                                                        <Card.Content>
                                                            <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>
                                                                Exact Date of Birth Unknown
                                                            </Text>
                                                            <Text variant="bodySmall" style={{ marginBottom: 12 }}>
                                                                Current age is estimated at {AgeCalculator.formatAge(patientData.ageInMonths)} old. 
                                                                Enter exact DOB if known:
                                                            </Text>

                                                            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                                                <TextInput 
                                                                    label="Date of Birth (YYYY-MM-DD)" 
                                                                    placeholder='Select date' 
                                                                    mode="outlined" 
                                                                    value={editedDOB ? editedDOB.toISOString().split("T")[0] : ""}
                                                                    style={[Styles.textInput, {marginTop: 10}]}
                                                                    editable={false}
                                                                    pointerEvents="none"
                                                                />
                                                            </TouchableOpacity>

                                                            {showDatePicker && (
                                                                <DateTimePicker
                                                                    value={editedDOB || new Date()}
                                                                    mode="date"
                                                                    display={Platform.OS === "ios" ? "spinner" : "default"}
                                                                    onChange={handleDobChange}
                                                                    maximumDate={new Date()}
                                                                />
                                                            )}

                                                            <Button
                                                                style={{ alignSelf: 'flex-end', marginTop: 8 }}
                                                                icon='content-save-check'
                                                                buttonColor={colors.primary}
                                                                textColor={colors.onPrimary}
                                                                mode='contained'
                                                                onPress={handleSaveDob}
                                                                loading={isUpdatingUnknownFields}
                                                                disabled={!editedDOB || isUpdatingUnknownFields}
                                                                compact
                                                            >
                                                                Save DOB
                                                            </Button>
                                                        </Card.Content>
                                                    </Card>
                                                )}

                                                {isHivStillUnknown && (
                                                    <Card style={{ marginBottom: 12, backgroundColor: colors.errorContainer }}>
                                                        <Card.Content>
                                                            <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>
                                                                HIV Status Unknown
                                                            </Text>
                                                            <Text variant="bodySmall" style={{ marginBottom: 12 }}>
                                                                HIV status was marked as 'unknown' at admission. 
                                                                If known, please confirm whether the patient is HIV-positive or negative.
                                                            </Text>

                                                            <Text style={[Styles.accordionSubheading, { fontWeight: 'bold', marginBottom: 8 }]}>
                                                                Updated HIV Status:
                                                            </Text>
                                                            <RadioButtonGroup
                                                                options={[
                                                                    { label: 'Positive', value: 'positive' },
                                                                    { label: 'Negative', value: 'negative' },
                                                                ]}
                                                                selected={editedHivStatus as string}
                                                                onSelect={setEditedHivStatus}
                                                            />

                                                            <Button
                                                                style={{ alignSelf: 'flex-end', marginTop: 8 }}
                                                                icon='content-save-check'
                                                                buttonColor={colors.primary}
                                                                textColor={colors.onPrimary}
                                                                mode='contained'
                                                                onPress={handleSaveHivStatus}
                                                                loading={isUpdatingUnknownFields}
                                                                disabled={!editedHivStatus || editedHivStatus === 'unknown' || isUpdatingUnknownFields}
                                                                compact
                                                            >
                                                                Save Status
                                                            </Button>
                                                        </Card.Content>
                                                    </Card>
                                                )}
                                            </>
                                        ) : (
                                            // Show read-only updated values
                                            <>
                                                <Text style={[Styles.modalText, { marginBottom: 16 }]}>
                                                    The following information was unknown at admission but has been updated during discharge:
                                                </Text>

                                                {wasDobUnknown && !isDobStillUnknown && (
                                                    <Card style={{ marginBottom: 12, backgroundColor: colors.secondary }}>
                                                        <Card.Content>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                                <List.Icon icon="check-circle" color={colors.primary} />
                                                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.primary, marginLeft: 10 }}>
                                                                    Date of Birth Updated
                                                                </Text>
                                                            </View>
                                                            <View style={{ paddingLeft: 40 }}>
                                                                <Text variant="bodyMedium" style={{ marginBottom: 4 }}>
                                                                    <Text style={{ fontWeight: 'bold' }}>New DOB: </Text>
                                                                    {patientData.dob 
                                                                        ? new Date(patientData.dob).toLocaleDateString('en-CA')
                                                                        : 'Not available'}
                                                                </Text>
                                                                <Text variant="bodyMedium">
                                                                    <Text style={{ fontWeight: 'bold' }}>Age: </Text>
                                                                    {AgeCalculator.formatAge(patientData.ageInMonths)} old
                                                                </Text>
                                                            </View>
                                                        </Card.Content>
                                                    </Card>
                                                )}

                                                {wasHivUnknown && !isHivStillUnknown && (
                                                    <Card style={{ marginBottom: 12, backgroundColor: colors.secondary }}>
                                                        <Card.Content>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                                <List.Icon icon="check-circle" color={colors.primary} />
                                                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.primary, marginLeft: 10 }}>
                                                                    HIV Status Updated
                                                                </Text>
                                                            </View>
                                                            <View style={{ paddingLeft: 40 }}>
                                                                <Text variant="bodyMedium">
                                                                    <Text style={{ fontWeight: 'bold' }}>New Value: </Text>
                                                                    {patientData.hivStatus && (patientData.hivStatus?.charAt(0).toUpperCase() + patientData.hivStatus?.slice(1))}
                                                                </Text>
                                                            </View>
                                                        </Card.Content>
                                                    </Card>
                                                )}

                                                <Text variant="bodySmall" style={{ fontStyle: 'italic', color: colors.onSurfaceVariant, marginTop: 8 }}>
                                                    These values are now locked and cannot be edited further during discharge.
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                </List.Accordion>
                            </View>
                        )}

                        {/* Confirm Medical Info Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Review Medical Diagnoses"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="medical-bag"/>}
                                description={'Optional: Update medical conditions'}
                                
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

                         {/* CHW Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="CHW Referral"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="doctor"/>}
                                description={'Required'}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <VHTReferralSection
                                        village={patientData.village}
                                        subvillage={patientData.subvillage}
                                        vhtName={patientData.vhtName}
                                        vhtTelephone={patientData.vhtTelephone}
                                        onUpdate={updatePatientData}
                                        colors={colors}
                                        mode="discharge"
                                        showClearButton={true}
                                        showHeader={false}
                                    />
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Caregiver Contact Accordion*/}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Caregiver Contact Information"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="account-child"/>}
                                description={'Required'}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <CaregiverContactSection
                                        caregiverName={patientData.caregiverName}
                                        caregiverTel={patientData.caregiverTel}
                                        confirmTel={patientData.confirmTel}
                                        sendReminders={patientData.sendReminders}
                                        isCaregiversPhone={patientData.isCaregiversPhone}
                                        onUpdate={updatePatientData}
                                        colors={colors}
                                        mode="edit"
                                        showHeader={false}
                                        showClearButton={false}
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
                        labelNext="Complete Discharge"
                        disabledNext={hasValidationErrors}
                        onPrevious={handleRouterBack}
                        onNext={() => handleDischarge(fullname)}
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }
}