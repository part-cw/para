import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { getStorageInstance } from '../services/StorageInstance';
import { IStorageService } from '../services/StorageService';

interface StorageContextType {
  storage: IStorageService;
  isInitialized: boolean;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [storage] = useState<IStorageService>(() => getStorageInstance());
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        console.log('🔄 Initializing storage...');
        await storage.init();
        console.log('✅ Storage initialized successfully');
        setIsInitialized(true);
      } catch (err) {
        console.error('❌ Failed to initialize storage:', err);
        setError(err instanceof Error ? err.message : 'Unknown storage error');
      }
    };
    
    initializeStorage();
  }, []);

  // Show loading screen while initializing
  if (!isInitialized && !error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16, fontSize: 16 }}>Loading data...</Text>
      </View>
    )
  }

  // Show error screen if initialization failed
  // if (error) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'white' }}>
  //       <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: 'red' }}>
  //         Database Error
  //       </Text>
  //       <Text style={{ textAlign: 'center' }}>{error}</Text>
  //       <Text style={{ marginTop: 16, textAlign: 'center', color: '#666' }}>
  //         Please restart the app. If the problem persists, contact support.
  //       </Text>
  //     </View>
  //   );
  // }

  return (
    <StorageContext.Provider value={{ storage, isInitialized }}>
      {children}
    </StorageContext.Provider>
  );
}

/**
 * Hook to access storage throughout the app
 * 
 * Usage:
 * const { storage } = useStorage();
 * const patients = await storage.getPatients();
 */
export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};