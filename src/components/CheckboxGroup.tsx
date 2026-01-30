import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { normalizeBoolean } from '../utils/normalizer';
import Checkbox from './Checkbox';

type Option = {
  label: string;
  value: string;
};

type Props = {
  options: Option[];
  selected: string[]
  onSelectionChange: (selected: string[]) => void;
  label?: string
};

// Displays a group of radio buttons. 
export default function CheckboxGroup({ 
  options, 
  selected, 
  onSelectionChange,
  label,
}: Props) {

  const handleCheckboxToggle = (value: string) => {
    const isSelected = selected.includes(value)

    if (isSelected) {
      // remove selection
      onSelectionChange(selected.filter(v => v !== value))
    } else {
      // add selection
      onSelectionChange([... selected, value])
    }
  }


  return (
    <View style={styles.container}>
      {label && <Text style={styles.groupLabel}>{label}</Text>}

      {options.map((option) => {
        const isChecked = selected.includes(option.value)

        return (
          <Checkbox
            key={option.value}
            label={option.label}
            checked= {normalizeBoolean(isChecked)}
            onChange={() => handleCheckboxToggle(option.value)}
          />
        )
      })}

    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  otherInput: {
    marginLeft: 32,
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});
