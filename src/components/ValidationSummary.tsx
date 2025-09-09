// ValidationSummary.tsx - Reusable validation summary component
import React from 'react';
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

interface ValidationSummaryProps {
  errors: string[];
  title?: string;
  showIcon?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  errorTextStyle?: StyleProp<TextStyle>;
  variant?: 'error' | 'warning' | 'info';
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  title = "Please fix the following errors:",
  showIcon = true,
  containerStyle,
  titleStyle,
  errorTextStyle,
  variant = 'error'
}) => {
  const { colors } = useTheme();

  // Don't render if no errors
  if (!errors || errors.length === 0) {
    return null;
  }

  // Get colors based on variant
  const getVariantColors = () => {
    switch (variant) {
      case 'error':
        return {
          backgroundColor: '#ffebee',
          borderColor: '#f44336',
          textColor: '#d32f2f',
          icon: 'alert'
        };
      case 'warning':
        return {
          backgroundColor: '#fff3e0',
          borderColor: '#ff9800',
          textColor: '#e65100',
          icon: 'alert-circle'
        };
      case 'info':
        return {
          backgroundColor: '#e3f2fd',
          borderColor: '#2196f3',
          textColor: '#0d47a1',
          icon: 'information'
        };
      default:
        return {
          backgroundColor: '#ffebee',
          borderColor: '#f44336',
          textColor: '#d32f2f',
          icon: 'alert-circle'
        };
    }
  };

  const variantColors = getVariantColors();

  const defaultContainerStyle: ViewStyle = {
    backgroundColor: variantColors.backgroundColor,
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: variantColors.borderColor,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  };

  const defaultTitleStyle: TextStyle = {
    color: variantColors.textColor,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  };

  const defaultErrorTextStyle: TextStyle = {
    color: variantColors.textColor,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  };

  return (
    <View style={[defaultContainerStyle, containerStyle]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        {showIcon && (
            <View style={[{ marginRight: 8 }, {marginBottom: 5}]}>
                <Icon 
                    source={variantColors.icon}
                    size={20}
                    color={variantColors.textColor}
                />
            </View>
        )}
        <Text style={[defaultTitleStyle, titleStyle]}>
            {title}
        </Text>
      </View>
      {errors.map((error, index) => (
        <Text key={index} style={[defaultErrorTextStyle, errorTextStyle]}>
          • {error}
        </Text>
      ))}
    </View>
  );
};

export default ValidationSummary;

// Usage examples:

// Basic usage
/*
import ValidationSummary from '@/src/components/ValidationSummary';

// In your render:
<ValidationSummary errors={validationErrors} />
*/

// Advanced usage with customization:
/*
<ValidationSummary 
  errors={validationErrors}
  title="Form Validation Errors"
  variant="error"
  showIcon={true}
  containerStyle={{ margin: 8 }}
/>
*/

// Different variants:
/*
// Error (default)
<ValidationSummary errors={criticalErrors} variant="error" />

// Warning
<ValidationSummary 
  errors={warnings} 
  variant="warning" 
  title="Please review the following:"
/>

// Info
<ValidationSummary 
  errors={infoMessages} 
  variant="info" 
  title="Additional information:"
/>
*/

// Custom styling:
/*
<ValidationSummary 
  errors={validationErrors}
  containerStyle={{
    backgroundColor: '#custom-bg',
    borderRadius: 12,
    margin: 20
  }}
  titleStyle={{
    fontSize: 18,
    color: '#custom-color'
  }}
  errorTextStyle={{
    fontSize: 16,
    fontStyle: 'italic'
  }}
/>
*/