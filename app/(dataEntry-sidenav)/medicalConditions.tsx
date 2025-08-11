import PaginationControls from '@/components/PaginationControls';
import SearchableDropdown, { DropdownItem } from '@/components/SearchableDropdown';
import { GlobalStyles as Styles } from '@/themes/styles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
// import { Dropdown } from 'react-native-paper-dropdown';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function MedicalConditionsScreen() {
    const { colors } = useTheme();
    
    const [ anaemia, setAnaemia ] = useState<DropdownItem | null>(null);
    const [ pneumonia, setPneumonia ] = useState<DropdownItem | null>(null);
    const [ chronicIllness, setChronicIllness ] = useState<DropdownItem | null>(null);
    const [ acuteDiarrhea, setAcuteDiarrhea ] = useState<DropdownItem | null>(null);
    const [ malaria, setMalaria ] = useState<DropdownItem | null>(null);
    const [ sepsis, setSepsis ] = useState<DropdownItem | null>(null);
    const [ meningitis, setMeningitis ] = useState<DropdownItem | null>(null);

    const diagnosisOptions = [
        { value: 'Yes - positive diagnosis', key: 'yes'},
        { value: 'No - negative diagnosis', key: 'no'},
        { value: 'Suspected', key: 'suspected'},
        { value: 'Unsure', key: 'unsure'},
    ]

    const simplifiedOptions = [
        { value: 'Yes', key: 'yes'},
        { value: 'No', key: 'no'},
    ]
      
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            {/* <DebugStack/> */}
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
                <Card style={Styles.cardWrapper}>
                    <Card.Content>
                        <Text variant="bodyLarge">
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
                
               <View style = {{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
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
                
                <SearchableDropdown 
                    data={diagnosisOptions} 
                    label={'Pneumonia'}
                    placeholder='select option below' 
                    onSelect={setPneumonia}
                    value={pneumonia?.value}
                    search={false}
                />
                <SearchableDropdown 
                    data={diagnosisOptions} 
                    label={'Severe anaemia'}
                    placeholder='select option below' 
                    onSelect={setAnaemia}
                    value={anaemia?.value}
                    search={false}
                />

                <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={{flex: 1}}>
                        <SearchableDropdown 
                            data={diagnosisOptions} 
                            label={'Chronic illnesses'}
                            placeholder='select option below' 
                            onSelect={setChronicIllness}
                            value={chronicIllness?.value}
                            search={false}
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
                <SearchableDropdown 
                    label = {'Acute diarrhea'}
                    data = {simplifiedOptions}
                    value = {acuteDiarrhea?.value}
                    placeholder='select option below'
                    onSelect={setAcuteDiarrhea}
                    search={false}
                />
                <SearchableDropdown 
                    label = {'Malaria'}
                    data = {diagnosisOptions}
                    value = {malaria?.value}
                    placeholder='select option below' 
                    onSelect={setMalaria}
                    search={false}
                />
                <SearchableDropdown 
                    label = {'Sepsis'}
                    data = {diagnosisOptions}
                    value = {sepsis?.value}
                    placeholder='select option below' 
                    onSelect = {setSepsis}
                    search={false}
                />
                <SearchableDropdown 
                    label = {'Meningitis/Encephalitis'}
                    data = {diagnosisOptions}
                    value = {meningitis?.value}
                    placeholder='select option below' 
                    onSelect = {setMeningitis}
                    search={false}
                />

            </ScrollView>
            <PaginationControls
                showPrevious={true}
                showNext={true}
                onPrevious={() => router.push('/(dataEntry-sidenav)/admissionClinicalData')}
                onNext={() => router.push('/(dataEntry-sidenav)/vhtReferral')}
            /> 
        </SafeAreaView>
    );
}
