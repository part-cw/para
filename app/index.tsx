import { router } from 'expo-router';
import { Text, View } from "react-native";
import { Button, useTheme } from 'react-native-paper';


export default function Index() {
  const {colors} = useTheme();
  return (
    <>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{paddingBlock: 50}}>TODO Edit app/index.tsx to edit home screen.</Text>
        <Button style={{ alignSelf: 'center' }}
                buttonColor={colors.primary} 
                textColor={colors.onPrimary} 
                icon= 'plus'
                mode="elevated" 
                onPress={() => {
                  router.push('../(dataEntry-sidenav)/patientInformation')
                  }}>
            Add Patient
          </Button>
      </View>
    </>
  );
}