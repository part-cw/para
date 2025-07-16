import { router } from 'expo-router';
import { Text } from "react-native";
import { Button, useTheme } from 'react-native-paper';


export default function Index() {
  const {colors} = useTheme();
  return (
    <>
      <Text>TODO Edit app/index.tsx to edit home screen.</Text>
      <Button style={{ width: 110}}
              buttonColor={colors.primary} 
              textColor={colors.onPrimary} 
              icon= 'plus'
              mode="elevated" 
              onPress={() => {
                router.push('../(dataEntry-sidenav)/patientInformation')
                console.log('Pressed')
                }}>
          Add Child
        </Button>

    </>
  );
}