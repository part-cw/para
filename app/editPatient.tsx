import { PatientData } from "@/src/contexts/PatientData";
import { useStorage } from "@/src/contexts/StorageContext";
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { formatName } from "@/src/utils/formatUtils";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, List, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";



export default function EditPatientRecord() {
    const { storage } = useStorage();
    const { colors } = useTheme()

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [patientData, setPatientData] = useState<PatientData | null>(null);

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
        setPatientData(data);
        // console.log('!!!patietn data', patientData) 
        
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


  // retrurns a loading screen with spinner
    if (loading) {
        return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16 }}>Loading patient record...</Text>
        </SafeAreaView>
        );
    }

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
                        maxWidth: '90%',
                        }}
                    >
                        <Text style={[Styles.pageHeaderTitle, {flex: 0, color: colors.primary}]}>
                            {formatName(patientData?.firstName as string, patientData?.surname as string).toUpperCase()}
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
                        >
                            <View style={Styles.accordionContentWrapper}>
                                {/* <InfoRow label="Full Name" value={`${patientData.firstName} ${patientData.otherName} ${patientData.surname}`.trim()} />
                                <InfoRow label="Sex" value={patientData.sex} />
                                <InfoRow label="DOB/Age" value={formatAge()} />
                                <InfoRow label="Under 6 months" value={patientData.isUnderSixMonths ? 'Yes' : 'No'} /> */}
                            </View>
                        </List.Accordion>
                    </View>

                    {/* Clinical Info Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Admission Clinical Data"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="heart-pulse"/>}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                   {/* TODO */}
                                </View>
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
                                {/* TODO */}
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
                        >
                            <View style={Styles.accordionContentWrapper}>
                                {/* TODO - show admission and discharge or only most recent? */}
                            </View>
                        </List.Accordion>
                    </View>

                    {/* Careplan Accordion*/}
                    <View style={Styles.accordionListWrapper}>
                        <List.Accordion
                            title="Careplan Recommendations"
                            titleStyle={Styles.accordionListTitle}
                            left={props => <List.Icon {...props} icon="clipboard-list"/>}
                        >
                            <View style={Styles.accordionContentWrapper}>
                                {/* TODO - show admission and discharge or only most recent? */}
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
                    onPress={() => router.back()} // make sure it persists the changes made to patiennt
                >
                    Patient Records
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
}