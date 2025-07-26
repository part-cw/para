import { GlobalStyles as Styles } from '@/themes/styles';
import React from 'react';
import { View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';


type PaginationProps = {
  onPress: () => void;
  label?: string;
  icon?: string;
  isNext?: boolean;
  disabled?: boolean;
};


export default function PaginationButton({ onPress, label, disabled=false, isNext }: PaginationProps) {
  const { colors } = useTheme();

  return (
    <View style={isNext ? Styles.nextButtonContainer : Styles.previousButtonContainer}>
      <Button
        mode="elevated"
        buttonColor={colors.tertiary}
        textColor={colors.onPrimary}
        icon= {isNext ? "arrow-right" : 'arrow-left'}
        contentStyle={{ flexDirection: isNext ? 'row-reverse' : 'row' }}
        onPress={onPress}
        disabled={disabled}>
          {label}
      </Button>
    </View>
  );
}