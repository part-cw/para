import AppBar from "@/src/components/AppBar";
import { PatientDataProvider } from "@/src/contexts/PatientDataContext";
import { initializeModels } from "@/src/models/modelSelectorInstance";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppTheme } from "../src/themes/theme";


// Keep splash screen visible while loading fonts
export default function RootLayout() {

  // TODO - initialize models properly
    // const [modelsLoaded, setModelsLoaded] = useState(false);
    // const [error, setError] = useState<string | null>(null);
    useEffect(() => {
      initializeModels();
    }, [])
    // useEffect(() => {
    //     const loadModels = async () => {
    //         try {
    //             await initializeModels();
    //             setModelsLoaded(true);
    //             console.log('Models loaded successfully');
    //         } catch (err) {
    //             setError(err instanceof Error ? err.message : 'Failed to load models');
    //             console.error('Model loading error:', err);
    //         }
    //     };

    //     loadModels();
    // }, []);

    // if (error) {
    //     return (
    //         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    //             <Text>Error loading models: {error}</Text>
    //         </View>
    //     );
    // }

    // if (!modelsLoaded) {
    //     return (
    //         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    //             <ActivityIndicator size="large" />
    //             <Text>Loading risk models...</Text>
    //         </View>
    //     );
    // }

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
          <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <PaperProvider theme={AppTheme}>
              <AppBar/>
              <Stack screenOptions={{headerShown: false,}}/>
            </PaperProvider>
          </View>
          </GestureHandlerRootView>
        </PatientDataProvider>
      </SafeAreaProvider>
  );
}
