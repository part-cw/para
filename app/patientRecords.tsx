import PatientCard from '@/src/components/PatientCard';
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
    isDraft: false,
    isDischarged: false,
  },
  {
    id: 'BUIKWE-A-0002',
    name: 'Jane Doe',
    age: '2 years',
    status: 'active',
    riskLevel: 'moderate',
    riskProfile: [],
    isDraft: false,
    isDischarged: false,
  },
  {
    id: 'BUIKWE-A-0003',
    name: 'Emma Stone',
    age: '6 months',
    status: 'discharged',
    riskLevel: 'high',
    riskProfile: [],
    isDraft: false,
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
    isDraft: false,
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
           <PatientCard 
              key={p.id} 
              id={p.id} 
              name={p.name} 
              age={p.age}
              status={p.status} 
              isDischarged={p.isDischarged} 
              isDraft={p.isDraft}
              riskLevel={p.riskLevel}
              riskProfile={p.riskProfile}
              recommendedCareplan={p.recommendedCareplan}
              onEdit={() => console.log('editing record...')}
              onArchive={() => console.log('archiving record...')}
              onDischarge={() => console.log('discharging patient...')}              
            />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}