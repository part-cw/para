import { EditGroup } from "@/src/components/EditFieldGroup";
import RadioButtonGroup from "@/src/components/RadioButtonGroup";
import RiskCard from "@/src/components/RiskCard";
import { CaregiverContactSection } from "@/src/components/sections/CaregiverContactSection";
import { MedicalConditionsSection } from "@/src/components/sections/EditableMedicalConditions";
import { VHTReferralSection } from "@/src/components/sections/VhtReferralSection";
import { PatientData } from "@/src/contexts/PatientData";
import { usePatientData } from "@/src/contexts/PatientDataContext";
import { useStorage } from "@/src/contexts/StorageContext";
import { displayNames } from "@/src/forms/displayNames";
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from "@/src/utils/ageCalculator";
import { calculateWAZ } from "@/src/utils/clinicalVariableCalculator";
import { displayDob, formatDateString, formatName } from "@/src/utils/formatUtils";
import { convertToYesNo, normalizeBoolean } from "@/src/utils/normalizer";
import { computeAdmissionRiskUpdated } from "@/src/utils/riskHelpers";
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
        admissionLastCalculated,
        loadPatient, 
        calculateAdmissionRiskWithData, 
        clearPatientData,
        updatePatientData
    } = usePatientData();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editedDOB, setEditedDob] = useState<Date | null>(null);
    const [pendingDobUpdates, setPendingDobUpdates] = useState<Partial<PatientData> | null>(null);
    const [editedHivStatus, setEditedHivStatus] = useState<string | undefined>('');
    
    const [showNeonatalJaundiceModal, setShowNeonatalJaundiceModal] = useState(false);
    const [neonatalJaundiceValue, setNeonatalJaundiceValue] = useState<string>('');

    const params = useLocalSearchParams();
    const patientId = params.patientId as string;

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
        // calculate new age values - use admission start time for age calculation 
        const admissionDate = new Date(patientData.admissionStartedAt as string);
        const newAgeInMonths = AgeCalculator.calculateAgeInMonthsAtAdmission(editedDOB as Date, admissionDate);
        const newAgeInDays = editedDOB && AgeCalculator.getAgeInDaysAtAdmission(editedDOB, admissionDate);
        
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
            ...(normalizeBoolean(previous.isDOBUnknown) !== false && {isDOBUnknown: false} ),
            ...(normalizeBoolean(previous.isYearMonthUnknown) !== false && {isYearMonthUnknown: false}),
            ...(previous.isNeonate !== newIsNeonate && {isNeonate: newIsNeonate}),
            ...(!newIsNeonate && previous.neonatalJaundice !== undefined && {neonatalJaundice: undefined}), // if new isNeonate false, set previous jaundice to null or undefined
            ...(previous.sickYoungInfant !== newIsSickYoungInfant && {sickYoungInfant: newIsSickYoungInfant})
        };

        setIsUpdating(true);
        await storage.doBulkUpdate(patientId, updates, previous);
        setIsUpdating(false);

        // check if all neonatal info needs to be filled
        // if newIsNeonate is true AND different from previous, open jaundice modal
        if (newIsNeonate && (newIsNeonate !== previous.isNeonate)) {
            setPendingDobUpdates(updates);
            setNeonatalJaundiceValue('') // clear any prevous value
            setShowNeonatalJaundiceModal(true);
            return;
        } 

        // if no changes to neonate status, proceed with risk calculations
        await proceedWithRiskRecalculation(updates);
        await onRefresh();
    }

    const handleSaveNeonatalJaundice = async () => {
        if (!neonatalJaundiceValue) {
            Alert.alert('Required', 'Please select a value for neonatal jaundice');
            return;
        }

        try {
            const prevJaundice = patientData?.neonatalJaundice as string;
            const jaundiceUpdate = { neonatalJaundice: neonatalJaundiceValue };

            // Update neonatal jaundice in storage
            setIsUpdating(true);
            await storage.updatePatient(patientId, jaundiceUpdate);
            await storage.logChanges(patientId, 'UPDATE', 'neonatalJaundice', prevJaundice, (neonatalJaundiceValue === 'yes' ? '1' : '0'));
            setIsUpdating(false);

            setShowNeonatalJaundiceModal(false);
            setEditedDob(editedDOB);

            // Merge neonatal jaundice with pending DOB updates (if any)
            const allUpdates = {
                ...pendingDobUpdates, 
                ...jaundiceUpdate 
            };
            
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
        setRecalculating(true);

        try {
            const dataForCalculation = 
                updates ? { ...patientData, ...updates }: patientData;

            const admissionRisk = calculateAdmissionRiskWithData(dataForCalculation);
            admissionRisk && await storage.saveRiskPrediction(patientId, admissionRisk, 'admission');
        } catch (error) {
            console.error('Error recalculating risk:', error);
            Alert.alert('Error', 'Failed to recalculate risk');
        } finally {
            setRecalculating(false); 
            await onRefresh();   
        }
    }

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
        const hivIsEditable = !patientData.isDischarged && (patientData.hivStatus === 'unknown');
        const ageIsEditable = !patientData.isDischarged && ((patientData.isDOBUnknown) || (!patientData.isDOBUnknown && patientData.isYearMonthUnknown));
        const normalizedIsNeonate = patientData.isNeonate && normalizeBoolean(patientData.isNeonate);
        const isDischarged = normalizeBoolean(patientData.isDischarged as boolean) === true;
        const isAdmissionRiskUpdated = computeAdmissionRiskUpdated(patientData.admissionCompletedAt, admissionLastCalculated)

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

                                {isAdmissionRiskUpdated
                                    ?
                                    <Text style={[Styles.modalText, {paddingHorizontal: 20, fontStyle: 'italic'}]}>
                                        Risk last updated {new Date(admissionLastCalculated).toDateString()} 
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
                                    
                                    <InfoRow label="Est. Age" value={`${AgeCalculator.formatAge(patientData.ageInMonths)} old`} />
                                    <InfoRow label="Under 6 months" value={patientData.isUnderSixMonths ? 'Yes' : 'No'} />
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Admission Clinical Info Accordion */}
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

                        {/* Discharge Data Accordion */}
                        {isDischarged && 
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Discharge Data"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="transit-transfer"/>}
                                description={'Read-only'}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <InfoRow label="Feeding Status" value={patientData.feedingStatus_discharge ? patientData.feedingStatus_discharge : 'Not provided'} />
                                    <InfoRow label="SpO₂ at Discharge" value={patientData.spo2_discharge ? `${patientData.spo2_discharge} %` : 'Not provided'} />
                                    <InfoRow label="Discharge Reason" value={patientData.dischargeStatus ? `${patientData.dischargeStatus}`: 'Not provided'} />
                                </View>
                            </List.Accordion>
                        </View>
                        }

                        {/* Medical Conditions Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Common Medical Conditions"
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

                        {/* VHT Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="CHW Referral"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="doctor"/>}
                                description={isDischarged ? 'Read-only' : ''}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    {!isDischarged
                                        ?
                                        <VHTReferralSection
                                            village={patientData.village}
                                            subvillage={patientData.subvillage}
                                            vhtName={patientData.vhtName}
                                            vhtTelephone={patientData.vhtTelephone}
                                            onUpdate={updatePatientData}
                                            colors={colors}
                                            mode="admission"
                                            showClearButton={true}
                                            showHeader={false}
                                        />
                                        :
                                        <>
                                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Patient Address</Text>
                                            <InfoRow label="Village" value={patientData.village || 'Not provided'} />
                                            <InfoRow label="Subvillage" value={patientData.subvillage || 'Not provided'} />
                                            
                                            <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>CHW Contact Information</Text>
                                            <InfoRow label="Name" value={patientData.vhtName || 'Not provided'} />
                                            <InfoRow label="Telephone" value={patientData.vhtTelephone || 'Not provided'} />
                                        </>
                                    }
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Caregiver Contact Accordion*/}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Caregiver Contact Information"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="account-child"/>}
                                description={isDischarged ? 'Read-only' : ''}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    {!isDischarged
                                        ?
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
                                        :
                                        <>
                                            <InfoRow label="Head of Household" value={patientData.caregiverName || 'Not provided'} />
                                            <InfoRow label="Telephone" value={patientData.caregiverTel || 'Not provided'} />
                                            {(patientData.caregiverTel !== '') &&
                                                <>
                                                    <InfoRow label="Telephone belongs to caregiver" value={patientData.isCaregiversPhone ? 'Yes' : 'No'} />
                                                    <InfoRow label="Receive reminders" value={patientData.sendReminders ? 'Yes' : 'No'} />
                                                </>
                                            }
                                        </>
                                    }
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