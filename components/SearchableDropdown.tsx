import React, { useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { IconButton } from 'react-native-paper';

interface SearchableDropdownProps {
  data?: string[];
  placeholder?: string;
  label?: string;
  onSelectionChange?: (value: string) => void;
  value?: string;
  maxHeight?: number;
  style?: ViewStyle;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  data = [],
  placeholder = "Search or enter new...",
  label,
  onSelectionChange,
  value = "",
  maxHeight = 200,
  style = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState(value);
  const [filteredData, setFilteredData] = useState(data);
  const inputRef = useRef(null);
  const dropdownTouchedRef = useRef(false);

  // console.log('isFocused', isFocused)
  // console.log('isOpen', isOpen)
  // console.log("inputRef", inputRef.current)

  // Filter data based on search text
  const filterData = (trimmedText: string) => {
    if (!trimmedText) {
      setFilteredData(data);
      return;
    }
    
    const filtered = data.filter((item: string) =>
      item.toLowerCase().includes(trimmedText.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    filterData(text.trim());
    
    if (!isOpen && text.trim().length > 0) {
      setIsOpen(true);
    }
    
    // console.log('here!!!')
    // console.log('onSelectionChange', onSelectionChange)
    // Call the callback with the current text
    if (onSelectionChange) {
        // console.log('insde here condition$$')
      onSelectionChange(text);
    }
  };

  const handleItemSelect = (item: string) => {
    console.log('Item selected:', item); // Debug log
    setSearchText(item);
    setIsOpen(false);
    setIsFocused(false);
    Keyboard.dismiss();

    dropdownTouchedRef.current = false;
    
    if (onSelectionChange) {
      onSelectionChange(item);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
    console.log('inside handleFocus. searchtext: ', searchText)
    filterData(searchText);
  };

  const handleBlur = () => {
    console.log('handleblur, dropdownRef.curr', dropdownTouchedRef.current)
     // Longer delay to ensure item selection works - TODO fix this
    setTimeout(() => {
        console.log('setTimeout%%%', dropdownTouchedRef.current)
        if (dropdownTouchedRef.current) {
          dropdownTouchedRef.current = false;
          return;
        }

        console.log('Closing dropdown from blur');
        setIsFocused(false);
        setIsOpen(false);
    }, 200); // TODO change?
  };

  const handleSubmit = () => {
    setIsOpen(false);
    Keyboard.dismiss();
    
    // If text doesn't exist in data, still call the callback
    if (onSelectionChange) {
      onSelectionChange(searchText);
    }
  };

  const showNoResults = isOpen && searchText.length > 0 && filteredData.length === 0;
  const showAddNew = showNoResults && !data.includes(searchText);
  const shouldShowFloatingLabel = isFocused || searchText.length > 0;

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        isOpen && styles.inputContainerOpen
      ]}>
        {shouldShowFloatingLabel && (
          <Text style={[
            styles.floatingLabel,
            isFocused && styles.floatingLabelFocused
          ]}>
            {label}
          </Text>
        )}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              shouldShowFloatingLabel && styles.textInputWithLabel
            ]}
            placeholder={!shouldShowFloatingLabel ? label : placeholder}
            value={searchText}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />
          <IconButton
              icon="chevron-down"
              size={25}
              onPress={() => {
                setIsOpen(!isOpen)
                setIsFocused(!isFocused)
              }}
                style={[
                  styles.dropdownIcon,
                  (isFocused && isOpen) && styles.dropdownIconOpen
              ]}
            />
        </View>
      </View>
      
      {isOpen && (
        // <Pressable 
        //   onPressIn={() => {console.log('***pressable onPressin')
        //                     dropdownTouchedRef.current = true}}
        //   style={{ zIndex: 1000 }}>
          <View style={[styles.dropdown, { maxHeight }]}>
            {filteredData.length > 0 ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {filteredData.map((item, index) => (
                  <TouchableOpacity
                    key={`${item}-${index}`}
                    style={styles.dropdownItem}
                    onPressIn={() => {
                      console.log('TouchableOpacity onPressIn for item:', item);
                      dropdownTouchedRef.current = true;
                    }}
                    onPress={() => {
                      console.log('item', item)
                      handleItemSelect(item)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : showAddNew ? (
              <TouchableOpacity
                style={[styles.dropdownItem, styles.addNewItem]}
                onPressIn={() => {
                  console.log('TouchableOpacity onPressIn for addnew');
                  dropdownTouchedRef.current = true;
                }}
                onPress={() => handleItemSelect(searchText)}
                activeOpacity={0.7}
              >
                <Text style={styles.addNewText}>
                  Add "{searchText}"
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        // </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#c4c4c4',
    borderRadius: 4,
    backgroundColor: '#fff',
    minHeight: 56,
    justifyContent: 'center',
  },
  inputContainerFocused: {
    borderColor: '#1976d2',
    borderWidth: 2,
  },
  inputContainerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  floatingLabel: {
    position: 'absolute',
    top: -12,
    left: 12,
    fontSize: 16,
    color: '#666',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  floatingLabelFocused: {
    color: '#1976d2',
  },
  textInput: {
    height: 56,
    textAlignVertical: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    flex: 1,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  textInputWithLabel: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  dropdownIcon: {
    transform: [{ rotate: '0deg' }],
    transitionDuration: '150ms',
  },
  dropdownIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  arrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1976d2',
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    }),
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  addNewItem: {
    backgroundColor: '#f3f4f6',
  },
  addNewText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
  },
});

export default SearchableDropdown;