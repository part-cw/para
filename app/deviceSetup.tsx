import SearchableDropdown from '@/src/components/SearchableDropdown';
import ValidatedTextInput from '@/src/components/ValidatedTextInput';
import { useConfig } from '@/src/contexts/ConfigContext';
import { deviceIdErrorMessage, validateDeviceId } from '@/src/utils/inputValidator';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function DeviceSetupScreen() {
    const { colors } = useTheme();
    const { updateConfig } = useConfig();
    
    const [country, setCountry] = useState('')
    const [activeDistrict, setActiveDistrict] = useState('');
    const [activeSite, setActiveSite] = useState('');
    const [deviceIdKey, setDeviceIdKey] = useState('');
    const [maxPatientAge, setMaxPatientAge] = useState('5');
    const [rrateIntegrationEnabled, setRrateIntegrationEnabled] = useState(false);
    const [saving, setSaving] = useState(false);

    const countryOptions = [
        {value: 'Kenya', key: 'KE'},
        {value: 'Uganda', key: 'UG'}
    ]

    const handleSave = async () => {
        // Validation
        if (!country.trim()) {
            Alert.alert('Validation Error', 'Please enter country');
            return;
        }
        if (!activeDistrict.trim()) {
            Alert.alert('Validation Error', 'Please enter the district');
            return;
        }
        if (!activeSite.trim()) {
            Alert.alert('Validation Error', 'Please enter the site name');
            return;
        }
        if (!deviceIdKey.trim()) {
            Alert.alert('Validation Error', 'Please enter a device ID');
            return;
        }

        const age = parseInt(maxPatientAge);
        if (isNaN(age) || age <= 0 || age > 120) {
            Alert.alert('Validation Error', 'Please enter a valid maximum patient age (1-120 months)');
            return;
        }

        try {
            setSaving(true);
            await updateConfig({
                country: country.trim(),
                activeDistrict: activeDistrict.trim(),
                activeSite: activeSite.trim(),
                deviceIdKey: deviceIdKey.trim(),
                maxPatientAge: age,
                rrateIntegrationEnabled
            });

            Alert.alert(
                'Success',
                'Device configuration saved successfully!',
                [{ text: 'OK', onPress: () => router.replace('/setup') }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        style={styles.logo}
                        source={require('../src/assets/images/smart-discharges-logo_script.png')}
                        resizeMode='contain'
                    />
                </View>

                <Text variant="headlineMedium" style={styles.title}>
                    Device Setup
                </Text>

                <Text variant="bodyMedium" style={styles.subtitle}>
                    Configure this tablet for first-time use
                </Text>

                <SearchableDropdown 
                    data={countryOptions} 
                    label={'Country (required)'} 
                    placeholder='Select country below'
                    onSelect={(item) => setCountry(item.value)}
                    value={country}
                    search={true}
                />
                
                {/* TODO - change this to SearchableDropDown component that filters based on selected country */}
                <ValidatedTextInput
                    label={`${country === 'Kenya'? 'County' : 'District'} (required)`}
                    value={activeDistrict}
                    onChangeText={setActiveDistrict}
                    mode="outlined"
                    style={styles.input}
                    placeholder={`e.g. ${country === 'Kenya' ? 'Mombasa' : 'Buikwe'}`}
                />

                {/* TODO - change this to SearchableDropDown component that filters based on selected district */}
                <ValidatedTextInput
                    label="Site Name (required)"
                    value={activeSite}
                    onChangeText={setActiveSite}
                    mode="outlined"
                    style={styles.input}
                    placeholder="Enter name of hospital site"
                />

                <ValidatedTextInput
                    label="Device ID (required)"
                    value={deviceIdKey.toUpperCase()}
                    onChangeText={setDeviceIdKey}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g., A"
                    autoCapitalize="characters"
                    customValidator={() => validateDeviceId(deviceIdKey.toUpperCase())}
                    customErrorMessage={deviceIdErrorMessage}
                />

                <TextInput
                    label="Maximum Patient Age (years) *"
                    value={maxPatientAge.trim()}
                    onChangeText={setMaxPatientAge}
                    mode="outlined"
                    keyboardType="number-pad"
                    right={<TextInput.Affix text="years old" />}
                    style={styles.input}
                    disabled={true} // TODO - enable this field in the future
                />

                {/* TODO - undisable these fields; change text color of header to black */}
                <View style={styles.switchContainer}>
                    <View style={{ flex: 1 }}>
                        <Text variant="bodyLarge" style={{ color: '#ccc' }}>RRATE Integration (disabled)</Text>
                        <Text variant="bodySmall" style={{ color: '#ccc' }}>
                            Enable RRate app integration
                        </Text>
                    </View>
                    <Switch
                        value={rrateIntegrationEnabled}
                        onValueChange={setRrateIntegrationEnabled}
                        color={colors.primary}
                        disabled={true}
                    />
                </View>

                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={styles.button}
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                >
                    Save Configuration
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20
    },
    logo: {
        maxHeight: 200,
        height: 150,
        aspectRatio: 733 / 1043
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: 'bold'
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 32,
        color: '#666'
    },
    input: {
        marginBottom: 16
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#D0D0D0'
    },
    button: {
        marginTop: 8,
        marginBottom: 16
    },
    note: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic'
    }
});