import ValidatedTextInput from '@/src/components/ValidatedTextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// TODO - allow edit user feat to edit password
export default function CreateUserScreen() {
  const { colors } = useTheme();
  const { currentUser, isAdmin, createUser, getAllUsers, deleteUser, logout } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [position, setPosition] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Redirect if not admin
  React.useEffect(() => {
    if (!isAdmin) {
      router.replace('/');
    } else {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    const allUsers = await getAllUsers();
    setUsers(allUsers);
  };

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
          position: position.trim() || '',
          email: ''
        },
        password
      );

      Alert.alert('Success', `User "${displayName}" created!`);
      setUsername('');
      setDisplayName('');
      setPassword('');
      await loadUsers();
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

        <Card style={Styles.cardWrapper}>
          <Card.Title title="Existing Users" />
          <Card.Content>
            {users.map(user => (
              <View key={user.id} style={styles.userItem}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLarge">{user.displayName}</Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>
                    @{user.username} • {user.role}
                  </Text>
                </View>
                {user.id !== currentUser?.id && (
                  <Button
                    mode="outlined"
                    textColor={colors.error}
                    onPress={() => {
                      Alert.alert(
                        'Delete User',
                        `Delete user "${user.displayName}"?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteUser(user.id);
                              await loadUsers();
                            }
                          }
                        ]
                      );
                    }}
                  >
                    Delete
                  </Button>
                )}
              </View>
            ))}
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