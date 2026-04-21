import PaginationControls from '@/src/components/PaginationControls';
import { VHTReferralSection } from '@/src/components/sections/VhtReferralSection';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { router } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO - confirm these are still issues:
//  - village required - error if left blank 
//  - make sure only one dropdown open at a time
// - make sure unable to add invalid number

// Bug Fixes ?? (confirm if these are actually bugs):
//  - don't display newly added vhts if selected village is in original dataset and vice versa for vhts
//  - Clear VHT selection if it's no longer valid for the selected village, and vice versa??
// if enter mew item, other dropdowns should render entire list

export default function VHTReferralScreen() {
    const { colors } = useTheme()
    const { patientData, updatePatientData, isDataLoaded } = usePatientData();
    

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
                <VHTReferralSection
                    village={patientData.village}
                    subvillage={patientData.subvillage}
                    vhtName={patientData.vhtName}
                    vhtTelephone={patientData.vhtTelephone}
                    onUpdate={updatePatientData}
                    colors={colors}
                    mode="admission"
                    showClearButton={true}
                    showHeader={true}
                />
            </ScrollView>

            <PaginationControls
                showPrevious={true}
                showNext={true}
                onPrevious={() => router.push('/(admission-sidenav)/medicalConditions')}
                onNext={() => router.push('/(admission-sidenav)/caregiverContact')}
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