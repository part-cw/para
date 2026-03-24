import { EditGroup } from '@/src/components/EditFieldGroup';
import ValidatedTextInput from '@/src/components/ValidatedTextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
    const { colors } = useTheme();
    const { currentUser, updateUserProfile } = useAuth();

    if (!currentUser) {
        router.replace('/login');
        return null;
    }

    // Edit states
    const [displayName, setDisplayName] = useState(currentUser.displayName);
    const [email, setEmail] = useState(currentUser.email || '');
    const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
    const [position, setPosition] = useState(currentUser.position || '');

    const [saving, setSaving] = useState(false);

    const handleSaveDisplayName = async () => {
        if (!displayName.trim()) {
            Alert.alert('Error', 'Display name cannot be empty');
            return;
        }
        try {
            setSaving(true);
            await updateUserProfile({ displayName: displayName.trim() });
            Alert.alert('Success', 'Display name updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update display name');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEmail = async () => {
        if (email.trim() && !email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }
        try {
            setSaving(true);
            await updateUserProfile({ email: email.trim() || undefined });
            Alert.alert('Success', 'Email updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update email');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePhoneNumber = async () => {
        try {
            setSaving(true);
            await updateUserProfile({ phoneNumber: phoneNumber.trim() || undefined });
            Alert.alert('Success', 'Phone number updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update phone number');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePosition = async () => {
        try {
            setSaving(true);
            await updateUserProfile({ position: position.trim() || undefined });
            Alert.alert('Success', 'Position updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update position');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Edit Profile
                </Text>

                {/* Display Name */}
                <EditGroup
                    fieldLabel="Display Name"
                    fieldValue={currentUser.displayName}
                    editLabel="Edit Display Name"
                    canEdit={true}
                >
                    <TextInput
                        value={displayName}
                        onChangeText={setDisplayName}
                        mode="outlined"
                        style={styles.input}
                        placeholder="Your full name"
                    />
                    <Button
                        mode="contained"
                        onPress={handleSaveDisplayName}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                    >
                        Save Display Name
                    </Button>
                </EditGroup>

                {/* Username (Read-only) */}
                <EditGroup
                    fieldLabel="Username"
                    fieldValue={currentUser.username}
                    canEdit={false}
                >
                    {null}
                </EditGroup>


                {/* Email */}
                <EditGroup
                    fieldLabel="Email"
                    fieldValue={currentUser.email || 'Not set'}
                    editLabel="Edit Email"
                    canEdit={true}
                >
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        placeholder="your.email@example.com"
                    />
                    <Button
                        mode="contained"
                        onPress={handleSaveEmail}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                    >
                        Save Email
                    </Button>
                </EditGroup>

                {/* Phone Number */}
                <EditGroup
                    fieldLabel="Phone Number"
                    fieldValue={currentUser.phoneNumber || 'Not set'}
                    editLabel="Edit Phone Number"
                    canEdit={true}
                >
                    <ValidatedTextInput
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        mode="outlined"
                        inputType="phone"
                        style={styles.input}
                        placeholder="0 XXX XXX XXX" // TODO - replace with validated text input
                        label={''}                    />
                    <Button
                        mode="contained"
                        onPress={handleSavePhoneNumber}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                    >
                        Save Phone Number
                    </Button>
                </EditGroup>

                 {/* Role (Read-only) */}
                <EditGroup
                    fieldLabel="Role"
                    fieldValue={currentUser.role === 'admin' ? 'Administrator' : 'User'}
                    canEdit={false}
                >
                    {null}
                </EditGroup>

                {/* Position */}
                <EditGroup
                    fieldLabel="Position"
                    fieldValue={currentUser.position || 'Not set'}
                    editLabel="Edit Position"
                    canEdit={true}
                >
                    <TextInput
                        value={position}
                        onChangeText={setPosition}
                        mode="outlined"
                        style={styles.input}
                        placeholder="e.g., Nurse, Clinician, Doctor"
                    />
                    <Button
                        mode="contained"
                        onPress={handleSavePosition}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                    >
                        Save Position
                    </Button>
                </EditGroup>

                {/* Account Info */}
                <View style={styles.accountInfo}>
                    <Text variant="bodySmall" style={{ color: '#666' }}>
                        Account created: {new Date(currentUser.createdAt).toLocaleDateString()}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                        User ID: {currentUser.id}
                    </Text>
                </View>

                <Button
                    mode="outlined"
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    Back
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
        padding: 24
    },
    title: {
        marginBottom: 24,
        fontWeight: 'bold'
    },
    input: {
        marginBottom: 12
    },
    saveButton: {
        marginTop: 8
    },
    accountInfo: {
        marginTop: 32,
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 8
    },
    backButton: {
        marginTop: 16
    }
});