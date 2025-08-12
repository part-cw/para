import PaginationControls from '@/src/components/PaginationControls';
import SearchableDropdown, { DropdownItem } from '@/src/components/SearchableDropdown';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { vhtData as allData } from '@/src/utils/vhtDataLoader'; // currently hardcoded to be 'buikwe' - TODO make it dynamically selected
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

    const [villages, setVillages] = useState<DropdownItem[]>([]);
    const [vhts, setVHTs] = useState<DropdownItem[]>([]);

    const [selectedVillage, setSelectedVillage] = useState<DropdownItem | null>(null);
    const [selectedVHT, setSelectedVHT] = useState<DropdownItem | null>(null);

    console.log('selected village', selectedVillage)
    console.log('~~~villages', villages)
    console.log('selected vht', selectedVHT)
    console.log('~~~vhts', vhts)

    useEffect(() => {
        if (selectedVillage) {
            console.log('*** village selected ... filtering vhts')
            setVHTs(filterVhtsByVillage(allData, selectedVillage.value))
            // setSelectedVHT(null); 
            console.log('***vhts', vhts)
        } else {
            console.log('@@@ no village selected', selectedVillage)
            setVHTs(getVhtDropdownItems(allData))
            console.log('***vhts', vhts)
        }
    }, [selectedVillage, selectedVHT])

    useEffect(() => {
        if (selectedVHT) {
            console.log('%%%vht selected...filtering villages')
            setVillages(filterVillagesbyVht(allData, selectedVHT.value))
            // setSelectedVillage(null)
            console.log('%%%villages', villages)
        } else {
            console.log('%%% no vht sel', selectedVHT)
            setVillages(getVillageDropdownItems(allData))
            console.log('%%%villages', villages)
        }
    }, [selectedVHT, selectedVillage])

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


/*
Scenarios:
2. Enter/select Village first, then clear:
    - village list successfully shows all data 
    - !!! vht list only show filtered (based on previously selected village)

3. Enter/select Village first
   - successfully filters vht list
   - village dropdown shows all villages
   Clear village
   - see all villages
   - !!! see filtered vhts only

4. Enter/select village
    - vhts filtered (expected)
    - village dropdown show all (expected)
   Select VHT
    - !!! vht dropwdown show all (should show filtered)
    - village dropdown show filtered 
   Clear VHT
   - !!! vht dropdown show all (should show filter by village)
   - !!! village dropdown show filtered (should show all)
   - !!! selectedVillage consol.log = null but village still entered 
   Clear Village
   -  vht dropdown show all (expected, but same as prev state)
   - !!! village dropdown show filtered (should show all)
   Select VHT for diff village
   - vht dropwdown show all (expected)
   - village dropdown show filtered (Expected)
   - !!! village should be auto selected when only option

*/
