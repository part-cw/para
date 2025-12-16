import RiskCard from '@/src/components/RiskCard';
import { Diagnosis } from '@/src/contexts/Diagnosis';
import { RiskAssessment } from '@/src/models/types';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, useTheme } from 'react-native-paper';


export default function RiskDisplay() {
  const { colors } = useTheme();
  
  const params = useLocalSearchParams();

  // parse params
  const patientId = params.patientId as string;
  const patientName = params.patientName as string;
  const riskAssessment: RiskAssessment | null = params.riskAssessment ? JSON.parse(params.riskAssessment as string) : null;
  const diagnosis: Diagnosis | null = params.diagnosis ? JSON.parse(params.diagnosis as string) : null;


  // Handle missing data
  if (!riskAssessment || !patientId || !patientName) {
    return (
      <View style={{flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', padding: 20}}>
        <MaterialIcons name="error-outline" size={64} color={colors.error} />
        <Text style={{fontSize: 18, marginTop: 16, textAlign: 'center'}}>
          No risk assessment data available
        </Text>
        <Text style={{fontSize: 14, marginTop: 16, textAlign: 'center'}}>
          Please make sure all clinical variable are entered
        </Text>
        <Button 
          mode="contained" 
          onPress={() => router.back()}
          style={{marginTop: 20}}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const admission = riskAssessment.admission;
  const discharge = riskAssessment.discharge;

  const riskScore = discharge ? discharge.riskScore : admission?.riskScore;
  const riskCategory = discharge ? discharge.riskCategory : admission?.riskCategory;

  // Get top 3 conditions to display with guaranteed critical conditions
  const getTopConditions = (): { display: string[]; hasMore: boolean; hiddenCount: number } => {
    if (!diagnosis || (diagnosis.positive.length === 0 && diagnosis.suspected.length === 0)) {
      return { display: [], hasMore: false, hiddenCount: 0 };
    }
    
    // Critical conditions that MUST always be shown if present
    const criticalConditions = [
      'Sick Young Infant',
      'Severe Acute Malnutrition (SAM)',
      'Severe Anaemia'
    ];

    // Separate conditions into critical and other
    const critical: string[] = [];
    const other: string[] = [];

    // Process positive conditions
    diagnosis.positive.forEach(condition => {
      if (criticalConditions.includes(condition)) {
        critical.push(condition);
      } else {
        other.push(condition);
      }
    });

    // Process suspected conditions  
    diagnosis.suspected.forEach(condition => {
      const displayCondition = `${condition} (suspected)`;
      if (criticalConditions.includes(condition)) {
        critical.push(displayCondition);
      } else {
        other.push(displayCondition);
      }
    });
    
    // Build display list: critical conditions first, then fill remaining slots
    const displayList: string[] = [...critical];
    const remainingSlots = 3 - critical.length;
    
    if (remainingSlots > 0) {
      displayList.push(...other.slice(0, remainingSlots));
    }

    const totalConditions = critical.length + other.length;
    const hiddenCount = totalConditions - displayList.length;
    
    return {
      display: displayList,
      hasMore: hiddenCount > 0,
      hiddenCount
    };
  };

  // Get count of all conditions for display
  const getTotalConditionsCount = (): number => {
    if (!diagnosis) return 0;
    return diagnosis.positive.length + diagnosis.suspected.length;
  };

  const conditionsData = getTopConditions();
  
  return (
    <>
    {riskAssessment 
      ? 
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <ScrollView contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0}}>
          {/* Header */}
          <View style={[Styles.pageHeaderContainer]}>
            <Text style={[Styles.pageHeaderTitle ]}>
                Mortality Risk Prediction 
            </Text>
          </View>

          <View style={{padding: 20}}>
            <View style={{margin: 10, flexDirection: 'row',  flexWrap: 'wrap'}}>
              <Text style={{fontSize: 16, fontWeight: 'bold', flexShrink: 1}}>
                Calculated risk level at {!discharge ? 'admission' : 'discharge'} time for{' '}
              </Text>
              <Text style={{fontSize: 16, fontWeight: 'bold', flexShrink: 1,  color: colors.primary}}>
                {patientName}:
              </Text> 
            </View>

              <RiskCard
                title={riskCategory?.toUpperCase()}
                variant={riskCategory?.toLowerCase()}
                content={`Risk score = ${riskScore}%`}
                expandable={false}
              >
                {/* TODO - fix children */}
                <Text>
                    Top predictors...TODO
                </Text>
                <Button
                  style={{ alignSelf: 'center', marginTop: 20 }}
                  mode="elevated"
                  buttonColor={colors.tertiary}
                  textColor={colors.onTertiary}
                  onPress = {() => alert('blah blah -- TODO')}
                >
                  More Info
                </Button>
              </RiskCard>
            
            <Text style={{fontSize: 16, fontWeight: 'bold', margin: 10}}>{!discharge ? 'Admission Diagnosis' : 'Dicharge Diagnosis'}</Text>
            
            {/* TODO - map conditions to profile */}
            <RiskCard
                title={getTotalConditionsCount() > 0 ? 'Relevant Morbidities' : 'No Conditions Recorded'}
                expandable={false} // TODO change to true once careplan implenetd
                content={conditionsData.display.length === 0 ? 'No conditions recorded' : undefined}

            >
              {/* TODO - fix children */}
              <Text>
                Recommended careplan
              </Text>
            </RiskCard>

            <Button
              style={{ alignSelf: 'center', marginTop: 20 }}
              mode="elevated"
              buttonColor={colors.primary}
              textColor={colors.onPrimary}
              onPress={() => router.replace('/patientRecords')}
            >
              Patient Records
            </Button>
          </View>
        </ScrollView>
      </View>
      :
      null
    }
    </>
  );
}