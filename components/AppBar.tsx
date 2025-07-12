import { useState } from 'react';
import { Image, View } from 'react-native';
import { Appbar, Menu, Text, useTheme } from 'react-native-paper';


export default function AppBar() {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <Appbar.Header 
      style={{ backgroundColor: colors.primary}}
      mode='center-aligned' 
      >
      {/* LEFT SIDE: User info with dropdown */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Appbar.Action
            icon="chevron-down"
            color="white"
            onPress={() => setMenuVisible(true)}
          />
        }
      >
        <Menu.Item onPress={() => {}} title="Profile" />
        <Menu.Item onPress={() => {}} title="Settings" />
        <Menu.Item onPress={() => {}} title="Logout"/>
          {/* TODO add more menu items */}
      </Menu>

        {/* TODO make username + position update depending on who logged in */}
      <View style={{ flexDirection: 'column', marginLeft: 4 }}>
        <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: 'bold' }}>Emmet</Text> 
        <Text style={{ color: colors.onPrimary, fontSize: 16 }}>Clinician</Text>
      </View>
      
      {/* TODO right side of bar changes depending on whether on home page or not */}
      
        <Image
                source={require('../assets/images/icon_sd-logo_noscript.png')}
                style={{
                  width: 45,
                  height: 45,
                  margin: 5
                }}
                resizeMode="contain"
              />

       <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 12 }}>
        <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: 'bold', marginRight: 33 }}>SMART</Text> 
        <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: 'bold' }}>Discharges</Text>
      </View>

    </Appbar.Header>
  );
}
