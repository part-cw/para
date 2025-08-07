import PaginationControls from '@/components/PaginationControls';
import SearchableDropdown from '@/components/SearchableDropdown';
import { GlobalStyles as Styles } from '@/themes/styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { type AutocompleteDropdownItem } from 'react-native-autocomplete-dropdown';
import { SelectList } from 'react-native-dropdown-select-list';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO:
// - allow manual data entry if options not in Dropdown for all fields
// - village required - error if left blank 
// - data persisted when accordions close/open and when navigate away
// - make village selection filter down vht name and vice versa
// write util function to covert csv to usable dataset for autocomplete componenet

export default function VHTReferralScreen() {
    // TODO - add more states
    const { colors } = useTheme()
    const [village, setVillage] = useState<AutocompleteDropdownItem | null>(null)
    const [vht, setVht] = useState<AutocompleteDropdownItem | null>(null)
    
    const [selectedValue, setSelectedValue] = useState<string>('');
    const handleSelectionChange = (value: string) => {
        setSelectedValue(value);
    };

    const [selectedValueB, setSelectedValueB] = useState<string>('');
    const handleSelectionChangeB = (value: string) => {
        setSelectedValueB(value);
    };



    // TODO convert csv data into dataset of this format
    // TODO filter VHT name list based on 
    const testDataset = [
          { id: '1', title: 'Alpha'},
          { id: '2', title: 'Beta'},
          { id: '3', title: 'Gamma'},
        ]
    const testDataset2 = [
          { id: '1', title: 'Apple'},
          { id: '2', title: 'Banana'},
          { id: '3', title: 'Cantaloupe'},
        ]
    
    const testData3: string[] = [
        'Apple',
        'Banana',
        'Cherry',
        'Date',
        'Elderberry',
        'Fig',
        'Grape',
        'Honeydew',
    ];

    const testData4 = [
        { key: '1', value: 'Apple'},
        { key: '2', value: 'Banana'},
        { key: '3', value: 'Cantaloupe'},
        { key: '4', value: 'Date'},
        { key: '5', value: 'Elderberry'},
        { key: '6', value: 'Fig'},
        { key: '7', value: 'Honeydew'},
    ]

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* <DebugStack/> */}
                <Card style={Styles.cardWrapper}>
                    <Card.Content>
                        <Text variant="bodyLarge">
                            To connect the patient to a local health worker who can follow 
                            up with them, enter the village near to where they will stay one
                            week after discharge and their VHT's contact information.      
                        </Text>
                    </Card.Content>
                </Card>

                <List.Section>
                    {/* Location Accordion */}
                    <View style={Styles.accordionListWrapper}>
                        <List.Accordion
                            title="Patient Address"
                            titleStyle={Styles.accordionListTitle}
                            left={props => <List.Icon {...props} icon="map-marker" />}
                            expanded={true}
                            right={() => null}
                            onPress={() => null}>
                            <View style={Styles.accordionContentWrapper}>
                                {/* <AutocompleteField 
                                    dataSet={testDataset}
                                    placeholder= 'Start typing village name'
                                    onSelectItem={setVillage}
                                    label ='Village (required)'            
                                /> */}
                                <SearchableDropdown
                                    data={testData3}
                                    label="Village (required)"
                                    placeholder='Enter village name'
                                    onSelect={handleSelectionChange}
                                    value={selectedValue}
                                    maxHeight={200}
                                    search={true}
                                />
                                <SelectList 
                                    setSelected={setSelectedValueB}
                                    data={testData4}/>
                                
                            </View>
                        </List.Accordion>
                    </View>

                    {/* VHT Contact Info Card*/}
                    <View style={Styles.accordionListWrapper}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                            <List.Icon icon="doctor" color={colors.primary} />
                            <Text style={Styles.accordionListTitle}>VHT Contact Information</Text>
                        </View>
                        <View style={Styles.accordionContentWrapper}>
                            {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}></TouchableWithoutFeedback> */}
                                <SearchableDropdown
                                    data={testData3}
                                    label="Name"
                                    placeholder='Enter VHT name'
                                    onSelect={handleSelectionChange}
                                    value={selectedValue}
                                    maxHeight={200}
                                    search={true}
                                />
                            {/* <TouchableWithoutFeedback/> */}

                            <SearchableDropdown
                                data={testData3}
                                label="Telephone"
                                placeholder='Enter VHT telephone number'
                                onSelect={handleSelectionChange}
                                value={selectedValue}
                                maxHeight={200}
                                search={true}
                            />
                        </View>
                    </View>

                </List.Section>
            </ScrollView>

            <PaginationControls
                showPrevious={true}
                showNext={true}
                onPrevious={() => router.push('/(dataEntry-sidenav)/medicalConditions')}
                onNext={() => router.push('/(dataEntry-sidenav)/caregiverContact')}
            />  
        </SafeAreaView>
    );
}
