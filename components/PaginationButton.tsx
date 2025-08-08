import React from 'react';
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
  );
}