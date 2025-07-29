import DebugStack from '@/components/DebugStack';
import PaginationButton from '@/components/PaginationButton';
import { GlobalStyles as Styles } from '@/themes/styles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { Dropdown } from 'react-native-paper-dropdown';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function MedicalConditionsScreen() {
    const { colors } = useTheme();
    
    const [ anaemia, setAnaemia ] = useState<string>();
    const [ pneumonia, setPneumonia ] = useState<string>();
    const [ chronicIllness, setChronicIllness ] = useState<string>();
    const [ acuteDiarrhea, setAcuteDiarrhea ] = useState<string>();
    const [ malaria, setMalaria ] = useState<string>();
    const [ sepsis, setSepsis ] = useState<string>();
    const [ meningitis, setMeningitis ] = useState<string>();

    const diagnosisOptions = [
        { label: 'Yes - positive diagnosis', value: 'yes'},
        { label: 'No - negative diagnosis', value: 'no'},
        { label: 'Suspected', value: 'suspected'},
        { label: 'Unsure', value: 'unsure'},
    ]

    const simplifiedOptions = [
        { label: 'Yes', value: 'yes'},
        { label: 'No', value: 'no'},
    ]
  
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <DebugStack/>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
                <Card style={Styles.cardWrapper}>
                    <Card.Content>
                        <Text variant="bodyMedium">
                            Indicate whether the patient is confirmed to have, suspected to have, 
                            or does not have any of the following common medical conditions. 
                            If a <Text style={{ fontWeight: 'bold' }}>diagnosis is unclear and no testing</Text> has been done, select 
                            ‘unsure’ where applicable</Text>
                    </Card.Content>
                </Card>
                
                <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                    <TextInput 
                        label="Malnutrition Status" 
                        mode="flat" 
                        value="eg Severe Malnutrition - from WAZ"
                        style={{flex: 1}}
                        disabled />
                    <IconButton
                        icon="help-circle-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => {
                        // TODO - use tooltip instead of alert message
                        // tooltip package: https://www.npmjs.com/package/react-native-walkthrough-tooltip
                        alert('Malnutrition status is based on WAZ scores calculated from body weight entered on the previous page');
                        }}
                    />
                </View>
                
               <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                    <TextInput 
                        label="Sick young infant" 
                        mode="flat" 
                        value="eg Not applicable"
                        style={{flex: 1}}
                        disabled />
                    <IconButton
                        icon="help-circle-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => {
                        // TODO - use tooltip instead of alert message
                        // tooltip package: https://www.npmjs.com/package/react-native-walkthrough-tooltip
                        alert("Applies to infants less than 28 days old. \nAutomatically determined based on patient's age");
                        }}
                    />
                </View>
                
                <Dropdown 
                    label = {'Pneumonia'}
                    mode = {'outlined'}
                    options = {diagnosisOptions}
                    value = {pneumonia}
                    onSelect = {setPneumonia}
                    hideMenuHeader = {Platform.OS === 'web'}
                    menuContentStyle={{backgroundColor: colors.secondary}}
                />
                <Dropdown 
                    label = {'Severe anaemia'}
                    mode = {'outlined'}
                    options = {diagnosisOptions}
                    value = {anaemia}
                    onSelect={setAnaemia}
                    menuContentStyle={{backgroundColor: colors.secondary}}
                    hideMenuHeader = {Platform.OS === 'web'}

                />

                <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={{flex: 1}}>
                        <Dropdown 
                            label = {'Chronic illnesses'}
                            mode = {'outlined'}
                            options = {diagnosisOptions}
                            value = {chronicIllness}
                            onSelect = {setChronicIllness}
                            menuContentStyle={{backgroundColor: colors.secondary}}
                            hideMenuHeader = {Platform.OS === 'web'}
/>
                    </View>
                    <IconButton
                        icon="help-circle-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => {
                        // TODO - use tooltip instead of alert message
                        // tooltip package: https://www.npmjs.com/package/react-native-walkthrough-tooltip
                        alert('Chronic illnesses include genetic/congenital diseases, sickle cell anemia, HIV, and TB');
                        }}
                    />
                </View>
                <Dropdown 
                    label = {'Acute diarrhea'}
                    mode = {'outlined'}
                    options = {simplifiedOptions}
                    value = {acuteDiarrhea}
                    onSelect = {setAcuteDiarrhea}
                    menuContentStyle={{backgroundColor: colors.secondary}}
                    hideMenuHeader = {Platform.OS === 'web'}
                />
                <Dropdown 
                    label = {'Malaria'}
                    mode = {'outlined'}
                    options = {diagnosisOptions}
                    value = {malaria}
                    onSelect = {setMalaria}
                    menuContentStyle={{backgroundColor: colors.secondary}}
                    hideMenuHeader = {Platform.OS === 'web'}
                />
                <Dropdown 
                    label = {'Sepsis'}
                    mode = {'outlined'}
                    options = {diagnosisOptions}
                    value = {sepsis}
                    onSelect = {setSepsis}
                    menuContentStyle={{backgroundColor: colors.secondary}}
                    hideMenuHeader = {Platform.OS === 'web'}
                />
                <Dropdown 
                    label = {'Meningitis/Encephalitis'}
                    mode = {'outlined'}
                    options = {diagnosisOptions}
                    value = {meningitis}
                    onSelect = {setMeningitis}
                    menuContentStyle={{backgroundColor: colors.secondary}}
                    hideMenuHeader = {Platform.OS === 'web'}
                />

            </ScrollView>

            {/* Pagination controls */}
            {/* TODO - make sure this is the correct way to navigate to different screens */}
            <View style={Styles.paginationButtonContainer}>
                <PaginationButton
                    // TODO - add alerts on press ??
                    onPress={() => {
                        router.push('../(dataEntry-sidenav)/admissionClinicalData')
                    }}
                    isNext={ false }
                    label='Previous'
                />
                <PaginationButton
                    // TODO - add alerts on press ??
                    onPress={() => {
                        router.push('../(dataEntry-sidenav)/vhtReferral')
                    }}
                    isNext={ true }
                    label='Next'
                />
            </View>
        </SafeAreaView>
    );
}
