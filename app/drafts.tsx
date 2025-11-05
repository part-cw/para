import PatientCard from '@/src/components/PatientCard';
import { PatientData } from '@/src/contexts/PatientData';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { useStorage } from '@/src/contexts/StorageContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { formatDateString, formatName } from '@/src/utils/formatUtils';
import { PatientIdGenerator } from '@/src/utils/patientIdGenerator';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, RefreshControl, Text, View } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO - fix handleResume - app breaks when we go to dataEntry UI with incomplete data 
// - get lots of errors 

export default function DraftAdmissions() {
  const { storage } = useStorage();
  const { loadDraft } = usePatientData();
  const { colors } = useTheme()

  const [ drafts, setDrafts ] = useState<PatientData[]>([])
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load drafts on mount
  useEffect(() => {
    loadAllDrafts();
  }, []);

  const loadAllDrafts = async () => {
    try {
      setLoading(true)
      
      const drafts = await storage.getDraftPatients();
      setDrafts(drafts);
      
      console.log(`📋 Loaded ${drafts.length} drafts`);
    } catch (error) {
      console.error('Error loading drafts:', error);
      Alert.alert('Error', 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllDrafts();
    setRefreshing(false);
  }

  const handleResume = async (id: string) => {
    try {
      // load draft into context
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

        // reload page
        await loadAllDrafts();
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

  if (drafts.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'flex-start', alignItems: 'center'}}>
        <Text style={{ fontSize: 18, marginBottom: 16, color: colors.primary, fontWeight: 'bold' }}>No Draft Admissions</Text>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          Draft admissions will appear here when you start a patient admission and leave before submitting.
        </Text>
        <Button 
          style={{ alignSelf: 'center', marginTop: 10 }}
          buttonColor={colors.primary} 
          textColor={colors.onPrimary} 
          icon= 'plus'
          mode="outlined" 
          onPress={() => {
            router.push('/(dataEntry-sidenav)/patientInformation')
          }}
        >
          Add Patient
        </Button>
      </SafeAreaView>
    );
  }

  // retrurns a loading screen with spinner - TODO - make this a separate component, with text as prop?
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading drafts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white', marginTop: -50}}>
      <ScrollView 
        contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0, paddingBottom: 20}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/> }
      >
        {/* Header */}
        <View style={[Styles.pageHeaderContainer]}>
          <Text style={[Styles.pageHeaderTitle ]}>
              Draft Admissions
          </Text>
          {/* draft counter -- TODO - remove? */}
          {/* <Text style={{ fontSize: 14, color: colors.outline }}>
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
          </Text> */}
        </View>
        
        {/* TODO - change/remove horizontal padding? */}
        <View style={{ paddingHorizontal: 10 }}>
          {drafts.map((p) => {
            const name = formatName(p.firstName, p.surname, p.otherName)
            return (
              <PatientCard 
                key={p.patientId} 
                id={p.patientId as string} 
                name={name} 
                age={`${p.ageInMonths} months`}
                status={'draft'}
                isDischarged={false}
                isDraft={true}
                admittedAt={p.admissionStartedAt && formatDateString(p.admissionStartedAt)}  
                onResume={() => handleResume(p.patientId as string)}
                onDelete={() => handleDelete(p.patientId as string, name)}         
              />
            );}
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}