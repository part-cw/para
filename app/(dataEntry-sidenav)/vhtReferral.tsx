import AutocompleteField from '@/components/AutocompleteField';
import PaginationControls from '@/components/PaginationControls';
import { GlobalStyles as Styles } from '@/themes/styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { type AutocompleteDropdownItem } from 'react-native-autocomplete-dropdown';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// TODO:
// - allow manual data entry if options not in Dropdown for all fields
// - village required - error if left blank 
// - data persisted when accordions close/open and when navigate away
// - make accordion open state by default? or remove closing capabilities??
// - make village selection filter down vht name and vice versa
// write util function to covert csv to usable dataset for autocomplete componenet

export default function VHTReferralScreen() {
    // TODO - fix setuseState and handlePress
    const [expanded, setExpanded] = useState(true);
    const handlePress = () => setExpanded(!expanded);

    // TODO - add more states
    const [village, setVillage] = useState<AutocompleteDropdownItem | null>(null)
    const [vht, setVht] = useState<AutocompleteDropdownItem | null>(null)


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
                            title="Patient Location"
                            titleStyle={Styles.accordionListTitle}
                            left={props => <List.Icon {...props} icon="map-marker" />}>
                            <View style={Styles.accordionContentWrapper}>
                                <AutocompleteField 
                                    dataSet={testDataset}
                                    placeholder= 'Start typing village name'
                                    onSelectItem={setVillage}
                                    label ='Village (required)'            
                                />
                                <AutocompleteField 
                                    dataSet={testDataset}
                                    placeholder= 'Start typing HC name'
                                    onSelectItem={setVillage}
                                    label ='Health Facility'            
                                />
                            </View>
                        </List.Accordion>
                    </View>

                    {/* VHT Contact Info Accordion */}
                    <View style={Styles.accordionListWrapper}>
                        <List.Accordion
                            title="VHT Contact Information"
                            titleStyle={Styles.accordionListTitle}
                            left={props => <List.Icon {...props} icon="doctor" />}>
                            <View style={Styles.accordionContentWrapper}>
                                <AutocompleteField
                                    placeholder="Start typing VHT name"
                                    dataSet={testDataset2}
                                    onSelectItem={setVht}
                                    label='Name'
                                />
                                <AutocompleteField
                                    placeholder="Start typing phone number"
                                    dataSet={testDataset}
                                    onSelectItem={setVht}
                                    label='Telephone'
                                />
                            </View>
                        </List.Accordion>
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