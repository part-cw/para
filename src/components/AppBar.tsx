import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, View } from 'react-native';
import { Appbar, Button, Menu, Text, useTheme } from 'react-native-paper';
import { ACTIVE_SITE, CURRENT_USER, DEVICE_ID_KEY } from '../config';
import { usePatientData } from '../contexts/PatientDataContext';
import { useStorage } from '../contexts/StorageContext';
import { PatientIdGenerator } from '../utils/patientIdGenerator';

export default function AppBar() {
  const { colors } = useTheme();
  const { clearPatientData, patientData } = usePatientData();
  const { storage } = useStorage();

  const [menuVisible, setMenuVisible] = useState(false);

  // get current route
  const pathname = usePathname();
  const isHome = (pathname === '/');

  const dataEntryRoutes = [
    '/patientInformation',
    '/admissionClinicalData',
    '/medicalConditions',
    '/vhtReferral',
    '/caregiverContact',
    '/review'
  ]
  
  const isDataEntryScreen = dataEntryRoutes.includes(pathname);
  const dataWarningMessage = 
    'Incomplete admissions are automatically saved and can be resumed from the “Drafts” page.';

  const handleGoHome = () => {
     const resetStorage = async () => {  
        const patientId = patientData.patientId;

        if (patientId) {
          await PatientIdGenerator.recyclePatientId(patientId)
          await storage.deletePatient(patientId)
        }
      };

    const resetFormAndGo = () => {      
        clearPatientData();
        router.push('/');
      };
    
    const hasMinimalData = patientData.surname || patientData.firstName  

    if (isDataEntryScreen) {
      if (!hasMinimalData) {
        resetStorage();
        resetFormAndGo();
        return;
      }

      if (Platform.OS === 'web') {
        // TODO - fix web version
        if (window.confirm(dataWarningMessage)) {
          resetFormAndGo();
        }
      } else {
        Alert.alert("Leave without submitting?", dataWarningMessage,
          [{ text: "Cancel", style: "cancel" },
            { text: "Go Home", onPress: () => resetFormAndGo() }]
        );
      } 
    } else {
      // no alert if not in data entry screen
      router.push('/')
    }
            
  };

  return (
    <Appbar.Header 
      style={{ backgroundColor: colors.primary}}
      mode='center-aligned'>

      {/* LEFT SIDE: Show SD logo if on Home Screen, else show 'Home' button */}
      <View style={{ flex: 1, alignItems: 'flex-start',  marginLeft: 12}}>
        {isHome ? (
          <Image source={require('../assets/images/SD-logo-text_side.png')}
                 style={{
                 width: 140}}
                 resizeMode="contain"/>)
          : (
          <Button 
            style={{ width: 110}}
            buttonColor={colors.secondary} 
            textColor={colors.onSecondary} 
            icon= 'home'
            mode="elevated" 
            onPress={handleGoHome}
          >
            Home
          </Button>)}
      </View>

      {/* RIGHT SIDE: User info with dropdown */}
      <View style={{ flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}>
        <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: 'bold' }}>{CURRENT_USER}</Text> 
        <Text style={{ color: colors.onPrimary, fontSize: 16 }}>{ACTIVE_SITE} - Device {DEVICE_ID_KEY}</Text>
      </View>

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Appbar.Action
            icon="chevron-down"
            color="white"
            onPress={() => setMenuVisible(true)}/>
        }>
        <Menu.Item title="Username + last sync.." />
        <Menu.Item onPress={() => {}} leadingIcon = "account-circle" title="Profile" />
        <Menu.Item onPress={() => {}} leadingIcon= "translate" title="Language" />
        <Menu.Item onPress={() => {}} leadingIcon= "cog" title="Settings" />
        <Menu.Item onPress={() => {}} leadingIcon= "help-circle-outline" title="FAQs & Tutorials" />
        <Menu.Item onPress={() => {}} leadingIcon= "phone" title="Contact Us" />
        <Menu.Item onPress={() => {}} leadingIcon= "logout" title="Logout"/>
          {/* TODO add close button + UBC copywrite; make buttons responsive; fix colour scheme*/}
      </Menu>
    
    </Appbar.Header>
  );
}