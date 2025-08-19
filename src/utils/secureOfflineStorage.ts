import * as SecureStore from 'expo-secure-store';
// import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// TODO For web compatibility (SecureStore doesn't work on web)
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import CryptoJS from 'crypto-js';

export class SecureOfflineStorage {
    private static readonly PATIENTS_KEY = 'secure_patients';
    private static readonly SYNC_QUEUE_KEY = 'secure_sync_queue';
    private static readonly SETTINGS_KEY = 'secure_settings';
    private static readonly WEB_ENCRYPTION_KEY = 'secure_web_key';

    // Platform-specific secure storage
    private static async secureSetItem(key: string, value: string): Promise<void> {
        if (Platform.OS !== 'web') {
            // For iOS/Android, use SecureStore (hardware-backed encryption)
            await SecureStore.setItemAsync(key, value);
        
        } 
        // TODO For web, use AsyncStorage with encryption
        // const encryptionKey = await this.getWebEncryptionKey();
        // const encrypted = CryptoJS.AES.encrypt(value, encryptionKey).toString();
        // localStorage.setItem(key, encrypted);
    }
  

}