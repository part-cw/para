// import { router, usePathname } from 'expo-router';
// import { useState } from 'react';
// import { Image, View } from 'react-native';
// import { Appbar, Button, Menu, Text, useTheme } from 'react-native-paper';

// export default function AppBar() {
//   const { colors } = useTheme();
//   const [menuVisible, setMenuVisible] = useState(false);

//   // get current route
//   const pathname = usePathname();
//   const isHome = pathname === '/';

//   return (
//     <Appbar.Header 
//       style={{ backgroundColor: colors.primary}}
//       mode='center-aligned'>

//       {/* LEFT SIDE: Show SD logo if on Home Screen, else show 'Home' button */}
//       {/* TODO make sure Home button works on other screens */}
//       <View style={{ flex: 1, alignItems: 'flex-start',  marginLeft: 12}}>
//         {isHome ? (
//           <Image source={require('../assets/images/SD-logo-text_side.png')}
//                  style={{
//                  width: 140}}
//                  resizeMode="contain"/>)
//           : (
//           <Button style={{ width: 110}}
//                   buttonColor={colors.secondary} 
//                   textColor={colors.onSecondary} 
//                   icon= 'home'
//                   mode="elevated" 
//                   onPress={() => {
//                     router.push('/')
//                     }}>
//               Home
//             </Button>)}
//       </View>

//       {/* RIGHT SIDE: User info with dropdown */}
//       {/* TODO make username + position update depending on who logged in */}
//       <View style={{ flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}>
//         <Text style={{ color: colors.onPrimary, fontSize: 20, fontWeight: 'bold' }}>Emmet</Text> 
//         <Text style={{ color: colors.onPrimary, fontSize: 16 }}>Clinician</Text>
//       </View>

//       <Menu
//         visible={menuVisible}
//         onDismiss={() => setMenuVisible(false)}
//         anchor={
//           <Appbar.Action
//             icon="chevron-down"
//             color="white"
//             onPress={() => setMenuVisible(true)}/>
//         }>
//         <Menu.Item title="Username + last sync.." />
//         <Menu.Item onPress={() => {}} leadingIcon = "account-circle" title="Profile" />
//         <Menu.Item onPress={() => {}} leadingIcon= "translate" title="Language" />
//         <Menu.Item onPress={() => {}} leadingIcon= "cog" title="Settings" />
//         <Menu.Item onPress={() => {}} leadingIcon= "help-circle-outline" title="FAQs & Tutorials" />
//         <Menu.Item onPress={() => {}} leadingIcon= "phone" title="Contact Us" />
//         <Menu.Item onPress={() => {}} leadingIcon= "logout" title="Logout"/>
//           {/* TODO add close button + UBC copywrite; make buttons responsive; fix colour scheme*/}
//       </Menu>
    
//     </Appbar.Header>
//   );
// }