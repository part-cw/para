import Checkbox from '@/src/components/Checkbox';
import ValidatedTextInput from '@/src/components/ValidatedTextInput';
import { useAuth, User, UserRole } from '@/src/contexts/AuthContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// TODO - allow edit user feat to edit password
export default function ManageUsersScreen() {
  const { colors } = useTheme();
  const { currentUser, isAdmin, getAllUsers, deleteUser, resetUserPassword, updateAnyUserProfile } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Password reset states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  const handleCheckboxToggle = (selected: User | null) => {
    // Toggle selection - if already selected, deselect; otherwise select
    setSelectedUser(prev => prev === selected ? null : selected);
  };

  const handleToggleRole = async () => {
    if (!selectedUser) return;

    const newRole: UserRole = selectedUser.role === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? `promote ${selectedUser.displayName || selectedUser.username} to Administrator` : `demote ${selectedUser.displayName || selectedUser.username} to User`;

    Alert.alert(
      'Change User Role',
      `Are you sure you want to ${actionText}?`,
      [
        { text: 'Cancel', onPress: () => setSelectedUser(null) },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateAnyUserProfile(selectedUser, { role: newRole });
              Alert.alert('Success', `${selectedUser.displayName} is now a ${newRole === 'admin' ? 'Administrator' : 'User'}`);
              setSelectedUser(null); // Deselect after action
              await loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to update user role');
            }
          }
        }
      ]
    );
  };

  const handleOpenPasswordModal = (user: User) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setSelectedUser(null);
    setShowPasswordModal(false)
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      setResetting(true);
      await resetUserPassword(selectedUser, newPassword);

      Alert.alert(
        'Success',
        `Password reset for ${selectedUser.displayName || selectedUser.username}. Please communicate the new password to them securely.`
      );

      handleClosePasswordModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };


  const handleDeleteUser = async (user: User) => {
    Alert.alert(
        'Delete User',
        `Are you sure you want to delete user "${user.displayName || user.username}"?`,
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
  }
        
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Reset Password Modal */}
        <Modal
            visible={showPasswordModal}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClosePasswordModal}
        >
            <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                    Reset Password
                </Text>
                <IconButton icon="close" size={24} onPress={handleClosePasswordModal} />
                </View>

                <ScrollView style={styles.modalBody}>
                <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#666' }}>
                    Resetting password for: {selectedUser?.displayName}
                </Text>

                <Text variant="bodySmall" style={{ marginBottom: 16, color: '#e65100', fontStyle: 'italic' }}>
                    ⚠️ Make sure to communicate the new password to the user securely
                </Text>

                <ValidatedTextInput
                    inputType='password'
                    label="New Password *"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    mode="outlined"
                    secureTextEntry={!showNewPassword}
                    right={
                    <TextInput.Icon
                        icon={showNewPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                    />
                    }
                    style={styles.input}
                    autoCapitalize="none"
                />

                <ValidatedTextInput
                    inputType='password'
                    label="Confirm New Password *"
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
                    style={styles.input}
                    customValidator={() => confirmPassword === newPassword}
                    customErrorMessage='Passwords must match'
                    autoCapitalize="none"
                />
                </ScrollView>

                <View style={styles.modalFooter}>
                <Button
                    mode="contained"
                    onPress={handleResetPassword}
                    loading={resetting}
                    disabled={resetting}
                    style={{ flex: 1, marginRight: 8 }}
                    buttonColor={colors.error}
                >
                    Reset Password
                </Button>
                <Button mode="outlined" onPress={handleClosePasswordModal} style={{ flex: 1, marginLeft: 8 }}>
                    Cancel
                </Button>
                </View>
            </View>
            </View>
        </Modal>

        <Text variant="headlineMedium" style={styles.title}>
          Manage Users
        </Text>
        <Text variant="bodyLarge" style={[styles.input, {fontStyle: 'italic'}]}>
          Select a user to edit, reset password, or delete.
        </Text>

        {/* User list */}
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
                <View style={{flexDirection: 'row', gap: 10}}>
                    {user.id !== currentUser?.id 
                        ? 
                        <Checkbox 
                            label={''} 
                            checked={user === selectedUser} 
                            onChange={() => handleCheckboxToggle(user)}
                        />
                        :
                        <Text variant="bodyLarge" style={{fontWeight: 'bold', color: colors.primary }}>Logged In</Text>
                    }
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
            <Button
                mode="outlined"
                icon={selectedUser?.role === 'admin' ? 'account-arrow-down' : 'account-arrow-up'}
                onPress={handleToggleRole}
                disabled={!selectedUser}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                style={styles.actionButton}
            >
                Edit Role
            </Button>
            <Button
                mode="outlined"
                textColor={colors.onPrimary}
                buttonColor={colors.primary}
                onPress={() => handleOpenPasswordModal(selectedUser as User)}
                disabled={!selectedUser}
            >
                Reset Password
            </Button>
            <Button
                mode="outlined"
                textColor={colors.error}
                buttonColor='white'
                onPress={() => handleDeleteUser(selectedUser as User)}
                disabled={!selectedUser}
            >
                Delete
            </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -50,
  },
  content: {
    padding: 20
  },
  title: {
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: 'bold'
  },
  input: {
    marginBottom: 12,
    textAlign: 'center',
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
  },
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalBody: {
    padding: 20
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
   actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  actionButton: {
    minWidth: 140
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
});