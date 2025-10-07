// ValidationSummary.tsx - Reusable validation summary component
import React, { useState } from 'react';
import { StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Icon } from 'react-native-paper';

interface ValidationSummaryProps {
  errors: string[];
  title?: string;
  showIcon?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  errorTextStyle?: StyleProp<TextStyle>;
  variant?: 'error' | 'warning' | 'info';
  initiallyExpanded?: boolean;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  title = "Please fix the following errors:",
  showIcon = true,
  containerStyle,
  titleStyle,
  errorTextStyle,
  variant = 'error',
  initiallyExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);


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
          icon: 'alert-circle'
        };
      case 'warning':
        return {
          backgroundColor: '#fff3e0',
          borderColor: '#ff9800',
          textColor: '#e65100',
          icon: 'alert'
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
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 8,
    marginTop: 3,
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
    marginBottom: 5,
  };

  const defaultErrorTextStyle: TextStyle = {
    color: variantColors.textColor,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

 return (
    <View style={[defaultContainerStyle, containerStyle]}>
      <TouchableOpacity 
        onPress={toggleExpanded}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'  }}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {showIcon && (
            <View style={{ marginRight: 5 }}>
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

        <Icon 
          source={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={variantColors.textColor}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={{ marginTop: 8 }}>
          {errors.map((error, index) => (
            (error.trim() !== '') &&
            <Text key={index} style={[defaultErrorTextStyle, errorTextStyle]}>
              • {error}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default ValidationSummary;
