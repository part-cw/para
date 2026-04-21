// app/index.tsx - ROOT ENTRY POINT
import { useAuth } from '@/src/contexts/AuthContext';
import { useConfig } from '@/src/contexts/ConfigContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function RootIndex() {
  const { isAuthenticated, needsSetup } = useAuth();
  const {isConfigured } = useConfig();

  // Check if device is configured
  if (isConfigured === false) {
    return <Redirect href="/deviceSetup" />;
  }

  // Redirect to admin setup if needed
  if (needsSetup === true) {
    return <Redirect href="/setup" />;
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    return <Redirect href="/login" />;
  }

  // Redirect to protected home if authenticated
  if (isAuthenticated === true) {
    return <Redirect href="/(protected)" />;
  }

  // Loading
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}