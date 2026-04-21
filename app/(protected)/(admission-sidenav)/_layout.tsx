import { useValidation } from '@/src/contexts/ValidationContext';
import { MaterialIcons } from '@expo/vector-icons';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { withLayoutContext } from 'expo-router';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';



const { Navigator } = createDrawerNavigator();
const Drawer = withLayoutContext(Navigator);

// Custom drawer item component that handles validation
function ValidatedDrawerItem({ 
  label, 
  screenName, 
  navigation, 
  currentScreen,
  icon 
}: {
  label: string;
  screenName: string;
  navigation: any; // Using any since we're working with expo-router drawer
  currentScreen: string;
  icon?: string;
}) {
  const { hasAnyValidationErrors, validationErrors } = useValidation();
  const { colors } = useTheme();

  const handlePress = () => {
    if (hasAnyValidationErrors && screenName !== currentScreen) {
      
      if (Platform.OS !== 'web') {
        Alert.alert(
          "Error",
          `Please enter all required information and fix errors on current page before navigating to other sections.`,
          [{ text: "OK" }]
        );
      } else {
        alert(`ERROR: Please enter all required information and fix errors on current page before navigating to other sections.`,)
      }
      
      return;
    }
    
    navigation.navigate(screenName);
  };

  const isDisabled = hasAnyValidationErrors && screenName !== currentScreen;
  const hasErrors = validationErrors[screenName]?.length > 0;

  return (
    <DrawerItem
      label={label}
      onPress={handlePress}
      focused={currentScreen === screenName}
      icon={({ color, size }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && (
            <MaterialIcons 
              name={icon as any} 
              size={size} 
              color={isDisabled ? colors.outline : color} 
            />
          )}
          {hasErrors && (
            <MaterialIcons 
              name="error" 
              size={16} 
              color={colors.error} 
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      )}
      labelStyle={{
        color: isDisabled ? colors.outline : colors.onSurface,
        opacity: isDisabled ? 0.6 : 1
      }}
      style={{
        opacity: isDisabled ? 0.6 : 1
      }}
    />
  );
}

function CustomDrawerContent(props: any) {
  const { colors } = useTheme();
  const currentRoute = props.state.routes[props.state.index].name;

  const screens = [
    { name: 'patientInformation', label: 'Patient Information', icon: 'person' },
    { name: 'admissionClinicalData', label: 'Admission Clinical Data', icon: 'local-hospital' },
    { name: 'medicalConditions', label: 'Common Medical Conditions', icon: 'medical-services' },
    { name: 'vhtReferral', label: 'CHW Referral', icon: 'transfer-within-a-station' },
    { name: 'caregiverContact', label: 'Caregiver Contact Information', icon: 'contact-phone' },
    { name: 'review', label: 'Review & Submit', icon: 'check-circle' }
  ];



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
         Add Patient Menu
        </Text>
        <Pressable onPress={() => {
            props.navigation.closeDrawer();
          }}>
          <MaterialIcons name="cancel" size={27} color={ colors.primary} />
        </Pressable>
      </View>

      {/* Custom Drawer Items */}
      {screens.map((screen) => (
        <ValidatedDrawerItem
          key={screen.name}
          label={screen.label}
          screenName={screen.name}
          navigation={props.navigation}
          currentScreen={currentRoute}
          icon={screen.icon}
        />
      ))}
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
              <Drawer.Screen name="medicalConditions" options={{title: 'Common Medical Conditions'}}/>
              <Drawer.Screen name="vhtReferral" options={{title: 'CHW Referral'}}/>
              <Drawer.Screen name="caregiverContact" options={{title: 'Caregiver Contact Information'}}/>
              <Drawer.Screen name="review" options={{title: 'Review & Submit'}}/>
            </Drawer>
          </GestureHandlerRootView>
      </SafeAreaProvider>
    </>
  );
}