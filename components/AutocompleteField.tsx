import { GlobalStyles as Styles } from '@/themes/styles'
import React, { useState } from 'react'
import { View } from 'react-native'
import type { AutocompleteDropdownItem } from 'react-native-autocomplete-dropdown'
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown'

type Props = {
  label: string
  placeholder?: string
  dataSet: AutocompleteDropdownItem[]
  onSelectItem: (item: AutocompleteDropdownItem | null) => void
  value?: AutocompleteDropdownItem | null
}

export default function AutocompleteField({ 
    // label,
    placeholder, 
    dataSet, 
    onSelectItem,
    // value
    }: Props) {

    const [isFocused, setIsFocused] = useState(false);
    // const showFloatingLabel = isFocused || !!value?.title
    
    // const [value, setValue] = useState('');
    // console.log('value', value?.title)

    
    return (
        <View style={Styles.autocompleteWrapper}>
            {/* {showFloatingLabel && <Text style={Styles.autocompleteLabel}>{label}</Text>} */}
            <AutocompleteDropdown
                clearOnFocus={false}
                closeOnBlur={true}
                closeOnSubmit={false}
                onSelectItem={onSelectItem}
                dataSet={dataSet}
                ignoreAccents
                // onFocus={() => setIsFocused(true)}
                // onBlur={() => setIsFocused(false)}
                inputContainerStyle={[
                    Styles.autocompleteInputContainerStyle,
                    // isFocused && Styles.autocompleteFocusedInput
                    ]}
                textInputProps={{
                    placeholder: placeholder
                    // placeholder: showFloatingLabel ? placeholder : label,
                    // style: Styles.autocompleteTextInput 
                }}
            />
        </View>
       
    )
}