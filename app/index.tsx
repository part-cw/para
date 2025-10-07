import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, useTheme } from 'react-native-paper';


export default function Index() {
  const { colors } = useTheme();

  return (
    <>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {/* <DebugStack/> */}
        <Text style={{paddingBlock: 50}}>TODO Edit app/index.tsx to edit home screen.</Text>
        <Button style={{ alignSelf: 'center' }}
                buttonColor={colors.primary} 
                textColor={colors.onPrimary} 
                icon= 'plus'
                mode="elevated" 
                onPress={() => {
                  router.push('/(dataEntry-sidenav)/patientInformation')
                  }}>
            Add Patient
        </Button>

        <Button style={[{ alignSelf: 'center' }, {marginTop: 10}]}
                buttonColor={colors.primary} 
                textColor={colors.onPrimary} 
                icon= 'account-group'
                mode="elevated" 
                onPress={() => {
                  router.push('/patientRecords')
                  }}>
            Patient Records
        </Button>

        {/* TODO - delete ! for testing purposes only */}
        <Button style={[{ alignSelf: 'center' }, {marginTop: 10}]}
                buttonColor={colors.primary} 
                textColor={colors.onPrimary} 
                mode="elevated" 
                onPress={() => {
                  router.push('/riskDisplay')
                  }}>
            Risk Display
        </Button>
      </View>
    </>
  );
}