import AutocompleteField from '@/components/AutocompleteField';
import DebugStack from '@/components/DebugStack';
import PaginationButton from '@/components/PaginationButton';
import { GlobalStyles as Styles } from '@/themes/styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import type { AutocompleteDropdownItem } from 'react-native-autocomplete-dropdown';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function VHTReferralScreen() {
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
          { id: '1', title: 'A'},
          { id: '2', title: 'B'},
          { id: '3', title: 'G'},
        ]
    
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <DebugStack/>
                <Card style={Styles.cardWrapper}>
                    <Card.Content>
                        <Text variant="bodyLarge">
                            To connect the patient to a local health worker who can follow 
                            up with them, enter their village or VHT's name below.      
                        </Text>
                    </Card.Content>
                </Card>

                <Text style={Styles.sectionHeader}>Village Name</Text>
                {/* <AutocompleteField 
                    dataSet={testDataset}
                    placeholder= 'Start typing village name'
                    onSelectItem={setVillage}            
                /> */}

                <Text style={Styles.sectionHeader}>VHT Contact Info</Text>
                <AutocompleteField
                    placeholder="Start typing VHT name"
                    dataSet={testDataset2}
                    onSelectItem={setVht}
                    // label='VHT Name'
                />
                
            </ScrollView>

            {/* Pagination controls */}
            <View style={Styles.paginationButtonContainer}>
                <PaginationButton
                    // TODO - add alerts on press ??
                    onPress={() => {router.push('/(dataEntry-sidenav)/medicalConditions')}}
                    isNext={ false }
                    label='Previous'
                />
                <PaginationButton
                    // TODO - add alerts on press ??
                    onPress={() => {
                        router.push('/(dataEntry-sidenav)/caregiverContact')
                    }}
                    isNext={ true }
                    label='Next'
                />
            </View>
        </SafeAreaView>
    );
}