import PatientCard from '@/src/components/PatientCard';
import { PatientData } from '@/src/contexts/PatientData';
import { useStorage } from '@/src/contexts/StorageContext';
import { RiskAssessment } from '@/src/models/types';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from '@/src/utils/ageCalculator';
import { formatName } from '@/src/utils/formatUtils';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, Text, View } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { Button, SegmentedButtons, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function PatientRecords() {
  const { storage } = useStorage();
  const { colors } = useTheme()

  const [ records, setRecords ] = useState<PatientData[]>([])
  const [riskAssessments, setRiskAssessments] = useState<Map<string, RiskAssessment>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  // Load drafts on mount
  useEffect(() => {
    loadAllRecords();
  }, []);

  const loadAllRecords = async () => {
    try {
      setLoading(true)
      
      const records = await storage.getSubmittedPatients();
      setRecords(records);

      // Load risk assessments for all patients
      const assessments = new Map<string, RiskAssessment>();
      for (const patient of records) {
        if (patient.patientId) {
          try {
            const assessment = await storage.getRiskAssessment(patient.patientId);
            assessments.set(patient.patientId, assessment);
          } catch (error) {
            console.warn(`Could not load risk assmessment for ${patient.patientId}`);
          }
        }
      }
      setRiskAssessments(assessments);
      
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

  // If discharged patient use discharge riskC, if not discharged use admission risk category
  const handleGetRiskCategory =  (patientId: string): string => {
    const assessment = riskAssessments.get(patientId);

    if (!assessment) return 'none'
    if (assessment.discharge) return assessment.discharge.riskCategory; 
    if (assessment.admission) return assessment.admission.riskCategory; // TODO - make sure this is the most recent admission risk
    return 'none'; // default if not risk assmessents
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
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background, marginTop: -50}}>
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

        {/* Filter Buttons */}
        <View style={{paddingHorizontal: 16, paddingVertical: 8}}>
          <SegmentedButtons
            value={filter}
            onValueChange={setFilter}
            buttons={[
              { value: 'all', label: 'All', 
                style: {backgroundColor: filter === 'all' ? colors.primaryContainer : 'white'},
              },
              { value: 'active', label: 'Active',
                style: {backgroundColor: filter === 'active' ? colors.primaryContainer : 'white'},
              },
              { value: 'discharged', label: 'Discharged',
                style: {backgroundColor: filter === 'discharged' ? colors.primaryContainer : 'white'},
              },
            ]}
            style={{elevation: 1}}
            
          />
        </View>

        {/* Search Bar -- TODO uncomment and continue implementation */}
        {/* <View style={{paddingHorizontal: 16, paddingVertical: 5}}>
          <Searchbar
            placeholder="Search by name or ID"
            onChangeText={() => console.log('blah')}
            value={''}
            style={{
              backgroundColor: colors.secondary, 
              height: 40, 
              width: '60%',
            }} 
            inputStyle={{fontSize: 14, padding: 0, alignSelf: 'center'}}
            iconColor={colors.primary}
            elevation={1}
          />
        </View> */}


        {records.map((p) => {
          const name = formatName(p.firstName, p.surname, p.otherName);
          const age = AgeCalculator.formatAge(p.ageInMonths as number);
          const risk = handleGetRiskCategory(p.patientId as string);

          /**
           * TODO: implement the following helpers
           * - handleGetRiskProfile
           */

          return (
           <PatientCard 
              key={p.patientId} 
              id={p.patientId as string} 
              name={name} 
              age={`${age} old`}
              status={p.isDischarged ? 'discharged' : 'active'} 
              isDischarged={false} 
              isDraft={false}
              riskCategory={ risk.toLowerCase() }
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