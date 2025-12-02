import { MedicalConditionsSection } from "@/src/components/sections/EditableMedicalConditions";
import { usePatientData } from "@/src/contexts/PatientDataContext";
import { useStorage } from "@/src/contexts/StorageContext";
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from "@/src/utils/ageCalculator";
import { formatName } from "@/src/utils/formatUtils";
import { convertToYesNo } from "@/src/utils/normalizer";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, List, Text, useTheme } from "react-native-paper";
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

    if (patientData) {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: colors.background, marginTop: -50}}>
                <ScrollView 
                    contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0, paddingBottom: 20}}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/> }
                >
                    <View style={{margin: 15}}>
                        {/* Patient Info Card */}
                        <View style={Styles.accordionListWrapper}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                <List.Icon icon="chart-areaspline" color={colors.primary} />
                                <Text style={Styles.cardTitle}>Patient Information</Text>
                            </View>
                            <View style={Styles.accordionContentWrapper}>
                                <InfoRow label="Full Name" value={formatName(patientData.firstName, patientData.surname, patientData.otherName)} />
                                <InfoRow label="Sex" value={patientData.sex} />                                    
                                <InfoRow label="Age" value={`${AgeCalculator.formatAge(patientData.ageInMonths)} old`} />
                                <InfoRow label="Under 6 months" value={patientData.isUnderSixMonths ? 'Yes' : 'No'} />
                            </View>
                        </View>

                        {/* Discharge Data Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Discharge Data"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="heart-pulse"/>}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <InfoRow label="Feeding well" value={convertToYesNo(patientData.feedingWell_discharge as boolean)} />
                                    <InfoRow label="Discharge SpO₂" value={patientData.spo2_discharge ? `${patientData.spo2_discharge} %` : 'Not provided'} />
                                    <InfoRow label="Discharge Reason" value={patientData.dischargeReason ? `${patientData.dischargeReason}`: 'Not provided'} />
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Medical Conditions Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Review Medical Conditions"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="medical-bag"/>}
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
                                title="Review CHW Information"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="doctor"/>}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>Patient Address</Text>
                                    <InfoRow label="Village" value={patientData.village || 'Not provided'} />
                                    <InfoRow label="Subvillage" value={patientData.subvillage || 'Not provided'} />
                                    
                                    <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary, marginTop: 5}}>CHW Contact Information</Text>
                                    <InfoRow label="Name" value={patientData.vhtName || 'Not provided'} />
                                    <InfoRow label="Telephone" value={patientData.vhtTelephone || 'Not provided'} />
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Caregiver Contact Accordion*/}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Review Caregiver Contact Information"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="account-child"/>}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <InfoRow label="Head of Household" value={patientData.caregiverName || 'Not provided'} />
                                    <InfoRow label="Telephone" value={patientData.caregiverTel || 'Not provided'} />
                                    {(patientData.caregiverTel !== '') &&
                                        <>
                                            <InfoRow label="Telephone belongs to caregiver" value={patientData.isCaregiversPhone ? 'Yes' : 'No'} />
                                            <InfoRow label="Receive reminders" value={patientData.sendReminders ? 'Yes' : 'No'} />
                                        </>
                                    }
                                </View>
                            </List.Accordion>
                        </View>
                    </View>

                    {/* Discharge controls */}
                    <Button 
                        style={[{ alignSelf: 'center'}]}
                        buttonColor={colors.primary} 
                        textColor={colors.onPrimary} 
                        icon= 'account-group'
                        mode="elevated" 
                        onPress={() => {
                            // TODO - don't allow submit if missing required vht and caregiver contact info
                            // clearPatientData();
                            // router.push('../riskDisplay);
                        }} 
                    >
                        Complete Discharge
                    </Button>
                </ScrollView>
            </SafeAreaView>
        );
    }
}