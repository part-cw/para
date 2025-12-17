import React, { useState } from 'react';
import { StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';


interface RiskCardProps {
  title?: string;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'low' | 'moderate' | 'high' | 'very high' | string;
  expandable?: boolean
  initiallyExpanded?: boolean;
  onExpandChange?: (isExpanded: boolean) => void;
  content?: string | React.ReactNode;
  contentStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode
}

const RiskCard: React.FC<RiskCardProps> = ({
  title,
  containerStyle,
  titleStyle,
  textStyle,
  variant,
  expandable,
  initiallyExpanded = false,
  content,
  contentStyle,
  children,
  onExpandChange
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  
  const { colors } = useTheme()


  // Get colors based on variant
  const getVariantColors = () => {
    switch (variant) {
        case 'very high':
            return {
                backgroundColor: '#ffebee',   // #ffebee
                borderColor: '#f44336',       // #f44336
                textColor: '#d32f2f',         // #d32f2f
            };
        case 'high':
            return {
                backgroundColor: '#fff3e0',   // #fff3e0
                borderColor: '#ff9800',       // #ff9800
                textColor: '#e65100',         // #e65100
            };
      case 'moderate':
            return {
                backgroundColor: 'rgb(255, 254, 224)',  //rgb(255, 254, 224)
                borderColor: 'rgb(255, 234, 0)',        //rgb(255, 221, 0)
                textColor: 'rgba(197, 149, 5, 0.82)',          //rgb(230, 169, 0) rgba(197, 149, 5, 0.82)
            };
      case 'low':
            return {
                backgroundColor: '#e8f5e9',   // #e8f5e9
                borderColor: '#4caf50',       // #4caf50
                textColor: '#1b5e20',         // #1b5e20
            };
      default:
            return {
                backgroundColor: colors.secondary,   // #e3f2fd 
                borderColor: '#2196f3',              // #2196f3
                textColor: '#0d47a1',                // #0d47a1
            };
    }
  };

  const variantColors = getVariantColors();

  const defaultContainerStyle: ViewStyle = {
    backgroundColor: variantColors.backgroundColor,
    padding: 16,
    marginLeft: 10,
    marginRight: 10,
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
    fontSize: 18,
    marginBottom: 5,
  };

  const defaultTextStyle: TextStyle = {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  };

  const toggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onExpandChange) {
      onExpandChange(newExpandedState);
    }
  };

  const renderContent = () => {
    if (!content) return null;
    
    if (typeof content === 'string') {
      return <Text style={[defaultTextStyle, contentStyle]}>{content}</Text>;
    }
    
    // Return React element directly
    return <View style={{ width: '100%', alignItems: 'flex-start' }}>{content}</View>;
  };


 return (
    <View style={[defaultContainerStyle, containerStyle]}>
        {expandable 
            ?
            <TouchableOpacity 
                onPress={toggleExpanded}
                style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'center', 
                    position: 'relative',
                    width: '100%'}}
                activeOpacity={0.7}
            >
                <Text style={[defaultTitleStyle, titleStyle]}>
                        {title}
                </Text>
                <View style={{ position: 'absolute', right: 0 }}>
                    <Icon 
                        source={isExpanded ? 'chevron-double-up' : 'chevron-double-down'}
                        size={24}
                        color={variantColors.textColor}
                    />
                </View>
            </TouchableOpacity>
            :
            <>
                <Text style={[defaultTitleStyle, titleStyle]}>
                            {title}
                </Text>
            </>
        }

        {renderContent()}

       {isExpanded && children &&
            <View style={{ marginTop: 8}}>
                {children}
            </View>
        }

    </View>
  );
};

export default RiskCard;