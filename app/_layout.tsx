import AppBar from "@/src/components/AppBar";
import { PatientDataProvider } from "@/src/contexts/PatientDataContext";
import { initializeModels } from "@/src/models/modelSelectorInstance";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import { View } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppTheme } from "../src/themes/theme";



// // TODO figure out which font variant to use exactly -- importing 700Bold and 400Regular for now

// Keep splash screen visible while loading fonts
export default function RootLayout() {
//   const [fontsLoaded] = useFonts({
//     Inter_400Regular,
//     Inter_700Bold,
//   });

//   useEffect(() => {
//     // Tell expo-splash-screen not to auto-hide yet
//     SplashScreen.preventAutoHideAsync();
//   }, []);

  // Only hide splash when fonts are ready and layout is complete
//   const onLayoutRootView = useCallback(async () => {
//     if (fontsLoaded) {
//       await new Promise(resolve => setTimeout(resolve, 5000)); // TODO: for testing only - delete later
//       await SplashScreen.hideAsync();
//     }
//   }, [fontsLoaded]);

//   // Show nothing while fonts are loading (native splash stays visible)
//   if (!fontsLoaded) {
//     return null;
//   }

  useEffect(() => {
    initializeModels();
  }, [])

  useEffect(() => {
        // Prevent splash screen from auto-hiding immediately
        SplashScreen.preventAutoHideAsync();
        
        // Hide splash screen after a short delay (or immediately if you prefer)
        const hideSplash = async () => {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay, optional
          await SplashScreen.hideAsync();
        };
        hideSplash();
  }, []);

  const onLayoutRootView = useCallback(async () => {
        // No font loading, so just hide splash screen immediately on layout
        await SplashScreen.hideAsync();
  }, []);



  return (
      <SafeAreaProvider>
        <PatientDataProvider>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <PaperProvider theme={AppTheme}>
              <AppBar/>
              <Stack screenOptions={{headerShown: false,}}/>
            </PaperProvider>
          </View>
        </PatientDataProvider>
      </SafeAreaProvider>
  );
}
