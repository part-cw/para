import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppConfig {
  activeDistrict: string;
  activeSite: string;
  deviceIdKey: string;
  maxPatientAge: number;
  rrateIntegrationEnabled: boolean;
}

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const DEFAULT_CONFIG: AppConfig = {
  activeDistrict: 'buikwe', // TODO - change this
  activeSite: 'SITE',
  deviceIdKey: 'A',
  maxPatientAge: 5.5,
  rrateIntegrationEnabled: false
};

const CONFIG_KEY = 'app_config';

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configJson = await SecureStore.getItemAsync(CONFIG_KEY);
      if (configJson) {
        setConfig(JSON.parse(configJson));
      } else {
        // First time - save defaults
        await SecureStore.setItemAsync(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const updateConfig = async (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    await SecureStore.setItemAsync(CONFIG_KEY, JSON.stringify(newConfig));
  };

  const resetToDefaults = async () => {
    setConfig(DEFAULT_CONFIG);
    await SecureStore.setItemAsync(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetToDefaults }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};