import RiskCard from '@/src/components/RiskCard';
import { RiskAssessment } from '@/src/models/types';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, useTheme } from 'react-native-paper';

// TODO - make this also work for discharge risk

export default function RiskDisplay() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  // parse params
  const patientId = params.patientId as string;
  const patientName = params.patientName as string;
  const riskAssessment: RiskAssessment | null = params.riskAssessment ? JSON.parse(params.riskAssessment as string) : null;

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
                Calculated risk level at admission time for{' '}
              </Text>
              <Text style={{fontSize: 16, fontWeight: 'bold', flexShrink: 1,  color: colors.primary}}>
                {patientName}:
              </Text> 
            </View>

              <RiskCard
                title={admission?.riskCategory.toUpperCase()}
                variant={admission?.riskCategory.toLowerCase()}
                content={`Risk score = ${admission?.riskScore}%`}
                expandable={true}
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
            
            <Text style={{fontSize: 16, fontWeight: 'bold', margin: 10}}>Risk Profile:</Text>
            
            {/* TODO - map conditions to profile */}
            <RiskCard
                title='Profile A'
                expandable={true}
                content='Conditions 1, 2, 3'
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