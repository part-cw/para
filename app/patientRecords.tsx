import PatientCard from '@/src/components/PatientCard';
import { PatientData } from '@/src/contexts/PatientData';
import { useStorage } from '@/src/contexts/StorageContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { formatName } from '@/src/utils/formatUtils';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, Text, View } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function PatientRecords() {
  const { storage } = useStorage();
  const { colors } = useTheme()

  const [ records, setRecords ] = useState<PatientData[]>([])
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load drafts on mount
  useEffect(() => {
    loadAllRecords();
  }, []);

  const loadAllRecords = async () => {
    try {
      setLoading(true)
      
      const records = await storage.getSubmittedPatients();
      setRecords(records);
      
      console.log(`📋 Loaded ${records.length} patient records`);
    } catch (error) {
      console.error('Error loading records:', error);
      Alert.alert('Error', 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllRecords();
    setRefreshing(false);
  }

  // TODO
  const handleGetRiskLevel = (patientId: string): string => {
    return 'low'; // stub
  }

  // returns 'No Records' display and prompt user to add patient
  if (records.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 30}}>
        <Text style={{ fontSize: 24, marginBottom: 16, color: colors.primary, fontWeight: 'bold' }}>No Patient Records</Text>
        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          Completed records will appear here when you submit a new patient or complete a draft admission.
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
        <Button 
          style={{ alignSelf: 'center', marginTop: 10 }}
          buttonColor={colors.primary} 
          textColor={colors.onPrimary} 
          icon= 'folder'
          mode="outlined" 
          onPress={() => {
            router.push('/drafts')
          }}
        >
          Resume Draft
        </Button>
      </SafeAreaView>
    );
  }

  // retrurns a loading screen with spinner
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading records...</Text>
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
              Patient Records 
          </Text>
        </View>

        {records.map((p) => {
          const name = formatName(p.firstName, p.surname, p.otherName)
          const risk = handleGetRiskLevel(p.patientId as string);

          /**
           * TODO: implement the following helpers
           * 1. formatAge - conert ageinmonths to displays...or use what's already in utils?
           * 2. mapStatusFlags --convert flags (isDischarged, isArchived, isDraft) to text
           * 3. hadnleGetRiskLevel
           * 4. handleGetRiskProfile
           */
          
          return (
           <PatientCard 
              key={p.patientId} 
              id={p.patientId as string} 
              name={name} 
              age={`${p.ageInMonths} months`}
              status={'todo - mapstatus'} 
              isDischarged={false} 
              isDraft={false}
              riskLevel={risk}
              // riskProfile={p.riskProfile}
              // recommendedCareplan={p.recommendedCareplan}
              onEdit={() => console.log('TODO: editing record...')}
              onArchive={() => console.log('TODO: archiving record...')}
              onDischarge={() => console.log('TODO: discharging patient...')}              
            />
          )
        })}

      </ScrollView>
    </SafeAreaView>
  );
}