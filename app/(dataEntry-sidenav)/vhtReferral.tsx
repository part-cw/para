import PaginationControls from '@/src/components/PaginationControls';
import SearchableDropdown, { DropdownItem } from '@/src/components/SearchableDropdown';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { vhtData } from '@/src/utils/vhtDataLoader'; // currently hardcoded to be 'buikwe' - TODO make it dynamically selected
import { filterVhtsByVillage, filterVillagesbyVht, getVhtDropdownItems, getVillageDropdownItems } from '@/src/utils/vhtDataProcessor';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO:
// - village required - error if left blank 
// - data persisted when navigate away
// - make village selection filter down vht name and vice versa

export default function VHTReferralScreen() {
    const { colors } = useTheme()

    const [villages, setVillages] = useState<DropdownItem[]>(getVillageDropdownItems(vhtData));
    const [vhts, setVHTs] = useState<DropdownItem[]>(getVhtDropdownItems(vhtData));

    const [selectedVillage, setSelectedVillage] = useState<DropdownItem | null>(null);
    const [selectedVHT, setSelectedVHT] = useState<DropdownItem | null>(null);

    console.log('selected village', selectedVillage)
    console.log('selected vht', selectedVHT)
    console.log('~~~vhts', vhts)

    useEffect(() => {
        if (selectedVillage) {
            console.log('*** sel vill useEffect')
            setVHTs(filterVhtsByVillage(vhtData, selectedVillage.value))
            // setSelectedVHT(null); 
            console.log('***vhts', vhts)
        } else {
            console.log('here?')
            setVHTs(getVhtDropdownItems(vhtData))
        }
    }, [selectedVillage])

    useEffect(() => {
        selectedVHT && filterVillagesbyVht(vhtData, selectedVHT.value)
        if (selectedVHT) {
            setVillages(filterVillagesbyVht(vhtData, selectedVHT.value))
        } else {
            setVillages(getVillageDropdownItems(vhtData))
        }
    }, [selectedVHT])

    // TODO delete -- for testing purposes only
    // const allVillages= getVillageDropdownItems(vhtData)
    // const vhtNames = getVhtDropdownItems(vhtData);
    // const filteredNames = filterVhtsByVillage(vhtData, 'kanyogoga')
    // const filteredVillages = filterVillagesbyVht(vhtData, 'Wasswa Joseph')

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
                                data={villages}
                                label="Village (required)"
                                placeholder='Enter village name'
                                onSelect={setSelectedVillage}
                                value={selectedVillage?.value}
                            />
                            {/* <SearchableDropdown
                                data={testData}
                                label="Health Facility (optional)"
                                placeholder='Enter HC name'
                                onSelect={handleSelectionChange}
                                value={selected?.value}
                            /> */}
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
                                data={vhts}
                                label="Name"
                                placeholder='Enter VHT name'
                                onSelect={setSelectedVHT}
                                value={selectedVHT?.value}
                            />

                            {/* <SearchableDropdown
                                data={testData}
                                label="Telephone"
                                placeholder='Enter VHT telephone number'
                                onSelect={handleSelectionChange}
                                value={selected?.value}
                            /> */}
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
