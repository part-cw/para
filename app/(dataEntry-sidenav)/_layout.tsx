import { MaterialIcons } from '@expo/vector-icons';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { withLayoutContext } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';


const { Navigator } = createDrawerNavigator();
const Drawer = withLayoutContext(Navigator);

function CustomDrawerContent(props: any) {
  const { colors } = useTheme();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      {/* Drawer Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 15,
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: 'black', fontSize: 20, fontWeight: 'bold' }}>
         Add Child Menu
        </Text>
        <Pressable onPress={() => {
            console.log('close side nav')
            props.navigation.closeDrawer();
          }}>
          <MaterialIcons name="cancel" size={27} color={ colors.primary} />
        </Pressable>
      </View>

      {/* Drawer Items */}
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props}/>}>
            <Drawer.Screen name="patientInformation" options={{title: 'Patient Information'}}/>
            <Drawer.Screen name="admissionClinicalData" options={{title: 'Admission Clinical Data'}}/>
            <Drawer.Screen name="medicalConditions" options={{title: 'Medical Conditions'}}/>
            <Drawer.Screen name="vhtReferral" options={{title: 'VHT Referral'}}/>
            <Drawer.Screen name="caregiverContact" options={{title: 'Caregiver Contact Information'}}/>
            <Drawer.Screen name="review" options={{title: 'Review & Submit'}}/>
          </Drawer>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </>
    
  );
}