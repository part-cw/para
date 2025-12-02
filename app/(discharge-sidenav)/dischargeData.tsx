import RadioButtonGroup from "@/src/components/RadioButtonGroup";
import SearchableDropdown from "@/src/components/SearchableDropdown";
import ValidatedTextInput, { INPUT_TYPES } from "@/src/components/ValidatedTextInput";
import { usePatientData } from "@/src/contexts/PatientDataContext";
import { useStorage } from "@/src/contexts/StorageContext";
import { displayNames } from "@/src/forms/displayNames";
import { spo2DischargeInfo } from "@/src/forms/infoText";
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { validateOxygenSaturationRange } from "@/src/utils/clinicalVariableCalculator";
import { formatName } from "@/src/utils/formatUtils";
import { convertToYesNo } from "@/src/utils/normalizer";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, RefreshControl, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Card, IconButton, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

    // allow edit medical conditions
    // add VHT and caregiver info if not already complete  
    // collect discharge variables
    // calculate risk prediction & update risk assessment with discharge calc
    // go to risk display - have buttons to go back to records 
    
export default function DischargeDataScreen() {
    const { colors } = useTheme()
    const { storage } = useStorage();
    const { 
        patientData, 
        riskAssessment, 
        loadPatient, 
        calculateAdmissionRiskWithData, 
        clearPatientData,
        updatePatientData
    } = usePatientData();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const params = useLocalSearchParams();
    const patientId = params.patientId as string;

    console.log('isdiahchage', patientData.isDischarged)

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
            <Text style={{ marginTop: 16 }}>Navigating to discharge workflow...</Text>
        </SafeAreaView>
        );
    }

    if (patientData) {
    
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
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
                                    This information will be used to recalculate the risk prediction. 
                                </Text>
                            </Card.Content> 
                        </Card>

                        {/* Discharge Data Info*/}
                        <View style={Styles.accordionListWrapper}>
                            <View style={Styles.accordionContentWrapper}>
                                <SearchableDropdown 
                                    data={[
                                        {value: 'Deceased', key: 'op'},
                                        {value: 'Deceased', key: 'two'},
                                        {value: 'Deceased', key: 'dama'},
                                        {value: 'Deceased', key: 'deceased'},
                                    ]} 
                                    label={"Discharge Reason (required)"} 
                                    placeholder='select option below'
                                    onSelect={(item) => updatePatientData({ dischargeReason: item.value })}
                                    search={false}
                                    value= {patientData.dischargeReason}
                                    style={{paddingTop: 20}}
                                />

                                <View>
                                    <Text style={[Styles.accordionSubheading, {fontWeight: 'bold'}]}>Feeding Status <Text style={Styles.required}>*</Text></Text>
                                    <Text>{displayNames['feedingStatusQuestion']}</Text>
                                    <RadioButtonGroup 
                                        options={[
                                            { label: 'Yes', value: 'yes'},
                                            { label: 'No', value: 'no'},]} 
                                        selected={convertToYesNo(patientData.feedingWell_discharge as boolean)} 
                                        onSelect={(value) => updatePatientData({ feedingWell_discharge: value })}
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
                                    customErrorMessage={patientData.spo2_discharge && validateOxygenSaturationRange(spo2).errorMessage } 
                                    right={<TextInput.Affix text="%" />}                             
                                />
                            </View>
                        </View>
                    </View>

                    {/* Pagination controls */}
                    {/* <Button 
                        style={[{ alignSelf: 'center'}]}
                        buttonColor={colors.primary} 
                        textColor={colors.onPrimary} 
                        icon= 'account-group'
                        mode="elevated" 
                        onPress={() => {
                            // clearPatientData();
                            // router.back();
                        }} 
                    >
                        Next
                    </Button> */}
                </ScrollView>
            </SafeAreaView>
        );
    }
}