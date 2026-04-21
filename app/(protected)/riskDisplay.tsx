import RiskCard from '@/src/components/RiskCard';
import { Diagnosis } from '@/src/contexts/Diagnosis';
import { RiskAssessment } from '@/src/models/types';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, useTheme } from 'react-native-paper';


export default function RiskDisplay() {
  const { colors } = useTheme();
  const [isConditionsExpanded, setIsConditionsExpanded] = useState<boolean>(false);

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
  const getTopConditions = (): { display: string[];  remaining: string[]; hasMore: boolean; hiddenCount: number } => {
    if (!diagnosis || (diagnosis.positive.length === 0 && diagnosis.suspected.length === 0)) {
      return { display: [], remaining: [], hasMore: false, hiddenCount: 0 };
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
      if (criticalConditions.includes(condition)) {
        critical.push(`${condition} (suspected)`);
      } else {
        other.push(`${condition} (suspected)`);
      }
    });
    
    // Build display list: critical conditions first, then fill remaining slots
    const displayList: string[] = [...critical];
    const remainingSlots = 3 - critical.length;
    
    if (remainingSlots > 0) {
      displayList.push(...other.slice(0, remainingSlots));
    }

    const remainingConditions = other.slice(remainingSlots > 0 ? remainingSlots : 0);
    const totalConditions = critical.length + other.length;
    const hiddenCount = totalConditions - displayList.length;
    
    return {
      display: displayList,
      remaining: remainingConditions,
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
                containerStyle={{alignItems: 'center'}}
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
            
            {/* TODO - map conditions to interventions */}
            <RiskCard
                title={getTotalConditionsCount() > 0 ? 'Relevant Morbidities' : 'No Conditions Recorded'}
                expandable={conditionsData.hasMore} // expands if more than 3 conditions
                onExpandChange={setIsConditionsExpanded}
                content={
                  conditionsData.display.length === 0 ? (
                    'No conditions recorded'
                  ) : (
                    <View style={{ marginTop: 4, marginBottom: 8 }}>
                      {conditionsData.display.map((condition, index) => (
                        <View 
                          key={`display-${index}`}
                          style={{ 
                            alignItems: 'flex-start',
                            flexDirection: 'row',
                            marginBottom: 6
                          }}
                        >
                          <MaterialIcons 
                            name="check-circle" 
                            size={12} 
                            color={colors.primary}
                            style={{ marginRight: 8, marginTop: 5 }}
                          />
                          <Text style={{ fontSize: 16, lineHeight: 22 }}>
                            {condition}
                          </Text>
                        </View>
                      ))}
                      
                      {/* Show count of additional conditions */}
                      {!isConditionsExpanded && conditionsData.hasMore && (
                        <Text style={{ 
                          fontSize: 14, 
                          fontStyle: 'italic', 
                          color: '#666',
                          marginTop: 4,
                          marginLeft: 20
                        }}>
                          +{conditionsData.hiddenCount} more condition{conditionsData.hiddenCount > 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  )
              }
            >
              {/* Show remaining conditions when expanded */}
              {conditionsData.remaining.length > 0 && (
                <View style={{ marginTop: -15, marginBottom: 8}}>
                  {conditionsData.remaining.map((condition, index) => (
                    <View 
                      key={`remaining-${index}`}
                      style={{ 
                        alignItems: 'flex-start',
                        flexDirection: 'row',
                        marginBottom: 6
                      }}
                    >
                      <MaterialIcons 
                        name="check-circle" 
                        size={12} 
                        color={colors.primary}
                        style={{ marginRight: 8, marginTop: 5 }}
                      />
                      <Text style={{ fontSize: 16, lineHeight: 22 }}>
                        {condition}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* TODO - add view careplan button */}
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