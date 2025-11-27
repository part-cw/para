import CheckboxGroup from "@/src/components/CheckboxGroup";
import { EditGroup } from "@/src/components/EditFieldGroup";
import RadioButtonGroup from "@/src/components/RadioButtonGroup";
import RiskCard from "@/src/components/RiskCard";
import { PatientData } from "@/src/contexts/PatientData";
import { usePatientData } from "@/src/contexts/PatientDataContext";
import { useStorage } from "@/src/contexts/StorageContext";
import { displayNames } from "@/src/forms/displayNames";
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from "@/src/utils/ageCalculator";
import { calculateWAZ } from "@/src/utils/clinicalVariableCalculator";
import { displayDob, formatChronicIllness, formatDateString, formatName, getOtherChronicIllnessList } from "@/src/utils/formatUtils";
import { convertToYesNo, normalizeBoolean } from "@/src/utils/normalizer";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, RefreshControl, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, List, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";


export default function EditPatientRecord() {
    const { colors } = useTheme()
    const { storage } = useStorage();
    const { 
        patientData, 
        riskAssessment, 
        loadPatient, 
        calculateAdmissionRiskWithData, 
        clearPatientData,
    } = usePatientData();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editedDOB, setEditedDob] = useState<Date | null>(null);
    const [pendingDobUpdates, setPendingDobUpdates] = useState<Partial<PatientData> | null>(null);
    const [editedHivStatus, setEditedHivStatus] = useState<string | undefined>('');

    const [recalculating, setRecalculating] = useState(false);
    const [riskUpdated, setRiskUpdated] = useState(false);
    const [riskUpdateTime, setRiskUpdateTime] = useState<Date>();


    // Neonatal jaundice modal states
    const [showNeonatalJaundiceModal, setShowNeonatalJaundiceModal] = useState(false);
    const [neonatalJaundiceValue, setNeonatalJaundiceValue] = useState<string>('');

    // medical conditions states
    const [editedPneumonia, setEditedPneumonia] = useState<string>('');
    const [editedSevereAnaemia, setEditedSevereAnaemia] = useState<string>('');
    const [editedDiarrhea, setEditedDiarrhea] = useState<string>('');
    const [editedMalaria, setEditedMalaria] = useState<string>('');
    const [editedSepsis, setEditedSepsis] = useState<string>('');
    const [editedMeningitis, setEditedMeningitis] = useState<string>('');
    const [editedChronicIllness, setEditedChronicIllness] = useState<string[]>([]);
    const [editedOtherChronicIllness, setEditedOtherChronicIllness] = useState<string>('');
    const [showOtherChronicIllnessModal, setShowOtherChronicIllnessModal] = useState(false);

    const params = useLocalSearchParams();
    const patientId = params.patientId as string;

    console.log('risk assessment', riskAssessment)

    // load patient data on mount  
    useEffect(() => {
        loadPatientData();
    }, []);


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

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPatientData();
        setRefreshing(false);
    }

    const handleDobChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === "set" && selectedDate) {
            setEditedDob(selectedDate)
        }

        if (Platform.OS === "android") {
            setShowDatePicker(false); // Android requires manual closing
        }
    };

    /**
     * TODO: implement re-admit workflow (retain prev info to save time for users) 
     */
    const handleUpdateDob = () => {
        // calculcate new age values
        const newAgeInMonths = AgeCalculator.calculateAgeInMonths(editedDOB, '', '', '');
        const newAgeInDays = editedDOB && AgeCalculator.getAgeInDaysFromDob(editedDOB);
        const newIsUnderSixMonths = newAgeInMonths < 6
        const newIsNeonate = (typeof newAgeInDays === 'number') && (newAgeInDays < 30);
        const newIsSickYoungInfant = (typeof newAgeInDays === 'number') && (newAgeInDays < 28);
        const newWAZ = calculateWAZ(newAgeInMonths, patientData.sex, parseFloat(patientData.weight as string))

        // store previous age info (before dob change)
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
        }

        if (Platform.OS !== 'web') {
            // confirm that isUnderSixMonths unchanged -> if it is prevent user from changing DOB
            if (previous.isUnderSixMonths !== newIsUnderSixMonths) {
                Alert.alert(
                    '⚠️ UPDATE FAILED',
                    'Are you sure the date of birth you entered is correct? This DOB change affects the AI models used for risk scoring.\n\nClick cancel, or re-admit patient if the DOB needs to be corrected.',
                    [ 
                        {text: 'Cancel', style: 'cancel'},
                        {text: 'Readmit', style: 'destructive', onPress: () => {console.log('TODO - redirect to add-workflow & perserve basic info')}}
                    ]
                )
                setEditedDob(null)
                return;
            }

            Alert.alert(
                'WARNING',
                'Updating DOB will trigger a risk recalculation. This update cannot be undone.\n\nContinue anyway?',
                [ 
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'OK', onPress: () => confirmDobUpdate(previous, newAgeInMonths, newIsNeonate, newIsSickYoungInfant, newWAZ)}]
            )
        } else {
            // TODO -  add alert for web 
            return;
        } 
    }

    const confirmDobUpdate = async (previous: any, newAgeInMonths: number, newIsNeonate: boolean, newIsSickYoungInfant: boolean, newWaz: number) => {
        // only update values if they have changed - don't include isUnderSixMonths (this should never change)
        let updates = {
            ...((!previous.dob || (previous.dob && editedDOB && formatDateString(previous.dob) !== formatDateString(editedDOB.toISOString()))) && {dob: editedDOB}),
            ...(previous.birthYear && previous.birthYear !== '' && {birthYear: ''}),
            ...(previous.birthMonth && previous.birthMonth !== '' &&  {birthMonth: ''}),
            ...(previous.approxAgeInYears && previous.approxAgeInYears !== '' && {approxAgeInYears: ''}),
            ...(previous.ageInMonths !== newAgeInMonths && {ageInMonths: newAgeInMonths}),
            ...(previous.waz !== newWaz && {waz: newWaz}),
            ...(previous.isDOBUnknown !== false && {isDOBUnknown: false} ),
            ...(previous.isYearMonthUnknown !== false && {isYearMonthUnknown: false}),
            ...(previous.isNeonate !== newIsNeonate && {isNeonate: newIsNeonate}),
            ...(!newIsNeonate && previous.neonatalJaundice && {neonatalJaundice: undefined}), // if new isNeonate false, set previous jaundice to null or undefined
            ...(previous.sickYoungInfant !== newIsSickYoungInfant && {sickYoungInfant: newIsSickYoungInfant})
        };

        console.log('....1. updating age info with updates', updates)

        setIsUpdating(true);
        await storage.doBulkUpdate(patientId, updates, previous);
        setIsUpdating(false);

        // check if all neonatal info needs to be filled
        if (newIsNeonate && !patientData?.neonatalJaundice) {
            console.log('...2a. neonate status changed...')
            setPendingDobUpdates(updates);
            setNeonatalJaundiceValue('') // clear any prevous value
            setShowNeonatalJaundiceModal(true);
            console.log('%%%% back to confrim dob update, neonatalJaundoice val', neonatalJaundiceValue)
            return;
        } 

        // if no changes to neonate status, proceed with risk calculations
        console.log('..2b. dob update complete..calculating risk...')
        await proceedWithRiskRecalculation(updates);
        await onRefresh();
    }

    const handleSaveNeonatalJaundice = async () => {
        console.log('handling save neonatal jaundice')
        if (!neonatalJaundiceValue) {
            Alert.alert('Required', 'Please select a value for neonatal jaundice');
            return;
        }

        try {
            const prevJaundice = patientData?.neonatalJaundice as string;
            const jaundiceUpdate = { neonatalJaundice: neonatalJaundiceValue };

            console.log('!!!!!!!!!!!! prev jaundice', prevJaundice, typeof prevJaundice)
            console.log('!!!!!!!! neonatal Juandice value', neonatalJaundiceValue)
            console.log('!!!! updates', jaundiceUpdate)
            console.log('!!!! pending DOB updates', pendingDobUpdates)
            
            // Update neonatal jaundice in storage
            setIsUpdating(true);
            await storage.updatePatient(patientId, jaundiceUpdate);
            console.log('!!!!!!!!!!!!!!!!!!!!! 3a. updated storage, now logging changes')
            await storage.logChanges(patientId, 'UPDATE', 'neonatalJaundice', prevJaundice, (neonatalJaundiceValue === 'yes' ? '1' : '0'));
            setIsUpdating(false);

            setShowNeonatalJaundiceModal(false);
            setEditedDob(editedDOB);

            // Merge neonatal jaundice with pending DOB updates (if any)
            const allUpdates = {
                ...pendingDobUpdates, 
                ...jaundiceUpdate 
            };

            console.log('!!! 4a. proceeding witl all updates', allUpdates)
            
            // Now proceed with risk recalculation
            await proceedWithRiskRecalculation(allUpdates);
            await onRefresh();
        } catch (error) {
            console.error('Error updating neonatal jaundice:', error);
            Alert.alert('Error', 'Failed to update neonatal jaundice');
            setIsUpdating(false);
        }
    }

    const handleUpdateHivStatus = () => {
        const confirmUpdate = async () => {
            const prev = patientData?.hivStatus
            const updates = {hivStatus: editedHivStatus}

            setIsUpdating(true);

            // update hivStatus in storage
            await storage.updatePatient(patientId, updates)
            await storage.logChanges(patientId, 'UPDATE', 'hivStatus', prev as string, editedHivStatus as string)

            setIsUpdating(false);

            await proceedWithRiskRecalculation(updates);
            await onRefresh();
        }

        if (Platform.OS !== 'web') {
            Alert.alert(
                '⚠️ WARNING',
                'Updating HIV status may trigger a risk recalculation. This update cannot be undone.\n\nContinue anyway?',
                [ 
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'OK', onPress: () => confirmUpdate()}]
            )
        } else {
            // TODO -  add alert for web 
            return;
        } 
    }

    // recalculate risk 
    const proceedWithRiskRecalculation = async (updates?: Partial<PatientData>) => {
        console.log('...recalculating risk with udpates...', updates)
        setRecalculating(true);

        try {
            const dataForCalculation = 
                updates ? { ...patientData, ...updates }: patientData;

            const admissionRisk = calculateAdmissionRiskWithData(dataForCalculation);
            console.log('~~~~ recalculated admissionRisk', admissionRisk)
            
            admissionRisk && await storage.saveRiskPrediction(patientId, admissionRisk, 'admission');
            setRiskUpdated(true);
            setRiskUpdateTime(new Date());
        } catch (error) {
            console.error('Error recalculating risk:', error);
            Alert.alert('Error', 'Failed to recalculate risk');
        } finally {
            setRecalculating(false); 
            await onRefresh();   
        }
    }

    // ========= medical conditions update functions ================
    const canEditCondition = (currentValue: string | undefined, condition?: string): boolean => {
        if (!currentValue) return true;
        if (condition === 'diarrhea') return true;

        const normalizedValue = currentValue.toLowerCase();
        return normalizedValue === 'unsure' || normalizedValue === 'suspected';
    };

    const getAllowedOptions = (currentValue: string | undefined, condition?: string) => {
        if (!currentValue) return [];
        
        const normalizedValue = currentValue.toLowerCase();
        
        if (normalizedValue === 'unsure') {
            return [
                { label: 'Yes - positive diagnosis', value: 'Yes' }, // use just pos or just neg instead? -- TODO
                { label: 'No - negative diagnosis', value: 'No' },
                { label: 'Suspected', value: 'Suspected' }
            ];
        }
        
        if (normalizedValue === 'suspected') {
            return [
                { label: 'Yes - positive diagnosis', value: 'Yes' },
                { label: 'No - negative diagnosis', value: 'No' }
            ];
        }

        if (condition === 'diarrhea') {
            return [
                { label: 'Acute', value: 'Acute' },
                { label: 'Persistent', value: 'Persistent' },
                { label: 'Neither acute nor persistent', value: 'Neither' },
            ];
        }

        return [];
    };

    const handleUpdateMedicalCondition = async (
        fieldName: string, 
        newValue: string, 
        previousValue: string,
        setEditValue: (val: string) => void
    ) => {
        const confirmUpdate = async () => {
            try {
                setIsUpdating(true);
                
                await storage.updatePatient(patientId, { [fieldName]: newValue });
                await storage.logChanges(patientId, 'UPDATE', fieldName, previousValue, newValue);
                
                setIsUpdating(false);
                setEditValue(''); // Clear edit state
                
                await onRefresh();
                // Alert.alert('Success', 'Medical condition updated successfully');
            } catch (error) {
                console.error('Error updating medical condition:', error);
                Alert.alert('Error', 'Failed to update medical condition');
                setIsUpdating(false);
            }
        };

        if (Platform.OS !== 'web') {
            Alert.alert(
                'Confirm Update',
                `Update ${displayNames[fieldName] || fieldName} from "${previousValue}" to "${newValue}"?\n\nChanges may affect careplan recommendations.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'OK', onPress: () => confirmUpdate() }
                ]
            );
        } else {
            // TODO - add alert for web
            confirmUpdate();
        }
    };

    const handleChronicIllnessChange = (selected: string[]) => {
        // Handle mutually exclusive logic
        if (selected.includes('none') && selected.length > 1) {
            // If 'none' is selected with others, remove 'none'
            setEditedChronicIllness(selected.filter(item => item !== 'none'));
        } else if (selected.includes('none')) {
            // If only 'none' is selected
            setEditedChronicIllness(['none']);
        } else {
            // Normal selection
            setEditedChronicIllness(selected);
            if (selected.includes('other')) {
                Alert.alert(
                    'Other Chronic Condition', 
                    'Enter one or multiple conditions, if known, or click cancel',
                    [
                        {text: 'Cancel', style: 'cancel'},
                        {text: 'Add Condition', onPress: () => setShowOtherChronicIllnessModal(true)}
                    ])
            }
        }
    };

    const handleUpdateChronicIllness = async () => {
        if (!editedChronicIllness || editedChronicIllness.length === 0) {
            Alert.alert('Required', 'Please select at least one chronic condition');
            return;
        }

        const confirmUpdate = async () => {
            try {
                setIsUpdating(true);
                
                const previousConditions = patientData?.chronicIllnesses && patientData?.chronicIllnesses || [];
                
                const updates: Partial<PatientData> = { chronicIllnesses: editedChronicIllness };
                const previous: Partial<PatientData> = {chronicIllnesses: previousConditions}

                // If 'other' was removed, clear otherChronicIllness
                if (!editedChronicIllness.includes('other') && patientData?.otherChronicIllness) {
                    updates.otherChronicIllness = '';
                    previous.otherChronicIllness = patientData.otherChronicIllness;
                }
                
                await storage.doBulkUpdate(patientId, updates, previous)
                
                setIsUpdating(false);
                setEditedChronicIllness([]);
                
                await onRefresh();
                // Alert.alert('Success', 'Chronic conditions updated successfully');
            } catch (error) {
                console.error('Error updating chronic illnesses:', error);
                Alert.alert('Error', 'Failed to update chronic conditions');
                setIsUpdating(false);
            }
        };

        if (Platform.OS !== 'web') {
            Alert.alert(
                'Confirm Update',
                'Update chronic conditions?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'OK', onPress: () => confirmUpdate() }
                ]
            );
        } else {
            confirmUpdate();
        }
    };

   const handleUpdateOtherChronicIllness = async () => {
        if (!editedOtherChronicIllness.trim()) {
            Alert.alert('Required', 'Please enter a chronic illness description');
            return;
        }

        const confirmUpdate = async () => {
            try {
                setIsUpdating(true);
                
                const currentIllnesses = getOtherChronicIllnessList(patientData?.otherChronicIllness);
                
                // Parse the input - could be single illness or comma-separated list
                const newIllnesses = editedOtherChronicIllness
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean);
                
                // Check for duplicates
                const duplicates: string[] = [];
                const toAdd: string[] = [];
                
                newIllnesses.forEach(newIllness => {
                    if (currentIllnesses.some(existing => 
                        existing.toLowerCase() === newIllness.toLowerCase()
                    )) {
                        duplicates.push(newIllness);
                    } else {
                        toAdd.push(newIllness);
                    }
                });
                
                // Warn about duplicates but continue with non-duplicates
                if (duplicates.length > 0 && toAdd.length === 0) {
                    Alert.alert('Duplicate', 'All entered illnesses are already in the list');
                    setIsUpdating(false);
                    return;
                }
                
                // Combine current and new illnesses
                const updatedIllnesses = [...currentIllnesses, ...toAdd];
                const updatedValue = updatedIllnesses.join(', ');
                
                const currentChronicIllnesses = patientData?.chronicIllnesses || [];
                
                // Add 'other' to chronicIllnesses if not already present
                const updatedChronicIllnesses = currentChronicIllnesses.includes('other')
                    ? currentChronicIllnesses
                    : [...currentChronicIllnesses, 'other'];
                
                await storage.updatePatient(patientId, {
                    otherChronicIllness: updatedValue,
                    chronicIllnesses: updatedChronicIllnesses
                });
                
                await storage.logChanges(
                    patientId,
                    'UPDATE',
                    'otherChronicIllness',
                    patientData?.otherChronicIllness || '',
                    updatedValue
                );
                
                setIsUpdating(false);
                setEditedOtherChronicIllness('');
                setShowOtherChronicIllnessModal(false)
                
                await onRefresh();
                
                // Show appropriate success message
                const addedCount = toAdd.length;
                const message = addedCount === 1 
                    ? `Added "${toAdd[0]}" to other chronic illnesses`
                    : `Added ${addedCount} illnesses to other chronic illnesses`;
                
                if (duplicates.length > 0) {
                    Alert.alert(
                        'Partially Added', 
                        `${message}\n\nSkipped duplicates: ${duplicates.join(', ')}`
                    );
                } else {
                    Alert.alert('Success', message);
                }
            } catch (error) {
                console.error('Error updating other chronic illness:', error);
                Alert.alert('Error', 'Failed to update other chronic illness');
                setIsUpdating(false);
            }
        };

        const illnessCount = editedOtherChronicIllness.split(',').filter(s => s.trim()).length;
        const confirmMessage = illnessCount > 1
            ? `Add ${illnessCount} chronic illnesses?`
            : `Add "${editedOtherChronicIllness.trim()}" to other chronic illnesses?`;

        if (Platform.OS !== 'web') {
            Alert.alert(
                'Confirm Update',
                confirmMessage,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add', onPress: () => confirmUpdate() }
                ]
            );
        } else {
            confirmUpdate();
        }
    };

    // remove an illness from the 'other chronic illness' list
    const handleRemoveOtherChronicIllness = async (illnessToRemove: string) => {
        const confirmRemove = async () => {
            try {
                setIsUpdating(true);
                
                const currentIllnesses = getOtherChronicIllnessList(patientData?.otherChronicIllness);
                const updatedIllnesses = currentIllnesses.filter(
                    illness => illness.toLowerCase() !== illnessToRemove.toLowerCase()
                );
                
                const updatedValue = updatedIllnesses.length > 0 ? updatedIllnesses.join(', ') : '';
                
                // If no more other illnesses, optionally remove 'other' from chronicIllnesses
                const updates: any = { otherChronicIllness: updatedValue };
                if (updatedIllnesses.length === 0) {
                    const updatedChronicIllnesses = (patientData?.chronicIllnesses || []).filter(
                        (item: string) => item !== 'other'
                    );
                    updates.chronicIllnesses = updatedChronicIllnesses;
                }
                
                await storage.updatePatient(patientId, updates);
                await storage.logChanges(
                    patientId,
                    'UPDATE',
                    'otherChronicIllness',
                    patientData?.otherChronicIllness || '',
                    updatedValue
                );
                
                setIsUpdating(false);
                
                await onRefresh();
                Alert.alert('Success', `Removed "${illnessToRemove}" from other chronic illnesses`);
            } catch (error) {
                console.error('Error removing other chronic illness:', error);
                Alert.alert('Error', 'Failed to remove other chronic illness');
                setIsUpdating(false);
            }
        };

        if (Platform.OS !== 'web') {
            Alert.alert(
                'Confirm Removal',
                `Remove "${illnessToRemove}" from other chronic illnesses?\n\nChanges may affect careplan recommendations.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => confirmRemove() }
                ]
            );
        } else {
            confirmRemove();
        }
    };


    const InfoRow = ({ label, value }: { label: string; value: string | string[] }) => (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', flex: 1, fontSize: 16 }}>{label}:</Text>
            <Text style={{ flex: 2, fontSize: 16 }}>{value || 'Not provided'}</Text>
        </View>
    );

    // show recuclating risk screen OR snackbar
    if (recalculating) {
        // TODO
        return;
    }

    // retrurns a loading screen with spinner
    if (loading) {
        return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16 }}>Loading patient record...</Text>
        </SafeAreaView>
        );
    }

    if (patientData) {
        const otherChronicIllnessSelected = patientData.chronicIllnesses?.includes('other');
        const hivIsEditable = !patientData.isDischarged && (patientData.hivStatus === 'unknown');
        const ageIsEditable = !patientData.isDischarged && ((patientData.isDOBUnknown) || (!patientData.isDOBUnknown && patientData.isYearMonthUnknown));
        const normalizedIsNeonate = patientData.isNeonate && normalizeBoolean(patientData.isNeonate);

        return (
            <SafeAreaView style={{flex: 1, backgroundColor: colors.background, marginTop: -50}}>
                {/* Neonatal jaundice modal */}
                <Modal
                    visible={showNeonatalJaundiceModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {  
                        setPendingDobUpdates(null);
                        setShowNeonatalJaundiceModal(false);
                    }}
                >
                    <View style={Styles.modalOverlay}>
                        <View style={Styles.modalContentWrapper}>
                            <Text style={[Styles.modalHeader, {color: colors.primary}]}>
                                Neonatal Jaundice Required
                            </Text>
                            
                            <Text style={Styles.modalText}>
                                The patient is now classified as a neonate. Please provide neonatal jaundice status before proceeding with risk recalculation.
                            </Text>

                            <Text style={[Styles.modalSubheader, {color: colors.primary}]}>
                                Does the patient have neonatal jaundice?
                            </Text>

                            <RadioButtonGroup
                                options={[
                                    { label: 'Yes', value: 'yes' },
                                    { label: 'No', value: 'no' }
                                ]}
                                selected={neonatalJaundiceValue}
                                onSelect={setNeonatalJaundiceValue}
                            />

                            <View style={{
                                flexDirection: 'row',
                                gap: 10,
                                marginTop: 20
                            }}>
                                <Button
                                    mode="contained"
                                    onPress={handleSaveNeonatalJaundice}
                                    buttonColor={colors.primary}
                                    textColor={colors.onPrimary}
                                    style={{ flex: 1 }}
                                    loading={isUpdating}
                                    disabled={!neonatalJaundiceValue || isUpdating}
                                >
                                    Save & Continue
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>


                {/* Chronic Illness modal */}
                <Modal
                    visible={showOtherChronicIllnessModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {}}
                >
                    <View style={Styles.modalOverlay}>
                        <View style={Styles.modalContentWrapper}>
                            <Text style={[Styles.modalHeader, {color: colors.primary}]}>
                                Add Chronic Conditions
                            </Text>

                            <Text style={[Styles.modalText]}>
                                Enter one or multiple conditions separated by commas, then click 'update'. 
                            </Text>

                            <TextInput
                                label="Enter chronic conditions"
                                mode="outlined"
                                value={editedOtherChronicIllness}
                                onChangeText={setEditedOtherChronicIllness}
                                style={[Styles.textInput, { marginTop: 10 }]}
                                multiline
                                numberOfLines={2}
                            />
                            <View style={{
                                flexDirection: 'row',
                                gap: 10,
                                marginTop: 20
                            }}>
                                <Button
                                    mode="contained"
                                    onPress={handleUpdateOtherChronicIllness}
                                    buttonColor={colors.primary}
                                    textColor={colors.onPrimary}
                                    style={{ flex: 1,  }}
                                    loading={isUpdating}
                                    disabled={!editedOtherChronicIllness?.trim() || isUpdating}
                                >
                                    Update
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>

                <ScrollView 
                    contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0, paddingBottom: 20}}
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
                                {formatName(patientData.firstName, patientData.surname, patientData.otherName).toUpperCase()}
                            </Text>
                            <Text style={[Styles.pageHeaderTitle, { flex: 0} ]}>
                                View/Edit Profile
                            </Text>
                            
                        </View>
                    </View>
                    
                    <View style={{margin: 15}}>
                        {/* Risk Predictions Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                <List.Icon icon="chart-areaspline" color={colors.primary} />
                                <Text style={Styles.cardTitle}>Current Risk Prediction</Text>
                            </View>
                            <View style={Styles.accordionContentWrapper}>
                                {/* TODO - show admission and discharge or only most recent? */}
                                <RiskCard
                                    title={riskAssessment.admission?.riskCategory}
                                    variant={riskAssessment.admission?.riskCategory.toLowerCase()}
                                    content={`Risk score = ${riskAssessment.admission?.riskScore}%`}
                                    expandable={false}
                                />

                                {riskUpdated
                                    ?
                                    <Text style={[Styles.modalText, {paddingHorizontal: 20, fontStyle: 'italic'}]}>
                                        Risk last updated {riskUpdateTime?.toDateString()} 
                                    </Text>
                                    :
                                    <Text style={[Styles.modalText, {paddingHorizontal: 20, fontStyle: 'italic'}]}>
                                        Prediction calculated at {riskAssessment.discharge ? 'discharge' : 'admission'} 
                                    </Text>
                                }
                            </View>
                        </View>

                        {/* Patient Info Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Patient Information"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="account"/>}
                                description={ageIsEditable ? '' : 'Read-only'}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <InfoRow label="Full Name" value={formatName(patientData.firstName, patientData.surname, patientData.otherName)} />
                                    <InfoRow label="Sex" value={patientData.sex} />
                                    
                                    {/* Age information */}
                                    <EditGroup 
                                        fieldLabel={"DOB"} 
                                        fieldValue={displayDob(patientData.dob?.toISOString(), patientData.birthYear, patientData.birthMonth)}
                                        editLabel="Enter new DOB if known" 
                                        canEdit={normalizeBoolean(ageIsEditable)}
                                    >
                                        <>
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
                                                style={{ alignSelf: 'center' }}
                                                icon='content-save-check'
                                                buttonColor={colors.primary}
                                                textColor={colors.onPrimary}
                                                mode='elevated'
                                                onPress={handleUpdateDob}
                                                loading={isUpdating}
                                            >
                                                Update
                                            </Button>

                                        </>
                                    </EditGroup>
                                    
                                    <InfoRow label="Age" value={`${AgeCalculator.formatAge(patientData.ageInMonths)} old`} />
                                    <InfoRow label="Under 6 months" value={patientData.isUnderSixMonths ? 'Yes' : 'No'} />
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Clinical Info Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Admission Clinical Data"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="heart-pulse"/>}
                                description={hivIsEditable ? '' : 'Read-only'}
                            >
                                {
                                    patientData.isUnderSixMonths
                                    ?
                                    <View style={Styles.accordionContentWrapper}>
                                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Health History & Observations</Text>
                                        <InfoRow label={displayNames['illnessDuration']} value={patientData.illnessDuration || 'Not provided'} />
                                        {normalizedIsNeonate === true && <InfoRow label="Neonatal Jaundice" value={convertToYesNo(patientData.neonatalJaundice as string)} />}
                                        <InfoRow label="Bugling fontanelle" value={convertToYesNo(patientData.bulgingFontanelle as string)} />
                                        <InfoRow label="Feeding well" value={convertToYesNo(patientData.feedingWell as string)} />
                                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Body Measurements & Vitals</Text>
                                        <InfoRow label="Weight" value={patientData.weight ? `${patientData.weight} kg`: 'Not provided'} />
                                        <InfoRow label="MUAC" value={patientData.muac ? `${patientData.muac} mm` : 'Not provided'} />
                                        <InfoRow label="SpO₂" value={patientData.spo2_admission ? `${patientData.spo2_admission} %` : 'Not provided'} />
                                    </View>
                                    :
                                    <View style={Styles.accordionContentWrapper}>
                                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Health History</Text>
                                        <InfoRow label="Last Hopitalized" value={patientData.lastHospitalized || 'Not provided'} />
                                        
                                        {/* HIV status info/edit */}
                                        <EditGroup 
                                            fieldLabel={"HIV Status"} 
                                            fieldValue={patientData.hivStatus?.toUpperCase() as string}
                                            editLabel="Edit HIV Status:" 
                                            canEdit={hivIsEditable} 
                                        >
                                            <RadioButtonGroup
                                                options={[
                                                    { label: 'Positive', value: 'positive' },
                                                    { label: 'Negative', value: 'negative' },
                                                ]}
                                                selected={editedHivStatus as string}
                                                onSelect={setEditedHivStatus}
                                            />
                                            <Button
                                                style={{ alignSelf: 'center' }}
                                                icon='content-save-check'
                                                buttonColor={colors.primary}
                                                textColor={colors.onPrimary}
                                                mode='elevated'
                                                onPress={() => handleUpdateHivStatus()}
                                                loading={isUpdating}
                                            >
                                                Update
                                            </Button>
                                        </EditGroup>
                                        
                                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Body Measurements & Vitals</Text>
                                        <InfoRow label="Weight" value={patientData.weight ? `${patientData.weight} kg`: 'Not provided'} />
                                        <InfoRow label="MUAC" value={patientData.muac ? `${patientData.muac} mm` : 'Not provided'} />
                                        <InfoRow label="Temperature" value={patientData.temperature ? `${patientData.temperature} °C` : 'Not provided'} />
                                        <InfoRow label="Respiratory Rate" value={patientData.rrate ? `${patientData.rrate} breaths per min` : 'Not provided'} />
                                        <InfoRow label="SpO2" value={patientData.spo2_admission ? `${patientData.spo2_admission} %` : 'Not provided'} />
                                        
                                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Blantyre Coma Scale</Text>
                                        <InfoRow label="Eye movement" value={patientData.eyeMovement || 'Not provided'} />
                                        <InfoRow label="Best motor response" value={patientData.motorResponse || 'Not provided'} />
                                        <InfoRow label="Best verbal response" value={patientData.verbalResponse || 'Not provided'} />
                                    </View>
                                }
                            </List.Accordion>
                        </View>

                        {/* Medical Conditions Accordion */}
                        {/* TODO fix bug in which is other selected from admission, and we try to add TB or hiv or any othe conition from the list, 
                        the chronic illness modal pops up and HIV and tb arent ever displayed in the selecte lsit */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Common Medical Conditions"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="medical-bag"/>}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    {/* Pneumonia */}
                                    <EditGroup
                                        fieldLabel="Pneumonia"
                                        fieldValue={patientData.pneumonia || 'Not provided'}
                                        editLabel="Update Pneumonia Status:"
                                        canEdit={!patientData.isDischarged && canEditCondition(patientData.pneumonia)}
                                    >
                                        <RadioButtonGroup
                                            options={getAllowedOptions(patientData.pneumonia)}
                                            selected={editedPneumonia}
                                            onSelect={setEditedPneumonia}
                                        />
                                        <Button
                                            style={{ alignSelf: 'center' }}
                                            icon='content-save-check'
                                            buttonColor={colors.primary}
                                            textColor={colors.onPrimary}
                                            mode='elevated'
                                            onPress={() => handleUpdateMedicalCondition(
                                                'pneumonia',
                                                editedPneumonia,
                                                patientData.pneumonia || '',
                                                setEditedPneumonia
                                            )}
                                            loading={isUpdating}
                                            disabled={!editedPneumonia}
                                        >
                                            Update
                                        </Button>
                                    </EditGroup>

                                    {/* Severe Anaemia */}
                                    <EditGroup
                                        fieldLabel="Severe anaemia"
                                        fieldValue={patientData.severeAnaemia || 'Not provided'}
                                        editLabel="Update Severe Anaemia Status:"
                                        canEdit={!patientData.isDischarged && canEditCondition(patientData.severeAnaemia)}
                                    >
                                        <RadioButtonGroup
                                            options={getAllowedOptions(patientData.severeAnaemia)}
                                            selected={editedSevereAnaemia}
                                            onSelect={setEditedSevereAnaemia}
                                        />
                                        <Button
                                            style={{ alignSelf: 'center' }}
                                            icon='content-save-check'
                                            buttonColor={colors.primary}
                                            textColor={colors.onPrimary}
                                            mode='elevated'
                                            onPress={() => handleUpdateMedicalCondition(
                                                'severeAnaemia',
                                                editedSevereAnaemia,
                                                patientData.severeAnaemia || '',
                                                setEditedSevereAnaemia
                                            )}
                                            loading={isUpdating}
                                            disabled={!editedSevereAnaemia}
                                        >
                                            Update
                                        </Button>
                                    </EditGroup>

                                    {/* Diarrhea */}
                                    <EditGroup
                                        fieldLabel="Diarrhea"
                                        fieldValue={patientData.diarrhea || 'Not provided'}
                                        editLabel="Update Diarrhea Status:"
                                        canEdit={!patientData.isDischarged && canEditCondition(patientData.diarrhea, 'diarrhea')}
                                    >
                                        <RadioButtonGroup
                                            options={getAllowedOptions(patientData.diarrhea, 'diarrhea')}
                                            selected={editedDiarrhea}
                                            onSelect={setEditedDiarrhea}
                                        />
                                        <Button
                                            style={{ alignSelf: 'center' }}
                                            icon='content-save-check'
                                            buttonColor={colors.primary}
                                            textColor={colors.onPrimary}
                                            mode='elevated'
                                            onPress={() => handleUpdateMedicalCondition(
                                                'diarrhea',
                                                editedDiarrhea,
                                                patientData.diarrhea || '',
                                                setEditedDiarrhea
                                            )}
                                            loading={isUpdating}
                                            disabled={!editedDiarrhea}
                                        >
                                            Update
                                        </Button>
                                    </EditGroup>

                                    {/* Malaria */}
                                    <EditGroup
                                        fieldLabel="Malaria"
                                        fieldValue={patientData.malaria || 'Not provided'}
                                        editLabel="Update Malaria Status:"
                                        canEdit={!patientData.isDischarged && canEditCondition(patientData.malaria)}
                                    >
                                        <RadioButtonGroup
                                            options={getAllowedOptions(patientData.malaria)}
                                            selected={editedMalaria}
                                            onSelect={setEditedMalaria}
                                        />
                                        <Button
                                            style={{ alignSelf: 'center' }}
                                            icon='content-save-check'
                                            buttonColor={colors.primary}
                                            textColor={colors.onPrimary}
                                            mode='elevated'
                                            onPress={() => handleUpdateMedicalCondition(
                                                'malaria',
                                                editedMalaria,
                                                patientData.malaria || '',
                                                setEditedMalaria
                                            )}
                                            loading={isUpdating}
                                            disabled={!editedMalaria}
                                        >
                                            Update
                                        </Button>
                                    </EditGroup>

                                    {/* Sepsis */}
                                    <EditGroup
                                        fieldLabel="Sepsis"
                                        fieldValue={patientData.sepsis || 'Not provided'}
                                        editLabel="Update Sepsis Status:"
                                        canEdit={!patientData.isDischarged && canEditCondition(patientData.sepsis)}
                                    >
                                        <RadioButtonGroup
                                            options={getAllowedOptions(patientData.sepsis)}
                                            selected={editedSepsis}
                                            onSelect={setEditedSepsis}
                                        />
                                        <Button
                                            style={{ alignSelf: 'center' }}
                                            icon='content-save-check'
                                            buttonColor={colors.primary}
                                            textColor={colors.onPrimary}
                                            mode='elevated'
                                            onPress={() => handleUpdateMedicalCondition(
                                                'sepsis',
                                                editedSepsis,
                                                patientData.sepsis || '',
                                                setEditedSepsis
                                            )}
                                            loading={isUpdating}
                                            disabled={!editedSepsis}
                                        >
                                            Update
                                        </Button>
                                    </EditGroup>

                                    {/* Meningitis/Encephalitis */}
                                    <EditGroup
                                        fieldLabel="Meningitis/Encephalitis"
                                        fieldValue={patientData.meningitis_encephalitis || 'Not provided'}
                                        editLabel="Update Meningitis/Encephalitis Status:"
                                        canEdit={!patientData.isDischarged && canEditCondition(patientData.meningitis_encephalitis)}
                                    >
                                        <RadioButtonGroup
                                            options={getAllowedOptions(patientData.meningitis_encephalitis)}
                                            selected={editedMeningitis}
                                            onSelect={setEditedMeningitis}
                                        />
                                        <Button
                                            style={{ alignSelf: 'center' }}
                                            icon='content-save-check'
                                            buttonColor={colors.primary}
                                            textColor={colors.onPrimary}
                                            mode='elevated'
                                            onPress={() => handleUpdateMedicalCondition(
                                                'meningitis_encephalitis',
                                                editedMeningitis,
                                                patientData.meningitis_encephalitis || '',
                                                setEditedMeningitis
                                            )}
                                            loading={isUpdating}
                                            disabled={!editedMeningitis}
                                        >
                                            Update
                                        </Button>
                                    </EditGroup>

                                    {/* Chronic Conditions */}
                                    <EditGroup
                                        fieldLabel="Chronic Conditions"
                                        fieldValue={formatChronicIllness(patientData.chronicIllnesses) || 'Not provided'}
                                        editLabel="Update Chronic Conditions Status:"
                                        canEdit={!patientData.isDischarged}
                                    >
                                       <CheckboxGroup 
                                            options={[
                                                {label: 'HIV', value: 'HIV'},
                                                {label: 'Tuberculosis', value: 'Tuberculosis'},
                                                {label: 'Sickle cell anaemia', value: 'sickle cell anaemia'},
                                                {label: 'Social vulnerability/Extreme poverty', value: 'extreme poverty'},
                                                {label: 'Unsure', value: 'unsure'},
                                                {label: 'None', value: 'none'},
                                                {label: 'Other', value: 'other'}
                                            ]} 
                                            selected={editedChronicIllness.length > 0 ? editedChronicIllness : (patientData.chronicIllnesses || [])} 
                                            onSelectionChange={handleChronicIllnessChange}
                                        />
                                        <Button
                                            style={{ alignSelf: 'center' }}
                                            icon='content-save-check'
                                            buttonColor={colors.primary}
                                            textColor={colors.onPrimary}
                                            mode='elevated'
                                            onPress={handleUpdateChronicIllness}
                                            loading={isUpdating}
                                            disabled={editedChronicIllness.length === 0}
                                        >
                                            Update
                                        </Button>
                                    </EditGroup>

                                    {/* Other Chronic Illness - Show if 'other' is selected OR already has value */}
                                    {(editedChronicIllness.includes('other') || otherChronicIllnessSelected) && (
                                        <View style={{ marginTop: 10 }}>

                                             {/* Add new illness form */}
                                            {!patientData.isDischarged && (
                                                <EditGroup
                                                    fieldLabel="Other Conditions"
                                                    fieldValue=""
                                                    editLabel="Enter one or multiple conditions (separate with commas):"
                                                    canEdit={true}
                                                >
                                                    <TextInput
                                                        label="Other chronic condition(s)"
                                                        placeholder="Enter condition"
                                                        mode="outlined"
                                                        value={editedOtherChronicIllness}
                                                        onChangeText={setEditedOtherChronicIllness}
                                                        style={[Styles.textInput, { marginTop: 10 }]}
                                                        multiline
                                                        numberOfLines={2}
                                                    />
                                                    <Button
                                                        style={{ alignSelf: 'center', marginTop: 10 }}
                                                        icon='plus'
                                                        buttonColor={colors.primary}
                                                        textColor={colors.onPrimary}
                                                        mode='elevated'
                                                        onPress={handleUpdateOtherChronicIllness}
                                                        loading={isUpdating}
                                                        disabled={!editedOtherChronicIllness?.trim()}
                                                    >
                                                        Add Condition
                                                    </Button>
                                                </EditGroup>
                                            )}
                                            
                                            {/* Display list of other chronic illnesses */}
                                            {getOtherChronicIllnessList(patientData.otherChronicIllness).length > 0 ? (
                                                <View style={{ 
                                                    backgroundColor: '#f5f5f5', 
                                                    padding: 12, 
                                                    borderRadius: 8,
                                                    marginBottom: 12 
                                                }}>
                                                    {getOtherChronicIllnessList(patientData.otherChronicIllness).map((illness, index) => (
                                                        <View 
                                                            key={index} 
                                                            style={{ 
                                                                flexDirection: 'row', 
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                paddingVertical: 6,
                                                                borderBottomWidth: index < getOtherChronicIllnessList(patientData.otherChronicIllness).length - 1 ? 1 : 0,
                                                                borderBottomColor: '#e0e0e0'
                                                            }}
                                                        >
                                                            <Text style={{ flex: 1, fontSize: 15 }}>• {illness}</Text>
                                                            {!patientData.isDischarged && (
                                                                <TouchableOpacity
                                                                    onPress={() => handleRemoveOtherChronicIllness(illness)}
                                                                    style={{ 
                                                                        padding: 4,
                                                                        marginLeft: 8
                                                                    }}
                                                                >
                                                                    <Text style={{ color: '#f44336', fontSize: 18 }}>✕</Text>
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    ))}
                                                </View>
                                            ) : (
                                                <Text style={{ 
                                                    fontSize: 14, 
                                                    color: '#666', 
                                                    fontStyle: 'italic',
                                                    marginBottom: 12 
                                                }}>
                                                    No other chronic illnesses recorded
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </List.Accordion>
                        </View>

                        {/* VHT Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="CHW Referral"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="doctor"/>}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    {/* TODO */}
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Caregiver Contact Accordion*/}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Caregiver Contact Information"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="account-child"/>}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    {/* TODO */}
                                </View>
                            </List.Accordion>
                        </View>
                    </View>

                    {/* Pagination controls */}
                    <Button 
                        style={[{ alignSelf: 'center'}]}
                        buttonColor={colors.primary} 
                        textColor={colors.onPrimary} 
                        icon= 'account-group'
                        mode="elevated" 
                        onPress={() => {
                            clearPatientData();
                            router.back();
                        }} 
                    >
                        Patient Records
                    </Button>
                </ScrollView>
            </SafeAreaView>
        );
    }
}