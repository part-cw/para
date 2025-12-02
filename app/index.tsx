import { router } from "expo-router";
import { View } from "react-native";
import { Button, useTheme } from 'react-native-paper';


export default function Index() {
  const { colors } = useTheme();

  return (
    <>
      <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50}}>
        <Button 
          style={{ alignSelf: 'center', marginVertical: 10 }}
          buttonColor={colors.primary} 
          textColor={colors.onPrimary} 
          icon= 'plus'
          mode="elevated" 
          onPress={() => {router.push('/(admission-sidenav)/patientInformation')}}
        >
          Add Patient
        </Button>

        <Button 
          style={[{ alignSelf: 'center' }, {marginVertical: 10}]}
          buttonColor={colors.primary} 
          textColor={colors.onPrimary} 
          icon= 'account-group'
          mode="elevated" 
          onPress={() => {router.push('/patientRecords')}}
        >
          Patient Records
        </Button>

        <Button 
          style={[{ alignSelf: 'center' }, {marginVertical: 10}]}
          buttonColor={colors.primary} 
          textColor={colors.onPrimary} 
          icon= 'folder'
          mode="elevated" 
          onPress={() => {router.push('/drafts')}}
        >
          Resume Drafts
        </Button>
      </View>
    </>
  );
}