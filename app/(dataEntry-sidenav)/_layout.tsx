import { createDrawerNavigator } from '@react-navigation/drawer';
import { withLayoutContext } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const { Navigator } = createDrawerNavigator();
const Drawer = withLayoutContext(Navigator);

export default function DrawerLayout() {
  return (
    <>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Drawer>
            <Drawer.Screen name="patientInformation" options={{title: 'Patient Information'}}/>
            <Drawer.Screen name="admissionClinicalData" options={{title: 'Admission Clinical Data'}}/>
            <Drawer.Screen name="medicalConditions" options={{title: 'Medical Conditions'}}/>
            <Drawer.Screen name="vhtReferral" options={{title: 'VHT Referral'}}/>
            <Drawer.Screen name="caregiverContact" options={{title: 'Caregiver Contact Information'}}/>
          </Drawer>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </>
    
  );
}