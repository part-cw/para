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
  value?: AutocompleteDropdownItem | null
}

export default function AutocompleteField({ 
    label,
    placeholder, 
    dataSet, 
    onSelectItem,
    value
    }: Props) {

    const [inputText, setInputText] = useState('')

     // Clear selection if input is cleared manually
    const handleChangeText = (text: string) => {
        setInputText(text)
        if (text.trim() === '') {
        onSelectItem(null)
        }
    }
    
    // const [value, setValue] = useState('');
    // console.log('value', value?.title)

    
    return (
        <>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={Styles.autocompleteLabel}>{label}</Text>
            <View style={[Styles.autocompleteWrapper, {flex: 1}]}>
                <AutocompleteDropdown
                    clearOnFocus={false}
                    closeOnBlur={true}
                    closeOnSubmit={false}
                    onSelectItem={(item) => {
                        onSelectItem(item)
                    }}
                    dataSet={dataSet}
                    ignoreAccents
                    inputContainerStyle={Styles.autocompleteInputContainerStyle}
                    textInputProps={{placeholder: placeholder}}
                />
            </View>
         </View>
        </>
       
    )
}