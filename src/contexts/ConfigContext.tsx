import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppConfig {
  country: string;
  activeDistrict: string;
  activeSite: string;
  deviceIdKey: string;
  maxPatientAge: number;
  rrateIntegrationEnabled: boolean;
}

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  isConfigured: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  country: 'Uganda',
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
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configJson = await SecureStore.getItemAsync(CONFIG_KEY);
      if (configJson) {
        const loadedConfig = JSON.parse(configJson);
        setConfig(loadedConfig);
        setIsConfigured(!!loadedConfig.activeSite); // Configured if site is set - TODO make it more precise
      } else {
        setIsConfigured(false);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const updateConfig = async (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    await SecureStore.setItemAsync(CONFIG_KEY, JSON.stringify(newConfig));
    setIsConfigured(!!newConfig.activeSite);
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, isConfigured }}>
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