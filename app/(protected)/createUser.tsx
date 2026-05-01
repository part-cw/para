import ValidatedTextInput from '@/src/components/ValidatedTextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// TODO - allow edit user feat to edit password
export default function CreateUserScreen() {
  const { colors } = useTheme();
  const { isAdmin, createUser } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [position, setPosition] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);

  // Redirect if not admin
  React.useEffect(() => {
    if (!isAdmin) {
      router.replace('/');
    }
  }, [isAdmin]);

  const handleCreateUser = async () => {
    if (!username.trim() || !displayName.trim() || !password.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      setLoading(true);
      await createUser(
        {
          username: username.trim(),
          displayName: displayName.trim(),
          role: 'user', // Regular user
          activeRole: 'user',
          position: position.trim() || '',
          email: ''
        },
        password
      );

      Alert.alert('Success', `User "${displayName}" created!`);
      setUsername('');
      setDisplayName('');
      setPosition('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Create New User
        </Text>

        <Card style={Styles.cardWrapper}>
          <Card.Title title="Enter User Information" />
          <Card.Content>
            <TextInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="User Position (optional)"
              value={position}
              onChangeText={setPosition}
              mode="outlined"
              placeholder='e.g. Nurse or Researcher'
              style={styles.input}
            />
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
            />
            <ValidatedTextInput 
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                inputType='password'
                secureTextEntry={!showPassword}
                right={
                    <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                    />
                }
                style={styles.input}
                autoCapitalize="none"
            />

             <ValidatedTextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  secureTextEntry={!showConfirmPassword}
                  right={
                      <TextInput.Icon
                      icon={showConfirmPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                  }
                  customValidator={() => confirmPassword === password}
                  customErrorMessage='Passwords must match'
                  style={styles.input}
                  autoCapitalize="none"
              />

            <Button
              mode="contained"
              onPress={handleCreateUser}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Create User
            </Button>
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.button}
        >
          Back to Home
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    padding: 20
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold'
  },
  input: {
    marginBottom: 12
  },
  button: {
    marginTop: 12
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  }
});