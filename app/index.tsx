// app/index.tsx - ROOT ENTRY POINT
import { useAuth } from '@/src/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function RootIndex() {
  const { isAuthenticated, needsSetup } = useAuth();

  // Redirect to setup if needed
  if (needsSetup === true) {
    return <Redirect href="/setup" />;
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    return <Redirect href="/login" />;
  }

  // Redirect to protected home if authenticated
  if (isAuthenticated === true) {
    return <Redirect href="/(protected)" />;  // Goes to protected/index.tsx
  }

  // Loading
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}