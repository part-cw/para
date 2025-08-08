// import PaginationControls from '@/components/PaginationControls';
// import SearchableDropdown from '@/components/SearchableDropdown';
// import { GlobalStyles as Styles } from '@/themes/styles';
// import { router } from 'expo-router';
// import { useState } from 'react';
// import { View } from 'react-native';
// import { ScrollView } from 'react-native-gesture-handler';
// import { Card, List, Text, useTheme } from 'react-native-paper';
// import { SafeAreaView } from 'react-native-safe-area-context';


// // TODO:
// // - village required - error if left blank 
// // - data persisted when accordions close/open and when navigate away
// // - make village selection filter down vht name and vice versa
// // write util function to covert csv to usable dataset for searchable dropdown componenet

// export default function VHTReferralScreen() {
//     // TODO - add more states
//     const { colors } = useTheme()
    
//     const [selectedValue, setSelectedValue] = useState<string>('');
//     const handleSelectionChange = (value: string) => {
//         setSelectedValue(value);
//     };

//     // TODO convert csv data into dataset of this format
//     // TODO filter VHT name list based on
//     const testData3: string[] = [
//         'Apple',
//         'Banana',
//         'Cherry',
//         'Date',
//         'Elderberry',
//         'Fig',
//         'Grape',
//         'Honeydew',
//     ];

//     return (
//         <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
//             <ScrollView contentContainerStyle={{ padding: 20 }}>
//                 {/* <DebugStack/> */}
//                 <Card style={Styles.cardWrapper}>
//                     <Card.Content>
//                         <Text variant="bodyLarge">
//                             To connect the patient to a local health worker who can follow 
//                             up with them, enter the village near to where they will stay one
//                             week after discharge and their VHT's contact information.      
//                         </Text>
//                     </Card.Content>
//                 </Card>

//                 <List.Section>
//                     {/* Location Card */}
//                     <View style={Styles.accordionListWrapper}>
//                         <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
//                             <List.Icon icon="map-marker" color={colors.primary} />
//                             <Text style={Styles.cardTitle}>Patient Address</Text>
//                         </View>
//                         <View style={Styles.accordionContentWrapper}>
//                             <SearchableDropdown
//                                 data={testData3}
//                                 label="Village (required)"
//                                 placeholder='Enter village name'
//                                 onSelect={handleSelectionChange}
//                                 value={selectedValue}
//                             />
//                             <SearchableDropdown
//                                 data={testData3}
//                                 label="Health Facility (optional)"
//                                 placeholder='Enter HC name'
//                                 onSelect={handleSelectionChange}
//                                 value={selectedValue}
//                             />
//                         </View>
//                     </View>

//                     {/* VHT Contact Info Card*/}
//                     <View style={Styles.accordionListWrapper}>
//                         <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
//                             <List.Icon icon="doctor" color={colors.primary} />
//                             <Text style={Styles.cardTitle}>VHT Contact Information</Text>
//                         </View>
//                         <View style={Styles.accordionContentWrapper}>
//                             <SearchableDropdown
//                                 data={testData3}
//                                 label="Name"
//                                 placeholder='Enter VHT name'
//                                 onSelect={handleSelectionChange}
//                                 value={selectedValue}
//                             />

//                             <SearchableDropdown
//                                 data={testData3}
//                                 label="Telephone"
//                                 placeholder='Enter VHT telephone number'
//                                 onSelect={handleSelectionChange}
//                                 value={selectedValue}
//                             />
//                         </View>
//                     </View>

//                 </List.Section>
//             </ScrollView>

//             <PaginationControls
//                 showPrevious={true}
//                 showNext={true}
//                 onPrevious={() => router.push('/(dataEntry-sidenav)/medicalConditions')}
//                 onNext={() => router.push('/(dataEntry-sidenav)/caregiverContact')}
//             />  
//         </SafeAreaView>
//     );
// }
