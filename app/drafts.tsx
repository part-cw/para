import PatientCard from '@/src/components/PatientCard';
import { PatientData } from '@/src/contexts/PatientData';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { useStorage } from '@/src/contexts/StorageContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { formatDateString, formatName } from '@/src/utils/formatUtils';
import { PatientIdGenerator } from '@/src/utils/patientIdGenerator';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Text, View } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO - get patient data from storage

export default function DraftAdmissions() {
  const { storage } = useStorage();
  const { loadDraft } = usePatientData();

  const [ drafts, setDrafts ] = useState<PatientData[]>([])
  // const [loading, setLoading] = useState(true);
  // const [refreshing, setRefreshing] = useState(false);



  // // Load drafts on mount
  // useEffect(() => {
  //   loadDrafts();
  // }, []);

  // TODO implement loaddrafts function to refresh current draft lists - 
  // get drafts on mount, update list whenever patients deleted?
  useEffect(() => {
    const getDrafts = async () => {
        const drafts = await storage.getDraftPatients();
        setDrafts(drafts);
    }

    getDrafts();
  }, [drafts])


  const handleResume = async (id: string) => {
    try {
      await loadDraft(id); 
      
      // navigate to data entry screen with params
      router.push({
        pathname: '/(dataEntry-sidenav)/patientInformation',
        params: {
          resuming: 'true',
          draftId: id
        }
      })

    } catch (error) {
      console.error('Error resuming draft:', error);
      Alert.alert('Error', 'Failed to load draft');
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    const confirmDelete = async () => {
      try {
        await PatientIdGenerator.recyclePatientId(id);
        await storage.deleteDraft(id);
        // TODO call functions to reload draft lists
      } catch (error) {
        console.error(`Error deleting draft ${id}: `, error)
        Alert.alert('Error', 'Failed to delete draft. Please try again.');
      }
    };
    
      // Show confirmation
      if (Platform.OS === 'web') {
        if (window.confirm(`Delete draft for ${name}? All patient data will be lost.`)) {
          await confirmDelete();
        }
      } else {
        Alert.alert(
          'Delete Draft?',
          `Are you sure you want to delete the draft for ${name}? All patient data will be lost`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: confirmDelete }
          ]
        );
      }
    
  };

  // TODO make this look better
  if (drafts.length === 0) {
    return (
      <View>
        <Text>No Drafts...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white', marginTop: -50}}>
      <ScrollView contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0}}>
        {/* Header */}
        <View style={[Styles.pageHeaderContainer]}>
          <Text style={[Styles.pageHeaderTitle ]}>
              Draft Admissions
          </Text>
        </View>

        {drafts.map((p) => (
          <PatientCard 
            key={p.patientId} 
            id={p.patientId as string} 
            name={formatName(p.firstName, p.surname, p.otherName)} 
            age={`${p.ageInMonths} months`}
            status={'draft'}
            isDischarged={false}
            isDraft={true}
            admittedAt={p.admissionStartedAt && formatDateString(p.admissionStartedAt)}  
            onResume={() => handleResume(p.patientId as string)}
            onDelete={() => handleDelete(p.patientId as string, formatName(p.firstName, p.surname, p.otherName))}         
          />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}