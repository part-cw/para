import PaginationControls from "@/src/components/PaginationControls";
import RadioButtonGroup from "@/src/components/RadioButtonGroup";
import SearchableDropdown from "@/src/components/SearchableDropdown";
import { CaregiverContactSection } from "@/src/components/sections/CaregiverContactSection";
import { MedicalConditionsSection } from "@/src/components/sections/EditableMedicalConditions";
import { VHTReferralSection } from "@/src/components/sections/VhtReferralSection";
import ValidatedTextInput, { INPUT_TYPES } from "@/src/components/ValidatedTextInput";
import { usePatientData } from "@/src/contexts/PatientDataContext";
import { useStorage } from "@/src/contexts/StorageContext";
import { useValidation } from "@/src/contexts/ValidationContext";
import { dischargeFormSchema } from "@/src/forms/dischargeFormSchema";
import { displayNames } from "@/src/forms/displayNames";
import { spo2DischargeInfo } from "@/src/forms/infoText";
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from "@/src/utils/ageCalculator";
import { calculateWAZ, validateOxygenSaturationRange } from "@/src/utils/clinicalVariableCalculator";
import { formatDateString, formatName } from "@/src/utils/formatUtils";
import { normalizeBoolean } from "@/src/utils/normalizer";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, RefreshControl, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Card, IconButton, List, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";


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

    // track errors and reviewed sections
    const [reviewedSections, setReviewedSections] = useState<Set<string>>(new Set(['dischargeData'])); // discharge data automatically reviewed becase accordion starts out open
    const [sectionValidations, setSectionValidations] = useState<{[key: string]: { isValid: boolean; errors: string[] }}>({});

    const [isSubmitting, setIsSubmitting] = useState(false);

    console.log('reviewedSections', reviewedSections)
    console.log('sectionvalidaitons', sectionValidations)
    
    const params = useLocalSearchParams();
    const patientId = params.patientId as string;
    console.log('patietnID', patientId)


    // check what was unknown at admission
    const wasDobUnknown = initialDobUnknown
    const wasHivUnknown = initialHivUnknown

    // Check if values are still unknown (not yet updated)
    const isDobStillUnknown = wasDobUnknown && (!patientData.dob);
    const isHivStillUnknown = wasHivUnknown && (patientData.hivStatus?.toLowerCase() === 'unknown');
    const hasUnknownAdmissionFields = wasDobUnknown || wasHivUnknown;


    // load patient data on mount  
    useEffect(() => {
        loadPatientData();
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

    // track whether to display deceased modal
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

    // Validate discharge data section
    const validateDischargeData = () => {
        const errors: string[] = [];

        if (!dischargeStatus) {
            errors.push('Discharge status is required');
        }

        if (dischargeStatus && dischargeStatus.toLowerCase() !== 'deceased') {
            if (!feedingStatus_discharge) {
                errors.push('Feeding status is required');
            }

            if (!spo2_discharge) {
                errors.push('Discharge SpO₂ is required');
            } else {
                const spo2Validation = validateOxygenSaturationRange(spo2_discharge);
                if (!spo2Validation.isValid && spo2Validation.errorMessage) {
                    errors.push(spo2Validation.errorMessage);
                }
            }
        }

        return errors;
    };

    // Validate VHT Referral section
    const validateVHTReferral = () => {
        const errors: string[] = [];
        
        if (!patientData.village || patientData.village.trim() === '') {
            errors.push('Village is required');
        }
        
        if (!patientData.vhtName || patientData.vhtName.trim() === '') {
            errors.push('CHW name is required');
        }
        
        if (!patientData.vhtTelephone || patientData.vhtTelephone.trim() === '') {
            errors.push('CHW telephone is required');
        }
        
        return errors;
    };

    // Validate Caregiver Contact section
    const validateCaregiverContact = () => {
        const errors: string[] = [];
        
        if (!patientData.caregiverName || patientData.caregiverName.trim() === '') {
            errors.push('Caregiver name is required');
        }
        
        if (patientData.caregiverTel && patientData.caregiverTel.trim() !== '') {
            if (!patientData.confirmTel || patientData.confirmTel.trim() === '') {
                errors.push('Confirm telephone is required');
            } else if (patientData.caregiverTel !== patientData.confirmTel) {
                errors.push('Telephone numbers must match');
            }
        }
        
        return errors;
    };

    // Validate Medical Conditions section - TODO remove? these fields should already be filled
    const validateMedicalConditions = () => {
        const errors: string[] = [];
        const requiredConditions = [
            'pneumonia', 
            'severeAnaemia', 
            'diarrhea', 
            'malaria', 
            'sepsis', 
            'meningitis_encephalitis'
        ];
        
        for (const condition of requiredConditions) {
            const value = patientData[condition as keyof typeof patientData];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors.push(`${displayNames[condition] || condition} is required`);
            }
        }
        
        if (!patientData.chronicIllnesses || patientData.chronicIllnesses.length === 0) {
            errors.push('Chronic illnesses selection is required');
        }
        
        return errors;
    };

    // Update all section validations whenever relevant data changes
    useEffect(() => {
        const newValidations: typeof sectionValidations = {};
        
        // Discharge Data
        const dischargeDataErrors = validateDischargeData();
        newValidations['dischargeData'] = {
            isValid: dischargeDataErrors.length === 0,
            errors: dischargeDataErrors
        };
        
        // Update Admission Data (always valid - unknown values are also accepted)
        newValidations['updateAdmissionData'] = {
            isValid: true,
            errors: []
        };
        
        // Medical Conditions
        const medConditionsErrors = validateMedicalConditions();
        newValidations['medicalConditions'] = {
            isValid: medConditionsErrors.length === 0,
            errors: medConditionsErrors
        };
        
        // VHT Referral
        const vhtErrors = validateVHTReferral();
        newValidations['vhtReferral'] = {
            isValid: vhtErrors.length === 0,
            errors: vhtErrors
        };
        
        // Caregiver Contact
        const caregiverErrors = validateCaregiverContact();
        newValidations['caregiverContact'] = {
            isValid: caregiverErrors.length === 0,
            errors: caregiverErrors
        };
        
        setSectionValidations(newValidations);
    }, [
        dischargeStatus,
        feedingStatus_discharge,
        spo2_discharge,
        patientData.village,
        patientData.vhtName,
        patientData.vhtTelephone,
        patientData.caregiverName,
        patientData.caregiverTel,
        patientData.confirmTel,
        patientData.pneumonia,
        patientData.severeAnaemia,
        patientData.diarrhea,
        patientData.malaria,
        patientData.sepsis,
        patientData.meningitis_encephalitis,
        patientData.chronicIllnesses,
        isDobStillUnknown,
        isHivStillUnknown,
        hasUnknownAdmissionFields
    ]);


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

    const handleAccordionPress = (sectionId: string) => {
        setReviewedSections(prev => new Set([...prev, sectionId]));
    };

    const handleDischarge = (patientName: string) => {
        // Check for any invalid sections
        const invalidSections = Object.entries(sectionValidations)
            .filter(([sectionId, validation]) => {
                // Skip updateAdmissionData if no unknown fields
                if (sectionId === 'updateAdmissionData' && !hasUnknownAdmissionFields) {
                    return false;
                }
                return !validation.isValid;
            })
            .map(([sectionId]) => sectionId);
        
        if (invalidSections.length > 0) {
            const sectionNames = invalidSections
                .map(id => displayNames[id] || id)
                .join(', ');
            
            const errorMessages = invalidSections
                .map(id => {
                    const errors = sectionValidations[id]?.errors || [];
                    if (errors.length > 0) {
                        return `\n\n${displayNames[id]}:\n- ${errors.join('\n- ')}`;
                    }
                    return '';
                })
                .join('');
            
            const message = `Please fix the following errors before discharge:${errorMessages}`;
            
            if (Platform.OS === 'web') {
                alert(message);
                return;
            }
            
            Alert.alert('Missing Required Information', message);
            return;
        }


        // Check that all required sections have been reviewed
        const allRequiredSections = dischargeFormSchema
            .filter(s => s.isRequired)
            .map(s => s.sectionName);
        
        const unreviewedRequired = allRequiredSections.filter(
            section => !reviewedSections.has(section)
        );

        // Special handling for updateAdmissionData - only needs review if there are unknown fields
        const needsReview = unreviewedRequired.filter(section => {
            if (section === 'updateAdmissionData') {
                return hasUnknownAdmissionFields;
            }
            return true;
        });

        // display alert if any section need review
        if (needsReview.length > 0) {
            const sectionNames = needsReview
                .map(s => displayNames[s])
                .join(', ');
            
            if (Platform.OS === 'web') {
                alert(`Unreviewed Sections\n\nPlease review all required sections before discharge: ${sectionNames}`);
                return;
            }
            
            Alert.alert(
                'Unreviewed Sections',
                `Please review all required sections before discharge: ${sectionNames}`
            );
            return;
        }

        const confirmDischarge = async () => {
            try {
                setIsSubmitting(true);
                await completeDischarge();
                router.replace('../riskDisplay'); // TODO - use router.push instead?
            } catch (error) {
                console.error('Error completing discharge:', error);
                Alert.alert('Error', 'Failed to complete discharge. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
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

    // ==== HELPERS ====

    const getAccordionIcon = (sectionId: string) => {
        const isReviewed = reviewedSections.has(sectionId);
        const validation = sectionValidations[sectionId];
        const section = dischargeFormSchema.find(s => s.sectionName === sectionId);
        
        // Special case for updateAdmissionData - if no unknown fields, show complete
        if (sectionId === 'updateAdmissionData' && !hasUnknownAdmissionFields && reviewedSections.has('updateAdmissionData')) {
            return 'check-circle-outline';
        }
        
        if (isReviewed &&  validation?.isValid) {
            return 'check-circle-outline';
        }
        
        if (!isReviewed) {
            // If not reviewed, show warning (optional) or error (required)
            return section?.isRequired ? 'error-outline' : 'warning';
        }
        
        // Reviewed but not complete
        return section?.isRequired ? 'error-outline' : 'warning';
    };

    const getAccordionIconColor = (sectionId: string) => {
        const isReviewed = reviewedSections.has(sectionId);
        const validation = sectionValidations[sectionId];
        const section = dischargeFormSchema.find(s => s.sectionName === sectionId);
        
        // Special case for updateAdmissionData
        if (sectionId === 'updateAdmissionData' && !hasUnknownAdmissionFields && reviewedSections.has('updateAdmissionData')) {
            return 'green';
        }

        if (isReviewed && validation.isValid) return 'green'        
        if (!isReviewed) return section?.isRequired ? 'red' : 'orange';
        
        // Reviewed but not complete
        return section?.isRequired ? 'red' : 'orange';
    };

    const CustomAccordionIcon = ({ sectionId }: { sectionId: string }) => (
        <MaterialIcons 
            name={getAccordionIcon(sectionId) as any}
            size={24} 
            color={getAccordionIconColor(sectionId)}
            style={{ marginLeft: 16, marginTop: 5 }}
        />
    );

    const getAccordionDescription = (sectionId: string) => {
        const isReviewed = reviewedSections.has(sectionId);
        const validation = sectionValidations[sectionId];
        const section = dischargeFormSchema.find(s => s.sectionName === sectionId);
        
        // Special case for updateAdmissionData
        if (sectionId === 'updateAdmissionData') {
            if (!hasUnknownAdmissionFields) {
                return 'No updates needed';
            }
            if (isDobStillUnknown || isHivStillUnknown) {
                return 'Optional: Update unknown values';
            }
            return 'Data has been updated';
        }
        
        // For all other sections
        if (isReviewed && validation?.isValid) {
            return section?.isRequired ? 'Required: Complete' : 'Optional: Complete';
        }
        
        if (!isReviewed && !validation?.isValid) {
            const errorCount = validation?.errors?.length || 0;
            return `Review section${errorCount > 0 ? ` - ${errorCount} error${errorCount > 1 ? 's' : ''}` : ''}`;
        }
        
        if (isReviewed && !validation?.isValid) {
            const errorCount = validation?.errors?.length || 0;
            return `Fix ${errorCount} error${errorCount > 1 ? 's' : ''}`;
        }
        
        // Not reviewed but valid
        return section?.isRequired ? 'Required: Review section' : 'Optional: Review section';
    };

    
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
                                title={"Discharge Data"}
                                titleStyle={[Styles.accordionListTitle]}
                                left={props => <CustomAccordionIcon sectionId="dischargeData" />}
                                description={getAccordionDescription('dischargeData')}
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
                                    label={`${displayNames['dischargeStatus']} (required)`} 
                                    placeholder='Select option below'
                                    onSelect={(item) => updatePatientData({ dischargeStatus: item.value })}
                                    search={false}
                                    value= {patientData.dischargeStatus}
                                />

                                <View>
                                    <Text style={[Styles.accordionSubheading, {fontWeight: 'bold'}]}>{displayNames['feedingStatus_discharge']} <Text style={Styles.required}>*</Text></Text>
                                    <Text>{displayNames['feedingStatusQuestion']}</Text>
                                    <RadioButtonGroup 
                                        options={[
                                            { label: 'Feeding well', value: 'feeding well'},
                                            { label: 'Feeding poorly', value: 'feeding poorly'},
                                            { label: 'Not feeding at all', value: 'not feeding at all'}
                                        ]} 
                                        selected={feedingStatus_discharge || null} 
                                        onSelect={(value) => updatePatientData({ feedingStatus_discharge: value})}
                                    />
                                </View>

                                <View style={{flexDirection:'row', alignItems: 'center'}}>
                                    <Text style={[Styles.accordionSubheading, {fontWeight: 'bold'}]}>{displayNames['spo2_discharge']} <Text style={Styles.required}>*</Text></Text>
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
                                    value={spo2_discharge as string} 
                                    onChangeText={(value) => updatePatientData({ spo2_discharge: value })}
                                    inputType={INPUT_TYPES.NUMERIC}
                                    isRequired={true}
                                    customValidator={(value) => validateOxygenSaturationRange(value).isValid}
                                    customErrorMessage={spo2_discharge && validateOxygenSaturationRange(spo2_discharge).errorMessage } 
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
                                    left={props => <CustomAccordionIcon sectionId="updateAdmissionData" />}
                                    description={getAccordionDescription('updateAdmissionData')}
                                    expanded={showUpdateUnknownFields}
                                    onPress={() => {
                                        setShowUpdateUnknownFields(!showUpdateUnknownFields)
                                        handleAccordionPress('updateAdmissionData')
                                    }}
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
                                left={props => <CustomAccordionIcon sectionId="medicalConditions" />}
                                description={getAccordionDescription('medicalConditions')}
                                onPress={() => handleAccordionPress('medicalConditions')}
                                
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
                                title={displayNames['vhtReferral']}
                                titleStyle={Styles.accordionListTitle}
                                left={props => <CustomAccordionIcon sectionId="vhtReferral" />}
                                description={getAccordionDescription('vhtReferral')}
                                onPress={() => handleAccordionPress('vhtReferral')}
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
                                title={displayNames['caregiverContact']}
                                titleStyle={Styles.accordionListTitle}
                                left={props => <CustomAccordionIcon sectionId="caregiverContact" />}
                                description={getAccordionDescription('caregiverContact')}
                                onPress={() => handleAccordionPress('caregiverContact')}
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

                    {/* Pagination controls */}
                    <PaginationControls
                        showPrevious={true}
                        showNext={true}
                        labelPrevious="Patient Records"
                        labelNext="Complete Discharge"
                        onPrevious={handleRouterBack}
                        onNext={() => handleDischarge(fullname)}
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }
}