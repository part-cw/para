import PatientCard, { PatientCardType } from '@/src/components/PatientCard';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { Text, View } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO - get patient data from storage

export default function PatientRecords() {

  const dummyPatients = [
  {
    id: 'BUIKWE-A-0001',
    name: 'John Doe',
    age: '3 years',
    status: 'active',
    riskLevel: 'low',
    riskProfile: [],
    isDischarged: false,
  },
  {
    id: 'BUIKWE-A-0002',
    name: 'Jane Doe',
    age: '2 years',
    status: 'active',
    riskLevel: 'moderate',
    riskProfile: [],
    isDischarged: false,
  },
  {
    id: 'BUIKWE-A-0003',
    name: 'Emma Stone',
    age: '6 months',
    status: 'discharged',
    riskLevel: 'high',
    riskProfile: [],
    isDischarged: true,
  },
  {
    id: 'BUIKWE-A-0004',
    name: 'Daniel Radcliff',
    age: '1 year',
    status: 'active',
    riskLevel: 'very high',
    riskProfile: [],
    recommendedCareplan: ['Video Title 1', 'Video Title 2'],
    isDischarged: false,
  },
];

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white', marginTop: -50}}>
      <ScrollView contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0}}>
        {/* Header */}
        <View style={[Styles.pageHeaderContainer]}>
          <Text style={[Styles.pageHeaderTitle ]}>
              Patient Records 
          </Text>
        </View>

        {dummyPatients.map((p) => (
          <PatientCard key={p.id} patient={p as PatientCardType} />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}