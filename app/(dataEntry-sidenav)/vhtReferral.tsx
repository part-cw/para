import PaginationControls from '@/components/PaginationControls';
import SearchableDropdown, { DropdownItem } from '@/components/SearchableDropdown';
import { GlobalStyles as Styles } from '@/themes/styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO:
// - village required - error if left blank 
// - data persisted when accordions close/open and when navigate away
// - make village selection filter down vht name and vice versa
// write util function to covert csv to usable dataset for searchable dropdown componenet

export default function VHTReferralScreen() {
    // TODO - add more states
    const { colors } = useTheme()
    
    const [selected, setSelected] = useState<DropdownItem | null>(null);
    const handleSelectionChange = (item: DropdownItem) => {
        setSelected(item);
    };

    // TODO convert csv data into dataset of this format
    // TODO filter VHT name list based on village
    const testData = [
        {key: "1", value: 'alpha'},
        {key: "2", value: 'beta'},
        {key: "3", value: 'gamma'},
        {key: "4", value: 'delta'},
        {key: "5", value: 'deelta'},
        {key: "6", value: 'deltaa'},
        {key: "7", value: 'apple'},
        {key: "8", value: 'pie'},
    ]

    console.log('data', testData)

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
                    {/* Location Card */}
                    <View style={Styles.accordionListWrapper}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                            <List.Icon icon="map-marker" color={colors.primary} />
                            <Text style={Styles.cardTitle}>Patient Address</Text>
                        </View>
                        <View style={Styles.accordionContentWrapper}>
                            <SearchableDropdown
                                data={testData}
                                label="Village (required)"
                                placeholder='Enter village name'
                                onSelect={handleSelectionChange}
                                value={selected?.value}
                            />
                            <SearchableDropdown
                                data={testData}
                                label="Health Facility (optional)"
                                placeholder='Enter HC name'
                                onSelect={handleSelectionChange}
                                value={selected?.value}
                            />
                        </View>
                    </View>

                    {/* VHT Contact Info Card*/}
                    <View style={Styles.accordionListWrapper}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                            <List.Icon icon="doctor" color={colors.primary} />
                            <Text style={Styles.cardTitle}>VHT Contact Information</Text>
                        </View>
                        <View style={Styles.accordionContentWrapper}>
                            <SearchableDropdown
                                data={testData}
                                label="Name"
                                placeholder='Enter VHT name'
                                onSelect={handleSelectionChange}
                                value={selected?.value}
                            />

                            <SearchableDropdown
                                data={testData}
                                label="Telephone"
                                placeholder='Enter VHT telephone number'
                                onSelect={handleSelectionChange}
                                value={selected?.value}
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
