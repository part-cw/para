import React, { useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardTypeOptions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { IconButton } from 'react-native-paper';

export interface DropdownItem {
  key: string;
  value: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  formattedValue?: string;
}

interface SearchableDropdownProps {
  data: DropdownItem[];
  placeholder?: string;
  label: string;
  onSelect: (selected: DropdownItem) => void;
  onAddItem?: (item: DropdownItem) => void;
  value?: string;
  maxHeight?: number;
  style?: ViewStyle;
  search?: boolean;
  validator?: (value: string) => ValidationResult;
  formatter?: (value: string) => string; // TODO - remove formatter?
  showError?: boolean;
  keyboard?: KeyboardTypeOptions;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  data = [],
  placeholder = "Search or enter new...",
  label,
  onSelect= (_: DropdownItem) => {},
  onAddItem,
  value = "",
  maxHeight = 200,
  style = {},
  search = true,
  validator,
  formatter,
  showError = true,
  keyboard = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState(value);
  const [isSearching, setIsSearching] = useState(false)
  const [filteredData, setFilteredData] = useState(data);
  const [_firstRender,_setFirstRender] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string>('');
  const [hasValidationError, setHasValidationError] = useState(false);
  
  const animatedvalue = React.useRef(new Animated.Value(0)).current;
  const labelAnim = React.useRef(new Animated.Value(searchText ? 1 : 0)).current;
  
  const showNoResults = isOpen && searchText.length > 0 && filteredData.length === 0;
  const showAddNew = showNoResults && !data.some(d => d.value.toLowerCase() === searchText.toLowerCase().trim()); // or use allData?
  const showFloatingLabel = isFocused || searchText.length > 0;
  const showClearIcon = (searchText.trim() !== '') 
  
  // TODO - show input error when close dropdown and invalid entry -- make sure searchText is not set
  // currently it only shows error message if click ok from keyboard or 'add'
  
  // Validate input
  const validateInput = (input: string): ValidationResult => {
    if (validator) {
      return validator(input);
    }
    return { isValid: true };
  };

  const animateLabel = (toValue: number) => {
    Animated.timing(labelAnim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };
  
  // adapted from react-native-dropdown-select-list
  const slidedown = () => {
    setIsOpen(true)
    setIsFocused(true)
    Animated.timing(animatedvalue,{
        toValue: maxHeight,
        duration:300,
        useNativeDriver:false,
        easing: Easing.out(Easing.ease)
        
    }).start()
  }

  const slideup = () => {   
    Animated.timing(animatedvalue,{
        toValue:0,
        duration:300,
        useNativeDriver:false,
        easing: Easing.out(Easing.ease)
        
    }).start(() => {
      setIsOpen(false)
      setIsFocused(false)
      setIsSearching(false)
    })
  }

  // animate label and dropdown slider
  React.useEffect(() => {
    if(!_firstRender){
      if (isOpen) {
        slidedown()
        animateLabel(1) // float
      } else {
        slideup()
        if (!searchText.trim()) {
          animateLabel(0) // unfloat if no text
        }  
      }
    }
  },[isOpen])

  // handle first render flag
  React.useEffect(() => {
    if(_firstRender){
      _setFirstRender(false);
      return;
    }

    // float label if searchText is not null
    if (searchText) {
      animateLabel(1);
    }
  },[searchText])

  // updates search text based on parent's value
  React.useEffect(() => {
    setSearchText(value || '');
  }, [value]);

  // sets dropdown selections when data changes (e.g. is filtered)
  React.useEffect(() => {
    if (searchText.trim()) {
      filterData(searchText.trim());
    } else {
      setFilteredData(data);
    }
  }, [data]);  

  // Filter data based on search text
  const filterData = (trimmedText: string) => {
    if (!trimmedText) {
      setFilteredData(data);
      return;
    }
    
    if (isSearching && trimmedText) {
      const filtered = data.filter((item: DropdownItem) =>
        item.value.toLowerCase().includes(trimmedText.toLowerCase())
      );

      setFilteredData(filtered);
    }
  
  };

  // TODO add callback to all handlers??
  
  const handleTextChange = (text: string) => {
    setIsSearching(true)

    // Clear previous validation errors when user starts typing
    if (hasValidationError) {
      setHasValidationError(false);
      setValidationError('');
    }
    
    // set trimmed text to '' and clear if empty string, othwerwise set to text
    if (!text.trim()) {
      setSearchText('')
      setFilteredData(data)
      onSelect({ key: '', value: '' });
    } else {
      setSearchText(text)
    }
    filterData(text.trim());

    if (text.trim().length > 0 || isFocused) {
      animateLabel(1); // float
    } else {
      animateLabel(0); // shrink
    }
  }

  const handleBlur = () => {
    // Validate on blur if validator exists and there's text
    if (validator && searchText.trim()) {
      const validation = validateInput(searchText.trim());
      if (!validation.isValid) {
        setHasValidationError(true);
        setValidationError(validation.errorMessage || 'Invalid input');
        
        if (isOpen) {
          slideup();
        }
      } else {
        setHasValidationError(false);
        setValidationError('');
        
        // Apply formatting if formatter exists
        if (formatter && validation.formattedValue) {
          setSearchText(validation.formattedValue);
          onSelect({ key: `formatted-${Date.now()}`, value: validation.formattedValue });
        }
      }
    }
  }

  const handleClear = () => {
    setSearchText('')
    setFilteredData(data)
    setHasValidationError(false)
    setValidationError('')
    onSelect({ key: '', value: '' }); // notify parent that the selection is cleared
    Keyboard.dismiss()
  }

  const handleAddNew = () => {
    if (!onAddItem) {
      return
    }

    const trimmedText = searchText.trim();

    // Validate before adding if validator exists
    if (validator) {
      const validation = validateInput(trimmedText);
      if (!validation.isValid) {
        setHasValidationError(true);
        setValidationError(validation.errorMessage || 'Invalid input');
        slideup()
        return; // Don't add invalid item
      }
    }

    const valueToAdd = formatter ? formatter(trimmedText) : trimmedText;

    const newItem: DropdownItem = {
      key: `new-${Date.now()}`, // TODO change to hash?
      value: valueToAdd,
    };

    onAddItem?.(newItem)
    onSelect(newItem);
    setSearchText(newItem.value)
    slideup();
    Keyboard.dismiss();
  }

  const handleItemSelect = (item: DropdownItem) => {
    setSearchText(item.value)
    setHasValidationError(false)
    setValidationError('')
    onSelect(item)
    slideup()
  } 
  
  // Determine border color based on validation state
  const getBorderColor = () => {
    if (hasValidationError) return '#d32f2f'; // Red for error
    if (isFocused) return '#1976d2'; // Blue for focused
    return '#c4c4c4'; // Default gray
  };

  const getBorderWidth = () => {
    return (isFocused || hasValidationError) ? 2 : 1;
  };
  

  return (
    <View style={[styles.container, style]}>
      {
        (isOpen && search)
        ?
        <View style={[
          styles.inputContainer, 
          styles.inputContainerOpen, 
          { 
            borderColor: getBorderColor(),
            borderWidth: getBorderWidth()
          }
        ]}>
          {showFloatingLabel && (
            <Animated.Text
              style={[
                styles.floatingLabel,
                {
                  top: labelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, -12],
                  }),
                  fontSize: labelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 12],
                  }),
                  color: hasValidationError ? '#d32f2f' : (isFocused ? '#1976d2' : '#666'),
                },
              ]}>
                {label}
              </Animated.Text>
            )
          }
        
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.textInput}
              placeholder={!showFloatingLabel ? label : placeholder}
              onChangeText={handleTextChange}
              onBlur={handleBlur}
              value={searchText}
              keyboardType={keyboard}>
            </TextInput>
            <View style={styles.iconContainer}>
              { showClearIcon &&
                <IconButton
                  icon="close-circle-outline"
                  size={25}
                  style={styles.clearIcon}
                  iconColor="rgb(234, 150, 150)"
                  onPress={handleClear}
                />
              }
              <IconButton
                icon="chevron-down"
                size={25}
                style={[
                  styles.dropdownIcon,
                  (isFocused && isOpen) && styles.dropdownIconOpen
                ]}
                onPress={() => slideup()}
              />
            </View>
          </View>
        </View>
        :
        <View style={[
          styles.inputContainer, 
          { 
            borderColor: getBorderColor(),
            borderWidth: getBorderWidth()
          }
        ]}>
          {showFloatingLabel && (
              <Animated.Text
                style={[
                  styles.floatingLabel,
                  {
                    top: labelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, -12],
                    }),
                    fontSize: labelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 12],
                    }),
                    color: hasValidationError ? '#d32f2f' : (isFocused ? '#1976d2' : '#666'),
                  },
                ]}>
                  {label}
              </Animated.Text>
            )
          }

          <TouchableOpacity 
            style={styles.inputRow}
            onPress={() => {
              if (!isOpen) {
                Keyboard.dismiss();
                slidedown();
              } else {
                slideup();
              }
            }
          }>
            <Text style={styles.textInput}>
              {
                searchText.trim().length > 0 
                  ? searchText
                  : !showFloatingLabel
                    ? label
                    : placeholder
              }
            </Text>
            <View style={styles.iconContainer}>
              { showClearIcon &&
                <IconButton
                  icon="close-circle-outline"
                  size={25}
                  style={styles.clearIcon}
                  iconColor="rgb(234, 150, 150)"
                  onPress={handleClear}
                />
              }
              <IconButton
                icon="chevron-down"
                size={25}
                style={[
                  styles.dropdownIcon,
                  (isFocused && isOpen) && styles.dropdownIconOpen
                ]}
              />
            </View>
          </TouchableOpacity>

        </View>
      }

      {/* Error message */}
      {hasValidationError && showError && (
        <Text style={styles.errorText}>{validationError}</Text>
      )}
      
      {
        isOpen
        ? 
          <Animated.View style={[styles.dropdown, { maxHeight:animatedvalue }]}>
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{overflow: 'hidden'}}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {
                  (filteredData.length > 0) 
                  ? 
                    filteredData.map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={styles.dropdownItem}
                        activeOpacity={0.7}
                        onPress={() => handleItemSelect(item)}
                      >
                        <Text style={styles.dropdownItemText}>{item.value}</Text>
                      </TouchableOpacity>
                    ))
                  : 
                   showAddNew ? 
                  (
                <TouchableOpacity
                  style={[styles.dropdownItem, styles.addNewItem]}
                  onPress={handleAddNew}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addNewText}>
                    Add "{searchText}"
                  </Text>
                </TouchableOpacity>
              )
                : null
              }
            </ScrollView>
          </Animated.View>
        :
        null
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 10,
    zIndex: 1000,
    flex: 1,          // Allow expansion
    minHeight: 'auto' // Dynamic height
  },
  inputContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#c4c4c4',
    borderRadius: 10,
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
  textInput: {
    textAlignVertical: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    flex: 1,
    // ...Platform.select({
    //   web: {
    //     outlineStyle: 'none',
    //   },
    // }),
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
  clearIcon: {
    marginRight: 0
  },
  dropdownIcon: {
    transform: [{ rotate: '0deg' }],
    transitionDuration: '150ms',
    marginLeft: 0
  },
  dropdownIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  dropdown: {
    marginTop: 0,
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
   errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
    lineHeight: 16,
  },
});

export default SearchableDropdown;