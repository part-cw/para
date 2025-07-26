import { GlobalStyles as Styles } from '@/themes/styles';
import React from 'react';
import { View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';


type NextButtonProps = {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  isNext?: boolean;
};


export default function PaginationButton({ onPress, label, disabled=false, isNext }: NextButtonProps) {
  const { colors } = useTheme();

  return (
    <View style={Styles.paginationButtonContainer}>
      <Button
        mode="contained"
        buttonColor={colors.tertiary}
        textColor={colors.onPrimary}
        icon="arrow-right"
        contentStyle={{ flexDirection: 'row-reverse' }}
        // style={Styles.paginationButtonStyle}
        onPress={onPress}
        disabled={disabled}>
          {label}
      </Button>
    </View>
  );
}