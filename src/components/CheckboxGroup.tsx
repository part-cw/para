import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
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
  allowOther?: boolean
  onOtherValueChange?: (value: string) => void
  otherLabel?: string,
  otherValue?: string,
  otherPlaceholder?: string,
};

// Displays a group of radio buttons. 
export default function CheckboxGroup({ 
  options, 
  selected, 
  onSelectionChange,
  label,
  allowOther = false,
  onOtherValueChange,
  otherLabel = 'Other',
  otherValue = '',
  otherPlaceholder = 'Please specify...'
}: Props) {

  const [isOtherSelected, setIsOtherSelected] = useState<boolean>(false)

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

  const handleOtherToggle = () => {
    console.log('toggling other..')
    
    const newIsOtherSelected = !isOtherSelected;
    setIsOtherSelected(newIsOtherSelected);

    if (!newIsOtherSelected) {
      // Clear 'other' text when unchecked and remove from selected
      const filtered = selected.filter(item => !item.startsWith('other'))
      console.log('@@@ filterd', filtered)

      onOtherValueChange?.(''); // clear textinput
      otherValue = '';
      onSelectionChange([... filtered]) // remove 'other' from selected list

      console.log('@@@ cleared other ocndition tedxt', otherValue)
      console.log('@@@ removed "other" from selected...', selected)

    } else {
      // Add 'Other' to selected items list
      console.log('@@@ adding other to selected list...')
      onSelectionChange([... selected, 'other'])
    }  
  }



  return (
    <View style={styles.container}>
      {label && <Text style={styles.groupLabel}>{label}</Text>}

      {/* Regular options */}
      {options.map((option) => {
        const isChecked = selected.includes(option.value)

        return (
          <Checkbox
            key={option.value}
            label={option.label}
            checked= {isChecked}
            onChange={() => handleCheckboxToggle(option.value)}
          />
        )
      })}

      {/* other option*/}
      { allowOther &&
        <View>
          <Checkbox
              label={otherLabel}
              checked= {isOtherSelected}
              onChange={handleOtherToggle}
          />

        {/* text input for 'Other' option */}
        {isOtherSelected &&
          <TextInput
            style={{
              marginLeft: 32,
              marginTop: 8,
              marginBottom: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 4,
              fontSize: 16,
              backgroundColor: '#fff',
            }}
            placeholder={otherPlaceholder}
            value={otherValue}
            onChangeText={onOtherValueChange}
            autoFocus
          />
        }
        </View>
      }
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


// check other --> selected corretly inlcudes other'
// enter othervalye --> sleected correctlty changes other to other: {value}
// manually delete other valuye, selcted correctly changes back to 'other;'
// renenter value, then uncheck 'other' - UI behaves correctlyt BUT other:value still saved in the backend. it should be complete gone (ie no other or other: value) 
// recheck other, other valye not displayed (correct), and backend only stores 'other' (correct)