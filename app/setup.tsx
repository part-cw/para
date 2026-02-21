import ValidatedTextInput from '@/src/components/ValidatedTextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { isValidPassword, passwordErrorMessage } from '@/src/utils/inputValidator';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";



export default function SetupScreen() {
    const { createUser } = useAuth();
    const { height } = useWindowDimensions();
    
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [adminUsername, setAdminUsername] = useState<string>('');
    const [adminPassword, setAdminPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('')
    const [loading, setLoading] = useState(false);

    // TODO add password requirements

    const handleSetup = async () => {
        if (!adminUsername.trim() || !adminPassword.trim()) {
            Alert.alert('Error', 'Enter valid username or password');
            return;
        }

        if (adminPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (!isValidPassword(adminPassword)) {
            Alert.alert(passwordErrorMessage)
            return;
        }

          try {
        setLoading(true);

        // Create the first admin user
        await createUser(
            {
                username: adminUsername.trim(),
                role: 'admin',
                displayName: '',
                email: '',
            },
            adminPassword
        );

        Alert.alert(
            'Success',
            'Admin account created! You can now log in.',
            [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create admin account');
        } finally {
        setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={height > 700 ? 60 : 40}
            >
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Image
                            style={styles.logo}
                            source={require('../src/assets/images/smart-discharges-logo_script.png')}
                            resizeMode='contain'
                        />
                    </View>

                    <Text variant="headlineSmall" style={styles.title}>
                        First-Time Setup
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Create an administrator account to get started
                    </Text>

                    <TextInput
                        label="Admin Username"
                        value={adminUsername}
                        onChangeText={setAdminUsername}
                        mode="outlined"
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <ValidatedTextInput 
                        label="Password"
                        value={adminPassword}
                        onChangeText={setAdminPassword}
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
                        customValidator={() => confirmPassword === adminPassword}
                        customErrorMessage='Passwords must match'
                        style={styles.input}
                        autoCapitalize="none"
                    />

                    <Button
                        mode="contained"
                        onPress={handleSetup}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                    >
                        Create Admin Account
                    </Button>

                    
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>

    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    margin: 40
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
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
  button: {
    marginTop: 24
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    maxHeight: 350,
    height: 200,
    aspectRatio: 733 / 1043
  }
});