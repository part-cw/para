import AppBar from '@/src/components/AppBar';
import { useAuth } from '@/src/contexts/AuthContext';
import { useConfig } from '@/src/contexts/ConfigContext';
import { PatientDataProvider } from '@/src/contexts/PatientDataContext';
import { ValidationProvider } from '@/src/contexts/ValidationContext';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function ProtectedLayout() {
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

  // Loading state
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // User is authenticated - render protected routes
  return (
    <PatientDataProvider>
      <ValidationProvider>
        <View style={{ flex: 1 }}>
          <AppBar />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="createUser" />
            <Stack.Screen name="patientRecords" />
            <Stack.Screen name="drafts" />
            <Stack.Screen name="editPatient" />
            <Stack.Screen name="dischargeData" />
            <Stack.Screen name="riskDisplay" />
            <Stack.Screen name="(admission-sidenav)" />
          </Stack>
        </View>
      </ValidationProvider>
    </PatientDataProvider>
  );
}