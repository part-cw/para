import { router } from 'expo-router';
import { Text } from "react-native";
import { Button, useTheme } from 'react-native-paper';
import AppBar from '../components/AppBar';


export default function Index() {
  const {colors} = useTheme();
  return (
    <>
      <AppBar/>
      <Text>TODO Edit app/index.tsx to edit home screen.</Text>
      <Button style={{ width: 110}}
              buttonColor={colors.primary} 
              textColor={colors.onPrimary} 
              icon= 'plus'
              mode="elevated" 
              onPress={() => {
                router.push('/add-child')
                console.log('Pressed')
                }}>
          Add Child
        </Button>

    </>
  );
}