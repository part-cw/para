import { EditFieldGroup } from "@/src/components/EditFieldGroup";
import RadioButtonGroup from "@/src/components/RadioButtonGroup";
import { PatientData } from "@/src/contexts/PatientData";
import { useStorage } from "@/src/contexts/StorageContext";
import { displayNames } from "@/src/forms/displayNames";
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from "@/src/utils/ageCalculator";
import { displayDob, formatChronicIllness, formatName } from "@/src/utils/formatUtils";
import { convertToYesNo } from "@/src/utils/normalizer";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, RefreshControl, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, List, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";



export default function EditPatientRecord() {
    const { storage } = useStorage();
    const { colors } = useTheme()

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [patient, setPatient] = useState<PatientData | null>(null);
    
    const [showHivEdit, setShowHivEdit] = useState(false);
    const [editedHivStatus, setEditedHivStatus] = useState<string | undefined>('');
    const [riskUpdated, setRiskUpdated] = useState(false);

    const params = useLocalSearchParams();
    const patientId = params.patientId as string;

    // load patient data on mount  
    useEffect(() => {
        loadPatientData();
    }, []);


    const loadPatientData = async () => {
    try {
        setLoading(true)
        
        const data = await storage.getPatient(patientId);
        setPatient(data);
        // setEditedHivStatus(data?.hivStatus);
        
        console.log(`📋 Loaded patient ${patientId} data`);
    } catch (error) {
        console.error('Error loading patient data:', error);
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

    const handleUpdateHivStatus = () => {
        console.log('inside handle edit')
        const confirmUpdate = async () => {
            console.log('updating hiv status to ', editedHivStatus)
            const prev = patient?.hivStatus

            setIsUpdating(true);
            
            // update hivStatus in storage
            await storage.updatePatient(patientId, {hivStatus: editedHivStatus})
            await storage.logChanges(patientId, 'UPDATE', 'hivStatus', prev as string, editedHivStatus as string)

            // recalculate risk
            setRecalculating(true);
            // TODO call risk calcucaltion funvtion
            // show snackbar (with timer?)
            
            setRecalculating(false);
            setIsUpdating(false);
            setShowHivEdit(false);
            await onRefresh();
        }

        if (Platform.OS !== 'web') {
            Alert.alert(
                '⚠️ Warning',
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

    const InfoRow = ({ label, value }: { label: string; value: string | string[] }) => (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', flex: 1, fontSize: 16 }}>{label}:</Text>
            <Text style={{ flex: 2, fontSize: 16 }}>{value || 'Not provided'}</Text>
        </View>
    );


    // retrurns a loading screen with spinner
    if (loading) {
        return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16 }}>Loading patient record...</Text>
        </SafeAreaView>
        );
    }

    if (patient) {
        const otherChronicIllnessSelected = patient.chronicIllnesses?.includes('other');
        const hivIsEditable = patient.hivStatus === 'unknown';
        const ageIsEditable = !patient.dob || (!patient.birthYear && !patient.birthMonth);

        return (
            <SafeAreaView style={{flex: 1, backgroundColor: colors.background, marginTop: -50}}>
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
                                {formatName(patient.firstName, patient.surname, patient.otherName).toUpperCase()}
                            </Text>
                            <Text style={[Styles.pageHeaderTitle, { flex: 0} ]}>
                                Review Profile
                            </Text>
                            
                        </View>
                    </View>

                    {/* Patient Info Accordion */}
                    <View style={{margin: 15}}>
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Patient Information"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="account"/>}
                                description={ageIsEditable ? 'DOB can be edited' : 'Read only'}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <InfoRow label="Full Name" value={formatName(patient.firstName, patient.surname, patient.otherName)} />
                                    <InfoRow label="Sex" value={patient.sex} />
                                    
                                    {/* Age information */}
                                    <EditFieldGroup 
                                        fieldLabel={"DOB"} 
                                        fieldValue={displayDob(patient.dob?.toISOString(), patient.birthYear, patient.birthMonth)}
                                        editLabel="Edit Age Information" 
                                        canEdit={ageIsEditable} 
                                    >
                                        <Text>Blah TODO </Text>
                                    </EditFieldGroup>
                                    
                                    <InfoRow label="Age" value={`${AgeCalculator.formatAge(patient.ageInMonths)} old`} />
                                    <InfoRow label="Under 6 months" value={patient.isUnderSixMonths ? 'Yes' : 'No'} />
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Clinical Info Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Admission Clinical Data"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="heart-pulse"/>}
                                description={hivIsEditable ? 'HIV status editable' : 'Read-only'}
                            >
                                {
                                    patient.isUnderSixMonths
                                    ?
                                    <View style={Styles.accordionContentWrapper}>
                                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Health History & Observations</Text>
                                        <InfoRow label={displayNames['illnessDuration']} value={patient.illnessDuration || 'Not provided'} />
                                        {patient.isNeonate && <InfoRow label="Neonatal Jaundice" value={convertToYesNo(patient.neonatalJaundice as string)} />}
                                        <InfoRow label="Bugling fontanelle" value={convertToYesNo(patient.bulgingFontanelle as string)} />
                                        <InfoRow label="Feeding well" value={convertToYesNo(patient.feedingWell as string)} />
                                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Body Measurements & Vitals</Text>
                                        <InfoRow label="Weight" value={patient.weight ? `${patient.weight} kg`: 'Not provided'} />
                                        <InfoRow label="MUAC" value={patient.muac ? `${patient.muac} mm` : 'Not provided'} />
                                        <InfoRow label="SpO₂" value={patient.spo2_admission ? `${patient.spo2_admission} %` : 'Not provided'} />
                                    </View>
                                    :
                                    <View style={Styles.accordionContentWrapper}>
                                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Health History</Text>
                                        <InfoRow label="Last Hopitalized" value={patient.lastHospitalized || 'Not provided'} />
                                        
                                        {/* HIV status info/edit */}
                                        <EditFieldGroup 
                                            fieldLabel={"HIV Status"} 
                                            fieldValue={patient.hivStatus?.toUpperCase() as string}
                                            editLabel="Edit HIV Status:" 
                                            canEdit={patient.hivStatus === 'unknown'} 
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
                                        </EditFieldGroup>
                                        
                                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Body Measurements & Vitals</Text>
                                        <InfoRow label="Weight" value={patient.weight ? `${patient.weight} kg`: 'Not provided'} />
                                        <InfoRow label="MUAC" value={patient.muac ? `${patient.muac} mm` : 'Not provided'} />
                                        <InfoRow label="Temperature" value={patient.temperature ? `${patient.temperature} °C` : 'Not provided'} />
                                        <InfoRow label="Respiratory Rate" value={patient.rrate ? `${patient.rrate} breaths per min` : 'Not provided'} />
                                        <InfoRow label="SpO2" value={patient.spo2_admission ? `${patient.spo2_admission} %` : 'Not provided'} />
                                        
                                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Blantyre Coma Scale</Text>
                                        <InfoRow label="Eye movement" value={patient.eyeMovement || 'Not provided'} />
                                        <InfoRow label="Best motor response" value={patient.motorResponse || 'Not provided'} />
                                        <InfoRow label="Best verbal response" value={patient.verbalResponse || 'Not provided'} />
                                    </View>
                                }
                            </List.Accordion>
                        </View>


                        {/* Medical Conditions Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Common Medical Conditions"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="medical-bag"/>}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <InfoRow label="Pneumonia" value={patient.pneumonia || 'Not provided'} />
                                    <InfoRow label="Severe anaemia" value={patient.severeAnaemia || 'Not provided'} />
                                    <InfoRow label="Diarrhea" value={patient.diarrhea || 'Not provided'} />
                                    <InfoRow label="Malaria" value={patient.malaria ||'Not provided' } />
                                    <InfoRow label="Sepsis" value={patient.sepsis|| 'Not provided'} />
                                    <InfoRow label="Meningitis/ Encephalitis" value={patient.meningitis_encephalitis || 'Not provided'} />
                                    <InfoRow label="Chronic Conditions" value={formatChronicIllness(patient.chronicIllnesses) || 'Not provided'} />
                                    {otherChronicIllnessSelected && 
                                        <InfoRow label="Other chronic illness" value={patient.otherChronicIllness || 'Not provided'} />
                                    }
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

                        {/* Risk Predictions Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Risk Predictions"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="chart-areaspline"/>}
                                description={'Read-only'}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    {/* TODO - show admission and discharge or only most recent? */}
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Careplan Accordion*/}
                        {/* <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Careplan Recommendations"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="clipboard-list"/>}
                                description={'Read-only'}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                </View>
                            </List.Accordion>
                        </View> */}
                    </View>

                    {/* Pagination controls */}
                    <Button 
                        style={[{ alignSelf: 'center'}]}
                        buttonColor={colors.primary} 
                        textColor={colors.onPrimary} 
                        icon= 'account-group'
                        mode="elevated" 
                        onPress={() => router.back()} // make sure it persists the changes made to patiennt
                    >
                        Patient Records
                    </Button>
                </ScrollView>
            </SafeAreaView>
        );
    }
}