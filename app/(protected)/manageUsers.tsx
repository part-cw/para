import { useAuth } from '@/src/contexts/AuthContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// TODO - allow edit user feat to edit password
export default function ManageUsersScreen() {
  const { colors } = useTheme();
  const { currentUser, isAdmin, getAllUsers, deleteUser, logout } = useAuth();

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

  const handleResetPassword = async () => {
   
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Manage Users
        </Text>

        <Card style={Styles.cardWrapper}>
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
                    <View style={{flexDirection: 'row', gap: 10}}>
                    <Button
                        mode="outlined"
                        textColor={colors.onPrimary}
                        buttonColor={colors.primary}
                        onPress={() => {
                        
                        }}
                    >
                    Edit
                  </Button>

                  <Button
                    mode="outlined"
                    textColor={colors.error}
                    buttonColor='white'
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
                  </View>
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