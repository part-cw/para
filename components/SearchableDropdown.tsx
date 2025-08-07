import React, { useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
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

interface SearchableDropdownProps {
  data?: string[];
  placeholder?: string;
  label?: string;
  onSelect?: (selected: string) => void;
  value?: string;
  maxHeight?: number;
  style?: ViewStyle;
  search: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  data = [],
  placeholder = "Search or enter new...",
  label,
  onSelect= (_: string) => {},
  value = "",
  maxHeight = 200,
  style = {},
  search = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState(value);
  const [filteredData, setFilteredData] = useState(data);
  const [_firstRender,_setFirstRender] = useState<boolean>(true);
  
  const animatedvalue = React.useRef(new Animated.Value(0)).current;
  const labelAnim = React.useRef(new Animated.Value(searchText ? 1 : 0)).current;

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
        })
  }

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

  React.useEffect(() => {
      if(_firstRender){
        _setFirstRender(false);
        return;
      }
      onSelect(searchText)
  },[searchText])

  React.useEffect(() => {
  if (searchText) {
    animateLabel(1);
  }
  }, []);

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

  const showNoResults = isOpen && searchText.length > 0 && filteredData.length === 0;
  const showAddNew = showNoResults && !data.includes(searchText);
  const showFloatingLabel = isFocused || searchText.length > 0;

  return (
    <View style={[styles.container, style]}>
      {
        (isOpen && search)
        ?
        <View style={[styles.inputContainer, styles.inputContainerOpen, isFocused && styles.inputContainerFocused,]}>
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
                  color: isFocused ? '#1976d2' : '#666',
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
              onChangeText={(text: string) => {
                // set trimmed text to '' if empty string, othwerwise set to text
                !text.trim() ? setSearchText('') : setSearchText(text)
                filterData(text.trim());

                if (text.trim().length > 0 || isFocused) {
                  animateLabel(1); // float
                } else {
                  animateLabel(0); // shrink
                }
              }}
              value={searchText}>
            </TextInput>
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
        :
        <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
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
                    color: isFocused ? '#1976d2' : '#666',
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
            <IconButton
              icon="chevron-down"
              size={25}
              style={[
                styles.dropdownIcon,
                (isFocused && isOpen) && styles.dropdownIconOpen
              ]}
            />
          </TouchableOpacity>

        </View>
      }
      
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
                    filteredData.map((item, index) => (
                      <TouchableOpacity
                        key={`${item}-${index}`}
                        style={styles.dropdownItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSearchText(item)
                          onSelect(item)
                          slideup()
                          setTimeout(() => {setFilteredData(data)}, 800)
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))
                  : 
                  showAddNew ? (
                <TouchableOpacity
                  style={[styles.dropdownItem, styles.addNewItem]}
                  onPress={() => {
                    console.log('add new click')
                    console.log('add new selected:', searchText); // Debug log
                    
                    // setSearchText((prev) => {
                    //   console.log ('prev', prev)
                    //   onSelect(prev)
                    //   Keyboard.dismiss();
                    //   slideup();
                    //   return prev;
                    // })    
                    const trimmed = searchText.trim();
                    setSearchText(trimmed);       // Ensure the displayed value is what user typed
                    onSelect(trimmed);            // Send to parent immediately
                    Keyboard.dismiss();
                    slideup();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addNewText}>
                    Add "{searchText}"
                  </Text>
                </TouchableOpacity>
              ) : null}
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
    height: 56,
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
  dropdownIcon: {
    transform: [{ rotate: '0deg' }],
    transitionDuration: '150ms',
  },
  dropdownIconOpen: {
    transform: [{ rotate: '180deg' }],
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
});

export default SearchableDropdown;