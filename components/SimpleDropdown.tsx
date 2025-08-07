import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SelectList } from 'react-native-dropdown-select-list';
import { IconButton } from 'react-native-paper';

interface Item {
  key: string;
  label: string;
}

interface SimpleDropdownProps {
  items?: Item[];
  onSelect?: (value: string) => void;
}

export default function SimpleDropdown({ 
  items = [],
  onSelect 
}: SimpleDropdownProps) {
  const [selected, setSelected] = useState<string>('');

  // Handle selection with no parameters
  const handleSelect = () => {
    onSelect?.(selected);
  };

  const handleClear = () => {
    setSelected('');
    onSelect?.('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.dropdownContainer}>
        <SelectList
          setSelected={setSelected}
          data={items}
          dropdownStyles={styles.dropdown}
          boxStyles={styles.box}
          placeholder="Select item..."
          search={false}
          onSelect={handleSelect} // Pass function with no parameters
        />
        {selected && (
          <IconButton
            icon='clear'
            size={20}
            onPress={handleClear}
            style={styles.clearButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#cccccc',
    flex: 1,
  },
  box: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
});