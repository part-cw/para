import { useAuth } from '@/src/contexts/AuthContext';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function ProtectedLayout() {
  const { isAuthenticated, needsSetup } = useAuth();

  // Redirect to setup if needed
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="adminSettings" />
      <Stack.Screen name="patientRecords" />
      <Stack.Screen name="drafts" />
      <Stack.Screen name="editPatient" />
      <Stack.Screen name="dischargeData" />
      <Stack.Screen name="riskDisplay" />
      <Stack.Screen name="(admission-sidenav)" />
    </Stack>
  );
}