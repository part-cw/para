import { GlobalStyles as Styles } from '@/themes/styles'
import React, { useState } from 'react'
import { Text, View } from 'react-native'
import type { AutocompleteDropdownItem } from 'react-native-autocomplete-dropdown'
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown'

type Props = {
  label: string
  placeholder?: string
  dataSet: AutocompleteDropdownItem[]
  onSelectItem: (item: AutocompleteDropdownItem | null) => void
}

export default function AutocompleteField({ 
    label,
    placeholder, 
    dataSet, 
    onSelectItem,
    }: Props) {

    // const dropdownController = useRef<IAutocompleteDropdownRef | null>(null)
    // const searchRef = useRef(null)
    // console.log('searchRef', searchRef)

    // const [focused, setFocused] = useState(false)
    const [inputText, setInputText] = useState<string | null | undefined>();
    
    // console.log('inputText', inputText)

    return (
        <>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={Styles.autocompleteLabel}>{label}</Text>
            <View style={[Styles.autocompleteWrapper, {flex: 1}]}>
                <AutocompleteDropdown
                    // ref= {searchRef}
                    clearOnFocus={false}
                    closeOnBlur={true}
                    closeOnSubmit={false}
                    onSelectItem={(item) => {
                        onSelectItem(item)
                        setInputText(item?.title)
                        // console.log('item', item)
                    }}
                    dataSet={dataSet}
                    ignoreAccents
                    inputContainerStyle={Styles.autocompleteInputContainerStyle}
                    textInputProps={{
                        placeholder: placeholder,
                        // onChangeText(text) {
                            
                        // },
                    }}
                    emptyResultText="Nothing found"
                />
            </View>
         </View>
        </>
       
    )
}

 // TODO - fix the manual deletion bug

 // THIS IS MY FIRST ATTEMPT. ITWORKED BUT BROKE THE FILTER/AUTOCOMPLETE FUNCTIONALITY
    // const [inputText, setInputText] = useState<string>('');
    // const [selectedItem, setSelectedItem] = useState<AutocompleteDropdownItem | null>(null);
    // console.log ('inputText here', inputText)
 
    // const handleChangeText = (text: string) => {
    //     setInputText(text)

    //     const isEmptyText = (text.trim() === '')
    //     console.log('isEmptyText', isEmptyText)

    //     // Manually clear selection if user deletes content
    //     if (isEmptyText && selectedItem !== null) {
    //         setSelectedItem(null)
    //         onSelectItem(null)
    //     }
    // }
 
    // const handleBlur = () => {
    //     const isEmptyInputText = (inputText.trim() === '')
    //     // If text doesn't match selected item, treat as cleared
    //     if (isEmptyInputText || inputText !== selectedItem?.title) {
    //         setSelectedItem(null)
    //         onSelectItem(null)
    //     }
    // }

    // HERE"S ANOTHER ATTEMPT _ ALSO DIDNT WORK
    // const handleChangeText = useCallback((searchText: string) => {
    //     setInputText(searchText);
    //     const isEmptyText = !searchText.trim();
    //     console.log('isEmptyText', isEmptyText)
    //     if (isEmptyText) {
    //         // clear selection if text input field is empty. Handles manual deletions
    //         console.log('@@@@')
    //         onSelectItem(null)
    //         return
    //     }

    //     // Find matching item or create new one
    //     const matchingItem = dataSet.find(
    //         item => item.id.toString().toLowerCase() === searchText.toLowerCase()
    //     )

    //     if (matchingItem) {
    //         onSelectItem(matchingItem)
    //     } else if (searchText.trim()) {
    //         // Create new item if exact match isn't found
    //         const newItem: AutocompleteDropdownItem = {
    //             id: Date.now().toString(),
    //             title: searchText,
    //         }
    //         onSelectItem(newItem)
    //     }
    // },[dataSet, onSelectItem])
