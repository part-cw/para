import ValidatedTextInput from '@/src/components/ValidatedTextInput';
import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);
    const success = await login(username.trim(), password);
    setLoading(false);

    if (success) {
      router.replace('/');
    } else {
      Alert.alert('Login Failed', 'Invalid username or password');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.logoContainer}>
            <Image
                style={styles.logo}
                source={require('../src/assets/images/smart-discharges-logo_script.png')}
                resizeMode='contain'
            />
        </View>

        <Text variant="titleLarge" style={[styles.title, { color: 'black' }]}>
          Sign in to your account
        </Text>
        
        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
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
        
        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Login
        </Button>

        <TouchableOpacity onPress={() => {
            Platform.OS !== 'web' 
            ?
            Alert.alert('Password Reset','Contact your site administrator to reset your password.')
            :
            window.confirm('Contact your site administrator to reset your password.')
          }
          }>
          <Text style={[styles.text, {color: colors.primary}]}>
            Forgot your password?
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
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
    marginBottom: 20,
    fontWeight: 'bold'
  },
  input: {
    marginBottom: 25
  },
  button: {
    marginTop: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    maxHeight: 350,
    height: 200,
    aspectRatio: 733 / 1043
  },
  text: {
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700'
  }
});