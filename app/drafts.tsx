import PatientCard from '@/src/components/PatientCard';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { Text, View } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO - get patient data from storage

export default function DraftAdmissions() {

  const dummyPatients = [
  {
    id: 'BUIKWE-A-0001',
    name: '',
    age: '3 years',
    status: 'draft',
    isDraft: true,
    isDischarged: false,
    admittedAt: '2025-10-01'
  },
  {
    id: 'BUIKWE-A-0002',
    name: 'Jane Doe',
    status: 'draft',
    isDraft: true,
    isDischarged: false,
    admittedAt: '2025-10-02'
  },
  {
    id: 'BUIKWE-A-0003',
    name: 'Emma Stone',
    age: '6 months',
    status: 'draft',
    isDraft: true,
    isDischarged: false,
    admittedAt: '2025-10-03'
  },
  {
    id: 'BUIKWE-A-0004',
    name: 'Daniel Radcliff',
    age: '1 year',
    status: 'draft',
    isDraft: true,
    isDischarged: false,
    admittedAt: '2025-10-04'
  },
];

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white', marginTop: -50}}>
      <ScrollView contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0}}>
        {/* Header */}
        <View style={[Styles.pageHeaderContainer]}>
          <Text style={[Styles.pageHeaderTitle ]}>
              Draft Admissions
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
            admittedAt={p.admittedAt}           
          />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}