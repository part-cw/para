import { GlobalStyles as Styles } from '@/src/themes/styles';
import React from 'react';
import { View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

type PaginationControlsProps = {
  onPrevious?: () => void;
  onNext?: () => void;
  labelPrevious?: string;
  labelNext?: string;
  showPrevious?: boolean;
  showNext?: boolean;
  disabledPrevious?: boolean;
  disabledNext?: boolean;
};

export default function PaginationControls({
  onPrevious,
  onNext,
  labelPrevious = 'Previous',
  labelNext = 'Next',
  showPrevious = true,
  showNext = true,
  disabledPrevious = false,
  disabledNext = false,
}: PaginationControlsProps) {
  const { colors } = useTheme();

  return (
    <View style={Styles.paginationButtonContainer}>
      {showPrevious && (
        <Button
          mode="elevated"
          buttonColor={colors.tertiary}
          textColor={colors.onPrimary}
          icon="arrow-left"
          contentStyle={{ flexDirection: 'row' }}
          onPress={onPrevious}
          disabled={disabledPrevious}
        >
          {labelPrevious}
        </Button>
      )}
      {showNext && (
        <Button
          mode="elevated"
          buttonColor={colors.tertiary}
          textColor={colors.onPrimary}
          icon="arrow-right"
          contentStyle={{ flexDirection: 'row-reverse' }}
          onPress={onNext}
          disabled={disabledNext}
        >
          {labelNext}
        </Button>
      )}
    </View>
  );
}