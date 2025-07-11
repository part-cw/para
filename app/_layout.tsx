import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import { View } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { AppTheme } from "../assets/theme";


// TODO figure out which font variant to use exactly -- importing 700Bold and 400Regular for now

// Keep splash screen visible while loading fonts
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  useEffect(() => {
    // Tell expo-splash-screen not to auto-hide yet
    SplashScreen.preventAutoHideAsync();
  }, []);

  // Only hide splash when fonts are ready and layout is complete
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // TODO: for testing only - delete later
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Show nothing while fonts are loading (native splash stays visible)
  if (!fontsLoaded) {
    return null;
  }

  // TODO add custom theme and pass it as prop in PaperProvider
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <PaperProvider theme={AppTheme}>
        <Stack />
      </PaperProvider>
    </View>
  );
}
