import { RiskAssessment } from '@/src/models/types';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function RiskDisplay() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  // parse params
  const patientId = params.patientId as string;
  const patientName = params.patientName as string;
  const riskAssessment: RiskAssessment | null = params.riskAssessment 
                                                ? JSON.parse(params.riskAssessment as string) 
                                                : null;

  // Handle missing data
  if (!riskAssessment || !patientId || !patientName) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', padding: 20}}>
        <MaterialIcons name="error-outline" size={64} color={colors.error} />
        <Text style={{fontSize: 18, marginTop: 16, textAlign: 'center'}}>
          No risk assessment data available
        </Text>
        <Button 
          mode="contained" 
          onPress={() => router.back()}
          style={{marginTop: 20}}
        >
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  const admission = riskAssessment.admission;
  const discharge = riskAssessment.discharge;
  
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[Styles.pageHeaderContainer, {backgroundColor: colors.primaryContainer}]}>
          <Text style={[Styles.pageHeaderTitle, {fontSize: 20}, {fontWeight: 'bold'}, { color: colors.onPrimaryContainer } ]}>
              Risk Prediction for {patientName}
          </Text>
        </View>

        <Text style={{margin: 10}}>Calculated Risk Level</Text>
        <Card style={[Styles.cardWrapper, { marginBottom: 16, padding: 8}]}>
          <Card.Content>
            <Text style={{fontWeight: 'bold'}}>Risk Category: {admission?.riskCategory}</Text>
            <Text style={{fontWeight: 'bold'}}>Risk Score: {admission?.riskScore} </Text>
            <Text>TODO - add details + color change by risk category </Text>
          </Card.Content>
        </Card>
        
        <Text style={{margin: 10}}>Risk Profile</Text>
        <Card style={[Styles.cardWrapper, { marginBottom: 16, padding: 8}]}>
          <Card.Content>
            <Text>
              TODO -- add profile + make card expandable
            </Text>
          </Card.Content>
        </Card>

        <Button
          style={{ alignSelf: 'center' }}
          mode="elevated"
          buttonColor={colors.primary}
          textColor={colors.onPrimary}
          onPress={() => router.replace('/patientRecords')}
        >
          Patient Records
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}