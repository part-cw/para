// ValidationContext.tsx - Create a new context to manage validation state
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface ValidationContextType {
  validationErrors: Record<string, string[]>;
  setValidationErrors: (screen: string, errors: string[]) => void;
  clearValidationErrors: (screen: string) => void;
  hasAnyValidationErrors: boolean;
  getScreenErrors: (screen: string) => string[];
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};

interface ValidationProviderProps {
  children: ReactNode;
}

export const ValidationProvider: React.FC<ValidationProviderProps> = ({ children }) => {
  const [validationErrors, setValidationErrorsState] = useState<Record<string, string[]>>({});

  const setValidationErrors = (screen: string, errors: string[]) => {
    setValidationErrorsState(prev => ({
      ...prev,
      [screen]: errors
    }));
  };

  const clearValidationErrors = (screen: string) => {
    setValidationErrorsState(prev => {
      const newErrors = { ...prev };
      delete newErrors[screen];
      return newErrors;
    });
  };

  const hasAnyValidationErrors = Object.values(validationErrors).some(errors => errors.length > 0);

  const getScreenErrors = (screen: string) => validationErrors[screen] || [];

  return (
    <ValidationContext.Provider value={{
      validationErrors,
      setValidationErrors,
      clearValidationErrors,
      hasAnyValidationErrors,
      getScreenErrors
    }}>
      {children}
    </ValidationContext.Provider>
  );
};