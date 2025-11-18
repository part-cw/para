import PatientCard from '@/src/components/PatientCard';
import { PatientData } from '@/src/contexts/PatientData';
import { useStorage } from '@/src/contexts/StorageContext';
import { RiskAssessment } from '@/src/models/types';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from '@/src/utils/ageCalculator';
import { formatName } from '@/src/utils/formatUtils';
import { normalizeBoolean } from '@/src/utils/normalizer';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, Text, View } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { Button, SegmentedButtons, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'all' | 'active' | 'discharged';

export default function PatientRecords() {
  const { storage } = useStorage();
  const { colors } = useTheme()

  const [ records, setRecords ] = useState<PatientData[]>([])
  const [riskAssessments, setRiskAssessments] = useState<Map<string, RiskAssessment>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [filteredPatients, setFilteredPatients] = useState<PatientData[]>([]);


  // Load drafts on mount
  useEffect(() => {
    loadAllRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, filter]);


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

  const filterRecords = () => {
    let filtered = [...records];

    switch (filter) {
      case 'active':
        filtered = filtered.filter(p => !p.isDraftAdmission && !p.isDischarged && !p.isArchived);
        break;
      case 'discharged':
        filtered = filtered.filter(p => p.isDischarged);
        break;
      case 'all':
      default:
        // Show all non-draft and non-archived patients
        filtered = filtered.filter(p => !p.isDraftAdmission && !p.isArchived);
        break;
    }

    setFilteredPatients(filtered)
  }

  const handleEdit = async (id: string) => {
    router.push({
      pathname: '/editPatient',
      params: {
        patientId: id
      }
    })
  }

  const handleDischarge = async (patientId: string) => {
    await storage.updatePatient(patientId, {isDischarged: true})
    alert('TODO - event handler implementation in progress')
    // TODO - enter discharge workflow
    // allow edit medical conditions
    // add VHT and caregiver info if not already complete  
    // collect discharge variables
    // calculate risk prediction & update risk assessment with discharge calc
    // go to risk display - have buttons to go back to records
    // 
    await onRefresh(); // TODO remove
  }

  const handleArchive = async (id: string) => {
    console.log('TODO: archiving record...')
    alert('Event handler not implemented')
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


        {filteredPatients.map((p) => {
          const name = formatName(p.firstName, p.surname, p.otherName);
          const age = AgeCalculator.formatAge(p.ageInMonths as number);
          const ageDisplay = age && age.trim() ? `${age} old` : undefined;
          const risk = handleGetRiskCategory(p.patientId as string);

          // deceased patients are a subcategory of discharged
          const status = 
            p.isDischarged 
            ? (p.dischargeReason === 'deceased' ? 'deceased' : 'discharged') 
            : 'active';

          {/*
            TODO: implement the following helpers
            - handleGetRiskProfile
           */}

          return (
           <PatientCard 
              key={p.patientId as string} 
              id={p.patientId as string} 
              name={name} 
              age={ageDisplay}
              status={status} 
              isDischarged={normalizeBoolean(p.isDischarged as boolean)} 
              isDraft={normalizeBoolean(p.isDraftAdmission as boolean)}
              riskCategory={ risk.toLowerCase() }
              // riskProfile={p.riskProfile}
              // recommendedCareplan={p.recommendedCareplan}
              onEdit={() => handleEdit(p.patientId as string)}
              onArchive={() => handleArchive(p.patientId as string)}
              onDischarge={() => handleDischarge(p.patientId as string)}              
            />
          )
        })}

      </ScrollView>
    </SafeAreaView>
  );
}