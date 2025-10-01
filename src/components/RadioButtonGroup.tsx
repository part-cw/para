import { AppTheme } from '@/src/themes/theme';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

// This component is adapted from RRate
// RRate github:  https://github.com/part-cw/rrate/blob/main/components/RadioButtonGroup.tsx

type Option = {
  label: string;
  value: string;
};

type Props = {
  options: Option[];
  selected: string | boolean | null;
  onSelect: (value: string) => void;
};

// Displays a group of radio buttons. 
export default function RadioButtonGroup({ options, selected, onSelect }: Props) {
  return (
    <View style={{flexDirection: 'column'}}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onSelect(option.value)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 8
          }}
        >
          <MaterialIcons
            name={selected === option.value ? 'radio-button-checked' : 'radio-button-unchecked'}
            size={24}
            color={selected === option.value ? AppTheme.colors.primary : '#999'}
          />
          <Text style={{ marginLeft: 10, fontSize: AppTheme.fonts.bodyLarge.fontSize }}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
} 