import { EditGroup } from '@/src/components/EditFieldGroup';
import { useAuth } from '@/src/contexts/AuthContext';
import { useConfig } from '@/src/contexts/ConfigContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { colors } = useTheme();
    const { currentUser } = useAuth();
    const { config, updateConfig } = useConfig();

    const isAdmin = currentUser?.role === 'admin';

    // Edit states
    const [activeDistrict, setActiveDistrict] = useState(config.activeDistrict);
    const [activeSite, setActiveSite] = useState(config.activeSite);
    const [deviceIdKey, setDeviceIdKey] = useState(config.deviceIdKey);
    const [maxPatientAge, setMaxPatientAge] = useState(config.maxPatientAge.toString());
    const [rrateIntegrationEnabled, setRrateIntegrationEnabled] = useState(config.rrateIntegrationEnabled);

    const [saving, setSaving] = useState(false);

    const handleSaveDistrict = async () => {
        if (!activeDistrict.trim()) {
            Alert.alert('Error', 'District cannot be empty');
            return;
        }
        try {
            setSaving(true);
            await updateConfig({ activeDistrict: activeDistrict.trim() });
            Alert.alert('Success', 'District updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update district');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSite = async () => {
        if (!activeSite.trim()) {
            Alert.alert('Error', 'Site name cannot be empty');
            return;
        }
        try {
            setSaving(true);
            await updateConfig({ activeSite: activeSite.trim() });
            Alert.alert('Success', 'Site updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update site');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDeviceId = async () => {
        if (!deviceIdKey.trim()) {
            Alert.alert('Error', 'Device ID cannot be empty');
            return;
        }
        try {
            setSaving(true);
            await updateConfig({ deviceIdKey: deviceIdKey.trim() });
            Alert.alert('Success', 'Device ID updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update device ID');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMaxAge = async () => {
        const age = parseInt(maxPatientAge);
        if (isNaN(age) || age <= 0 || age > 120) {
            Alert.alert('Error', 'Please enter a valid age (1-5 years)');
            return;
        }
        try {
            setSaving(true);
            await updateConfig({ maxPatientAge: age });
            Alert.alert('Success', 'Maximum patient age updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update maximum age');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleRRate = async (value: boolean) => {
        try {
            setRrateIntegrationEnabled(value);
            await updateConfig({ rrateIntegrationEnabled: value });
        } catch (error) {
            Alert.alert('Error', 'Failed to update RRATE integration');
            setRrateIntegrationEnabled(!value); // Revert on error
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Device Settings
                </Text>

                {/* Country  */}
                <EditGroup
                    fieldLabel="Country"
                    fieldValue={config.country} // TODO FIX - NOT SHOWING UP
                    editLabel="Country"
                    canEdit={false}
                >
                    <TextInput
                        value={config.country}
                        mode="outlined"
                        style={styles.input}
                        disabled={true}
                    />
                </EditGroup>
                
                {/* District */}
                <EditGroup
                    fieldLabel="District"
                    fieldValue={config.activeDistrict}
                    editLabel="Edit District"
                    canEdit={isAdmin}
                >
                    <TextInput
                        value={activeDistrict}
                        onChangeText={setActiveDistrict}
                        mode="outlined"
                        style={styles.input}
                        placeholder="e.g., Buikwe"
                    />
                    <Button
                        mode="contained"
                        onPress={handleSaveDistrict}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                    >
                        Save District
                    </Button>
                </EditGroup>

                {/* Site */}
                <EditGroup
                    fieldLabel="Site Name"
                    fieldValue={config.activeSite}
                    editLabel="Edit Site Name"
                    canEdit={isAdmin}
                >
                    <TextInput
                        value={activeSite}
                        onChangeText={setActiveSite}
                        mode="outlined"
                        style={styles.input}
                        placeholder="e.g., Buikwe HC IV"
                    />
                    <Button
                        mode="contained"
                        onPress={handleSaveSite}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                    >
                        Save Site
                    </Button>
                </EditGroup>

                {/* Device ID */}
                <EditGroup
                    fieldLabel="Device ID"
                    fieldValue={config.deviceIdKey}
                    editLabel="Edit Device ID"
                    canEdit={isAdmin}
                >
                    <TextInput
                        value={deviceIdKey}
                        onChangeText={setDeviceIdKey}
                        mode="outlined"
                        style={styles.input}
                        placeholder="e.g., TABLET-001"
                        autoCapitalize="characters"
                    />
                    <Button
                        mode="contained"
                        onPress={handleSaveDeviceId}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                    >
                        Save Device ID
                    </Button>
                </EditGroup>

                {/* Max Patient Age */}
                <EditGroup
                    fieldLabel="Max Patient Age"
                    fieldValue={`${config.maxPatientAge} years`}
                    editLabel="Edit Maximum Patient Age"
                    canEdit={isAdmin}
                >
                    <TextInput
                        value={maxPatientAge}
                        onChangeText={setMaxPatientAge}
                        mode="outlined"
                        keyboardType="number-pad"
                        style={styles.input}
                        placeholder="5"
                    />
                    <Button
                        mode="contained"
                        onPress={handleSaveMaxAge}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                    >
                        Save Max Age
                    </Button>
                </EditGroup>

                {/* RRATE Integration */}
                <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                        <Text variant="bodyLarge" style={styles.fieldLabel}>
                            RRATE Integration
                        </Text>
                        <Text variant="bodySmall" style={{ color: '#666' }}>
                            {rrateIntegrationEnabled ? 'Enabled' : 'Disabled'}
                        </Text>
                    </View>
                    <Switch
                        value={rrateIntegrationEnabled}
                        onValueChange={handleToggleRRate}
                        color={colors.primary}
                        disabled={true}
                    />
                </View>

                {!isAdmin && (
                    <Text variant="bodySmall" style={styles.adminNote}>
                        Only administrators can modify device settings
                    </Text>
                )}

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
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#D0D0D0'
    },
    fieldLabel: {
        fontWeight: 'bold',
        fontSize: 16
    },
    adminNote: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        marginTop: 16,
        marginBottom: 16
    },
    backButton: {
        marginTop: 24
    }
});