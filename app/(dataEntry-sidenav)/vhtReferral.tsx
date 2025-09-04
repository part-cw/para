import PaginationControls from '@/src/components/PaginationControls';
import SearchableDropdown, { DropdownItem } from '@/src/components/SearchableDropdown';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { formatPhoneNumber, validatePhoneNumber } from '@/src/utils/inputValidator';
import { vhtData as allData } from '@/src/utils/vhtDataLoader'; // currently hardcoded to be 'buikwe' - TODO make it dynamically selected
import { filterTelephoneNumbers, filterVHTs, filterVillages, getTelephoneDropdownItems, getVhtDropdownItems, getVillageDropdownItems } from '@/src/utils/vhtDataProcessor';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Card, List, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO:
//  - village required - error if left blank 
//  - make sure only one dropdown open at a time
// - make sure unable to add invalid number

// Bug Fixes ?? (confirm if these are actually bugs):
//  - don't display newly added vhts if selected village is in original dataset and vice versa for vhts
//  - Clear VHT selection if it's no longer valid for the selected village, and vice versa??
// if enter mew item, other dropdowns should render entire list

export default function VHTReferralScreen() {
    const { colors } = useTheme()

    const [villages, setVillages] = useState<DropdownItem[]>(() => getVillageDropdownItems(allData));
    const [vhts, setVHTs] = useState<DropdownItem[]>(() => getVhtDropdownItems(allData));
    const [telNumbers, setTelNumbers] = useState<DropdownItem[]>(() => getTelephoneDropdownItems(allData));

    const [addedVillages, setAddedVillages] = useState<DropdownItem[]>([]);
    const [addedVHTs, setAddedVHTs] = useState<DropdownItem[]>([]);
    const [addedNumbers, setAddedNumbers] = useState<DropdownItem[]>([]);

    const { patientData, updatePatientData, isDataLoaded } = usePatientData();
    const {
        village,
        subvillage,
        vhtName,
        vhtTelephone
    } = patientData;
    
    const allVillages = [...villages, ...addedVillages];
    const allVHTs = [...vhts, ...addedVHTs];
    const allNumbers = [...telNumbers, ...addedNumbers];

    // handle village selection change
    // if village and/or telephone user added - should render entire vht list
    useEffect(() => {        
        const isUserAddedVillage = !!addedVillages.find(v => v.value === village);
        const isUserAddedNumber = !!addedNumbers.find(n => n.value === vhtTelephone);
        
        const filteredVHTs = (isUserAddedVillage && !vhtTelephone) || (isUserAddedNumber && !village)
            ? getVhtDropdownItems(allData)
            : filterVHTs(allData, village, vhtTelephone);
        
        // TODO if isUserAddedNumber && selectedVillage && !isUserAddedVillage -- filter vht by village ??
        // if isUserAddedVillage && selectedNumber $$ !isUserAddedNumer -- filter vht by tel ??
        // todo -- confirm isUserAddedVillage && !selectedTelNumber -> render all is correct? is this ever a use case?
        
        setVHTs(filteredVHTs);

        // TODO -- Clear VHT selection if it's no longer valid for the selected village
        // if (selectedVHT && !filteredVHTs.some(vht => vht.key === selectedVHT.key)) {
        // setSelectedVHT(null);
        // }
        //So if some() returns true (meaning the VHT WAS found), the ! makes it false

        // Auto-select VHT if only one option AND no VHT currently selected
        if (filteredVHTs.length === 1 && !vhtName) {
            updatePatientData({vhtName: filteredVHTs[0].value})
        }
    }, [village, vhtTelephone]) // selected valyes

    // handle vht selection change
    useEffect(() => {
        // TODO add logic for user added tel and vht and whether villages should be filterd??
        const filteredVillages = filterVillages(allData, vhtName, vhtTelephone)
        setVillages(filteredVillages)

        // Auto-select village if only one option AND no village currently selected
        if (filteredVillages.length === 1 && !village) {
            updatePatientData({village: filteredVillages[0].value})
            // setSelectedVillage(filteredVillages[0])
        }

        // TODO?? -- Clear village selection if it's no longer valid for the selected VHT
        // if (selectedVillage && !filteredVillages.some(village => village.key === selectedVillage.key) &&
        //     !addedVillages.some(village => village.key === selectedVillage.key)) {
        //     setSelectedVillage(null);
        // }
    }, [vhtName, vhtTelephone])

    // handle telephone filtering with village and vht selection change
    // if vht selected from list tel and village will be auto filtered
    useEffect(() => {
        const isUserAddedVillage = !!addedVillages.find(v => v.value === village);
        const isUserAddedVht = !!addedVHTs.find(v => v.value === vhtName);
        
        // TODO - check conditional
        // if vht selected from list, tel auto filtered
        // if village user added and vht use added -- show all?
        const filteredNumbers = (isUserAddedVillage && !vhtTelephone)
            ? getTelephoneDropdownItems(allData)
            : filterTelephoneNumbers(allData, vhtName, village);

                
        setTelNumbers(filteredNumbers)

        // tel autopopulates if only option
        if (filteredNumbers.length === 1 && !vhtTelephone) {
            updatePatientData({vhtTelephone: filteredNumbers[0].value})
        }

        // TODO - clear tel selection if no longer valid for selected village/vht
    }, [village, vhtName])

    // Handle adding new villages
    const handleAddVillage = (newVillage: DropdownItem) => {
        setAddedVillages(prev => [...prev, newVillage]);
        // TODO: validate, etc.
    };

    // Handle adding new VHTs
    const handleAddVHT = (newVHT: DropdownItem) => {
        setAddedVHTs(prev => [...prev, newVHT]);
        // TODO: validate, etc.
    };

    // Handle adding new telephone number
    const handleAddTel = (newNumber: DropdownItem) => {
         // Additional validation check before adding to state
        const validation = validatePhoneNumber(newNumber.value);
        if (validation.isValid) {
            // Use formatted value if available
            const formattedNumber = {
                ...newNumber,
                value: validation.formattedValue || newNumber.value
            };
            setAddedNumbers(prev => [...prev, formattedNumber]);
            console.log('Added valid phone number:', formattedNumber.value);
        } else {
            console.error('Attempted to add invalid phone number:', newNumber.value);
            // This shouldn't happen due to dropdown validation, but good to have as backup
        }
    }

    // Handle village selection - check for cleared selection
    const handleVillageSelect = (selectedVillage: DropdownItem) => {
        if (selectedVillage.value === '') {
            updatePatientData({village: ''})
        } else {
            updatePatientData({village: selectedVillage.value})
        }
    };

    // Handle VHT selection - check for cleared selection
    const handleVHTSelect = (vht: DropdownItem) => {
        if (vht.value === '') {
            updatePatientData({vhtName: ''})
        } else {
            updatePatientData({vhtName: vht.value})
        }
    };

    // Handle tel number selection - check for cleared selection
    const handleTelSelect = (tel: DropdownItem) => {
        if (tel.value === '') {
            updatePatientData({vhtTelephone: ''})
        } else {
            updatePatientData({vhtTelephone: tel.value})
        }
    }

    const confirmClear = () => {
    if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to clear selections? All entered data will be wiped from this screen.")) {
        clearSelections();
        }
    } else {
        Alert.alert(
        "Confirm Clear",
        "Are you sure you want to clear selections? All entered data will be wiped from this screen.",
        [
            { text: "Cancel", style: "cancel" },
            { text: "OK", onPress: clearSelections }
        ]
        );
    }
    };

    const clearSelections = () => {
        updatePatientData({
            village: '',
            subvillage: '',
            vhtName: '',
            vhtTelephone: ''
        })
    };

    // Don't render until data is loaded
    if (!isDataLoaded) {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                <Text>Loading...</Text>
            </SafeAreaView>
        );
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
                                placeholder='Search or enter village name'
                                onSelect={handleVillageSelect}
                                onAddItem={handleAddVillage}
                                value={village || ''}
                            />
                            <TextInput 
                                label="Subvillage" // TODO - make sure subvillage is optional
                                placeholder="Enter subvillage name" 
                                mode="outlined" 
                                style={Styles.textInput}
                                value = {subvillage || ''}
                                onChangeText={(value) => updatePatientData({subvillage: value})}
                                onBlur={() => {
                                    // remove extra spaces from subvillage text
                                    updatePatientData({subvillage: subvillage?.trim()})
                                }}
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
                                placeholder='Search or enter VHT name'
                                onSelect={handleVHTSelect}
                                onAddItem={handleAddVHT}
                                value={vhtName || ''}
                            />
                            <SearchableDropdown
                                data={allNumbers}
                                label="Telephone"
                                placeholder='Search or enter VHT telephone number'
                                onSelect={handleTelSelect}
                                onAddItem={handleAddTel}
                                value={vhtTelephone || ''}
                                validator={validatePhoneNumber}
                                formatter={(value) => formatPhoneNumber(value)}
                                showError={true}
                                keyboard='phone-pad'
                            />
                        </View>
                    </View>

                </List.Section>
                <Button
                    style={{ alignSelf: 'center' }}
                    mode="elevated"
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    onPress={confirmClear}
                >
                    Clear All Selections
                </Button>
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
adding invalid phone number
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