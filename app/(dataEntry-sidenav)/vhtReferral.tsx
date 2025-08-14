import PaginationControls from '@/src/components/PaginationControls';
import SearchableDropdown, { DropdownItem } from '@/src/components/SearchableDropdown';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { vhtData as allData } from '@/src/utils/vhtDataLoader'; // currently hardcoded to be 'buikwe' - TODO make it dynamically selected
import { filterTelephoneNumbers, filterVhtsByVillage, filterVillagesbyVht, getTelephoneDropdownItems, getVhtDropdownItems, getVillageDropdownItems } from '@/src/utils/vhtDataProcessor';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO:
//  - village required - error if left blank 
//  - data persisted when navigate away
//  - make sure only one dropdown open at a time

// Bug Fixes:
//  - auto sets search text if onle 1 dropdown item available 
//  - don't display newly added vhts if selected village is in original dataset and vice versa for vhts
//  - Clear VHT selection if it's no longer valid for the selected village, and vice versa

export default function VHTReferralScreen() {
    const { colors } = useTheme()

    const [villages, setVillages] = useState<DropdownItem[]>(() => getVillageDropdownItems(allData));
    const [vhts, setVHTs] = useState<DropdownItem[]>(() => getVhtDropdownItems(allData));
    const [telNumbers, setTelNumbers] = useState<DropdownItem[]>(() => getTelephoneDropdownItems(allData));

    const [addedVillages, setAddedVillages] = useState<DropdownItem[]>([]);
    const [addedVHTs, setAddedVHTs] = useState<DropdownItem[]>([]);
    const [addedNumbers, setAddedNumbers] = useState<DropdownItem[]>([]);

    const [selectedVillage, setSelectedVillage] = useState<DropdownItem | null>(null);
    const [selectedVHT, setSelectedVHT] = useState<DropdownItem | null>(null);
    const [selectedTelNumber, setSelectedTelNumber] = useState<DropdownItem | null>(null);

    const allVillages = [...villages, ...addedVillages];
    const allVHTs = [...vhts, ...addedVHTs];
    const allNumbers = [...telNumbers, ...addedNumbers];

    // const filteredTelephone = filterTelephoneNumbers(allData, selectedVHT?.value, selectedVillage?.value)
    // console.log('filtered tel', filteredTelephone)

    // console.log('villages', villages)
    // console.log('selected village', selectedVillage)
    // console.log('~~~villages', villages)
    // console.log('selected vht', selectedVHT)
    // console.log('~~~vhts', vhts)
    console.log('telNumbers', telNumbers)
    console.log('selected number', selectedTelNumber)

    // handle village selection change
    useEffect(() => {
        if (selectedVillage && selectedVillage.value) {
            // console.log('*** village selected ... filtering vhts')
            
            const filteredVHTs = filterVhtsByVillage(allData, selectedVillage.value);
            setVHTs(filteredVHTs);

            // TODO -- Clear VHT selection if it's no longer valid for the selected village
            // Check if we have a selected VHT AND that VHT is not in the filtered list
            // if (selectedVHT && !filteredVHTs.some(vht => vht.key === selectedVHT.key) && 
            //     !addedVHTs.some(vht => vht.key === selectedVHT.key)) {
            //     setSelectedVHT(null);
            // }
            //  OR USE THIS 
            // else if (selectedVHT && !filteredVHTs.some(vht => vht.key === selectedVHT.key)) {
            // setSelectedVHT(null);
            // }
            //So if some() returns true (meaning the VHT WAS found), the ! makes it false


            // console.log('filtered vhts', filteredVHTs)
            // TODO Auto-select VHT if only one option AND no VHT currently selected
            if (filteredVHTs.length === 1 && !selectedVHT) {
                setSelectedVHT(filteredVHTs[0])
            }

            // console.log('***vhts', vhts)
        } else {
            console.log('@@@ no village selected', selectedVillage)
            const allVHTData = getVhtDropdownItems(allData);
            setVHTs(allVHTData)
            // console.log('***vhts', vhts)

            //TODO - remove this? -- not likely to only have 1 option in entire database
             // Auto-select VHT if only one option in entire dataset AND no VHT selected
            // if (allVHTData.length === 1 && !selectedVHT) {
            //     console.log('Auto-selecting single VHT from all data:', allVHTData[0].value);
            //     setSelectedVHT(allVHTData[0]);
            // }
        }
    }, [selectedVillage])

    // handle vht selection change
    useEffect(() => {
        if (selectedVHT && selectedVHT.value) {
            console.log('%%%vht selected...filtering villages')
            const filteredVillages = filterVillagesbyVht(allData, selectedVHT.value)
            setVillages(filteredVillages)

            // TODO: Auto-select village if only one option AND no village currently selected
            console.log('filtered villages', filteredVillages)
            if (filteredVillages.length === 1 && !selectedVillage) {
                setSelectedVillage(filteredVillages[0])
            }

            // TODO -- Clear village selection if it's no longer valid for the selected VHT
            // if (selectedVillage && !filteredVillages.some(village => village.key === selectedVillage.key) &&
            //     !addedVillages.some(village => village.key === selectedVillage.key)) {
            //     setSelectedVillage(null);
            // }

            // setSelectedVillage(null)
            // console.log('%%%villages', villages)
        } else {
            // console.log('%%% no vht sel', selectedVHT)
            setVillages(getVillageDropdownItems(allData))
            // console.log('%%%villages', villages)
        }
    }, [selectedVHT])

    // handle telephone filtering with village and vht selection change
    useEffect(() => {
        const filteredNumbers = filterTelephoneNumbers(allData, selectedVHT?.value, selectedVillage?.value)
        setTelNumbers(filteredNumbers)
    }, [selectedVillage, selectedVHT])

    // Handle adding new villages
    const handleAddVillage = (newVillage: DropdownItem) => {
        setAddedVillages(prev => [...prev, newVillage]);
        // TODO: save to backend, validate, etc.
    };

    // Handle adding new VHTs
    const handleAddVHT = (newVHT: DropdownItem) => {
        setAddedVHTs(prev => [...prev, newVHT]);
        // TODO: save to backend, validate, etc.
    };

    // Handle adding new telephone number
    const handleAddTel = (newNumber: DropdownItem) => {
        setAddedNumbers(prev => [...prev, newNumber])
        // TOOD validate input 
    }

    // Handle village selection - check for cleared selection
    const handleVillageSelect = (village: DropdownItem) => {
        if (village.value === '') {
            setSelectedVillage(null);
        } else {
            setSelectedVillage(village);
        }
    };

    // Handle VHT selection - check for cleared selection
    const handleVHTSelect = (vht: DropdownItem) => {
        if (vht.value === '') {
            setSelectedVHT(null);
        } else {
            setSelectedVHT(vht);
        }
    };

    // Handle tel number selection - check for cleared selection
    const handleTelSelect = (tel: DropdownItem) => {
        if (tel.value === '') {
            setSelectedTelNumber(null)
        } else {
            setSelectedTelNumber(tel)
        }
    }

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
                                data={allVillages}
                                label="Village (required)"
                                placeholder='Enter village name'
                                onSelect={handleVillageSelect}
                                onAddItem={handleAddVillage}
                                value={selectedVillage?.value || ''}
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
                                data={allVHTs}
                                label="Name (required)"
                                placeholder='Enter VHT name'
                                onSelect={handleVHTSelect}
                                onAddItem={handleAddVHT}
                                value={selectedVHT?.value || ''}
                            />
                            <SearchableDropdown
                                data={allNumbers}
                                label="Telephone"
                                placeholder='Enter VHT telephone number'
                                onSelect={handleTelSelect}
                                onAddItem={handleAddTel}
                                value={selectedTelNumber?.value || ''}
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


/*
Double check these scenarios:
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