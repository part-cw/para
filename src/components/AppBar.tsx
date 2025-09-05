import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, View } from 'react-native';
import { Appbar, Button, Menu, Text, useTheme } from 'react-native-paper';
import { ACTIVE_SITE, CURRENT_USER, DEVICE_ID_KEY } from '../config';

export default function AppBar() {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  // get current route
  const pathname = usePathname();
  const isHome = pathname === '/';

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
            onPress={() => {
              // TODO - switch warning depending on which screen we're currently on. current message for data entry screens
              if (Platform.OS === 'web') {
                if (window.confirm("Are you sure you want to go home before submitting patient record? All data will be lost.")) {
                  router.push('/')
                }
              } else {
                Alert.alert(
                  "Warning",
                  "Are you sure you want to go home before submitting patient record? All data will be lost.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "OK", onPress: () => router.push('/') }
                  ]
                );
              }
            }}
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