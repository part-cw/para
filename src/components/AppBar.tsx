import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, View } from 'react-native';
import { Appbar, Button, Menu, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { usePatientData } from '../contexts/PatientDataContext';
import { useStorage } from '../contexts/StorageContext';
import { PatientIdGenerator } from '../utils/patientIdGenerator';

export default function AppBar() {
  const { colors } = useTheme();
  const { clearPatientData, patientData } = usePatientData();
  const { storage } = useStorage();
  const { currentUser, isAdmin, logout, switchRole } = useAuth();
  const { config } = useConfig();

  const [menuVisible, setMenuVisible] = useState(false);


  // get current route
  const pathname = usePathname();
  const isHome = (pathname === '/');

  const admissionRoutes = [
    '/patientInformation',
    '/admissionClinicalData',
    '/medicalConditions',
    '/vhtReferral',
    '/caregiverContact',
    '/review'
  ]
  
  const isAdmissionScreen = admissionRoutes.includes(pathname);
  const dataWarningMessage = 
    'Incomplete admissions are automatically saved and can be resumed from the “Drafts” page.';
 
  const dischargeRoute = '/(protected)/dischargeData'
  const isDischargeScreen =  pathname === dischargeRoute
  
  const handleGoHome = () => {
     const resetStorage = async () => {  
        const patientId = patientData.patientId;

        if (patientId) {
          await PatientIdGenerator.recyclePatientId(patientId, config) // only reuses Ids if have not yet entered draft state
          await storage.deletePatient(patientId)
        }
      };

    const resetFormAndGo = () => {      
        clearPatientData();
        router.push('/(protected)');
      };
    
    const hasMinimalData = patientData.surname && patientData.firstName && typeof(patientData.ageInMonths) === 'number'

    if (isAdmissionScreen) {
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
    } else if (isDischargeScreen) {
      const dischargeWarning = 'Are you sure you want to leave screen without discharging patient?'
      if (Platform.OS !== 'web') {
        Alert.alert(
        "Exit discharge?", dischargeWarning,
          [{ text: "Cancel", style: "cancel" },
            { text: "Go Home", onPress: () => resetFormAndGo() }])
      } else {
        if (window.confirm(dischargeWarning)) resetFormAndGo();
      }

    } else {
      // no alert if not in admision or discharge screen
      resetFormAndGo();
    }
            
  };

  const handleLogout = async () => {
      setMenuVisible(false)
      await logout();
      router.replace('/login');
  };

  const handleSwitchRole = () => {
      // closeMenu();
      switchRole(); // Toggle between admin and user
  };

  const handleSettings = () => {
      setMenuVisible(false)
      router.push('/(protected)/(appbar-menu)/settings');
  };

  const handleEditProfile = () => {
      setMenuVisible(false)
      router.push('/(protected)/(appbar-menu)/editProfile');
  };

  return (
    <Appbar.Header 
      style={[styles.header, {backgroundColor: colors.primary}]}
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
          <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: 'bold' }}>{currentUser?.displayName || currentUser?.username}</Text> 
        <Text style={{ color: colors.onPrimary, fontSize: 16 }}>{config.activeSite} - Device {config.deviceIdKey}</Text>
      </View>

      <View style={styles.rightSection}>
          <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                  <Appbar.Action
                      icon={menuVisible ? 'chevron-up': 'chevron-down'}
                      color={colors.onPrimary}
                      size={28}
                      onPress={() => setMenuVisible(!menuVisible)}
                  />
              }
              anchorPosition="bottom"
              contentStyle={[styles.menuContent, { backgroundColor: colors.surface }]}
          >
              {/* User Info Header */}
              <View style={styles.userInfoHeader}>
                  <Text variant="bodyLarge" style={styles.displayName}>
                      {`${currentUser?.displayName} | ${currentUser?.position ? currentUser?.position : ''}`}
                  </Text>
                  <Text variant="bodySmall" style={styles.username}>
                      @{currentUser?.username}
                  </Text>
                  <View style={[
                      styles.roleBadge,
                      { backgroundColor: currentUser?.activeRole === 'admin' ? colors.primaryContainer : colors.secondary }
                  ]}>
                      <Text variant="bodySmall" style={styles.roleText}>
                          {currentUser?.activeRole === 'admin' ? 'Admin Mode' : 'User Mode'}
                      </Text>
                  </View>
              </View>

              {/* <Menu.Item
                  leadingIcon="sync"
                  onPress={() => {
                      closeMenu();
                      // TODO: Implement sync
                  }}
                  title="Sync Data"
                  titleStyle={{ color: colors.onSurface }}
              /> */}

                <Menu.Item
                    leadingIcon='account'
                    onPress={handleEditProfile}
                    title='Edit Profile'
                    titleStyle={{ color: colors.onSurface }}
                />

              {/* Switch Role - Only for admins */}
              {isAdmin && (
                  <Menu.Item
                      leadingIcon='swap-horizontal'
                      onPress={handleSwitchRole}
                      title={currentUser?.activeRole === 'admin' ? 'Switch to User Mode' : 'Switch to Admin Mode'}
                      titleStyle={{ color: colors.onSurface }}
                  />
              )}

              <Menu.Item
                  leadingIcon="cog"
                  onPress={handleSettings}
                  title="Settings"
                  titleStyle={{ color: colors.onSurface }}
              />

              <Menu.Item
                  leadingIcon="logout"
                  onPress={handleLogout}
                  title="Logout"
                  titleStyle={{ color: colors.error }}
              />
          </Menu>
      </View>
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
    header: {
        elevation: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8
    },
    siteName: {
        fontWeight: '600',
        marginLeft: 8
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    menuContent: {
        marginTop: 8,
        borderRadius: 8,
        minWidth: 220,
        elevation: 8
    },
    userInfoHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#D0D0D0',
        marginBottom: 8
    },
    displayName: {
        fontWeight: '600',
        marginBottom: 2
    },
    username: {
        color: '#666',
        marginBottom: 8
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12
    },
    roleText: {
        fontWeight: '600',
        fontSize: 12
    }
});