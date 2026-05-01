import { AuthProvider } from "@/src/contexts/AuthContext";
import { ConfigProvider } from "@/src/contexts/ConfigContext";
import { StorageProvider } from "@/src/contexts/StorageContext";
import { initializeModels } from "@/src/models/modelSelectorInstance";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppTheme } from "../src/themes/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('🔄 Loading risk models...');
        await initializeModels();
        setModelsLoaded(true);
        console.log('✅ Models loaded successfully');
      } catch (err) {
        setError(err instanceof Error ? err.message : '❌ Failed to load models');
        console.error('Model loading error:', err);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      // Hide splash screen after a short delay (or immediately if you prefer)
      const hideSplash = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await SplashScreen.hideAsync();
      };
      hideSplash();
    }
  }, [modelsLoaded]);

  if (!modelsLoaded) {
    return null;
  }

  // if (error) {
  //     return (
  //         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //             <ActivityIndicator size="large" />
  //             <Text>Error loading storage/models</Text>
  //         </View>
  //     );
  // }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ConfigProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <PaperProvider theme={AppTheme}>
                  <StorageProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                      {/* Public routes */}
                      <Stack.Screen name="deviceSetup" />
                      <Stack.Screen name="login" />
                      <Stack.Screen name="setup" />
                      <Stack.Screen name="index" />
                      {/* Protected routes */}
                      <Stack.Screen name="(protected)" />
                    </Stack>
                  </StorageProvider>
                </PaperProvider>
              </View>
            </GestureHandlerRootView>
        </ConfigProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}