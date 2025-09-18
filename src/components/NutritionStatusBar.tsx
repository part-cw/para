import React from 'react';
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';

interface NutritionStatusProps {
  title?: string;
  content?: string;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: string | 'severe' | 'moderate' | 'normal' | 'invalid';
}

const NutritionStatusBar: React.FC<NutritionStatusProps> = ({
  title = "Nutrition Status",
  content,
  containerStyle,
  titleStyle,
  textStyle: textStyle,
  variant,
}) => {

  // Get colors based on variant
  const getVariantColors = () => {
    switch (variant) {
      case 'severe':
        return {
          backgroundColor: '#ffebee',   // #ffebee
          borderColor: '#f44336',       // #f44336
          textColor: '#d32f2f',         // #d32f2f
        };
      case 'moderate':
        return {
          backgroundColor: '#fff3e0',   // #fff3e0
          borderColor: '#ff9800',       // #ff9800
          textColor: '#e65100',         // #e65100
        };
      case 'normal':
        return {
          backgroundColor: '#e8f5e9',   // #e8f5e9
          borderColor: '#4caf50',       // #4caf50
          textColor: '#1b5e20',         // #1b5e20
        };
      default:
        return {
          backgroundColor: '#e3f2fd',   // #e3f2fd
          borderColor: '#2196f3',       // #2196f3
          textColor: '#0d47a1',         // #0d47a1
        };
    }
  };

  const variantColors = getVariantColors();

  const defaultContainerStyle: ViewStyle = {
    backgroundColor: variantColors.backgroundColor,
    padding: 8,
    marginTop: -10,
    marginBottom: 8,
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
    fontSize: 14,
    // marginBottom: 5,
  };

  const defaultErrorTextStyle: TextStyle = {
    color: variantColors.textColor,
    fontSize: 14,
    lineHeight: 20,
    // marginBottom: 4,
  };


 return (
    (variant !== 'invalid')
    ? 
    <View style={[defaultContainerStyle, containerStyle]}>
        
        {title &&
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={[defaultTitleStyle, titleStyle]}>
                    {title}
                </Text>
            </View>
        } 
    
        {content &&
            <View style={{ marginTop: 0 }}>
                <Text style={[defaultErrorTextStyle, textStyle]}>
                {content}
                </Text>
            </View>
        }
    </View>
    :
    null
  );
};

export default NutritionStatusBar;
