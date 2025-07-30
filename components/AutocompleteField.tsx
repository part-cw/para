import { GlobalStyles as Styles } from '@/themes/styles'
import React from 'react'
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

    // const [inputText, setInputText] = useState('');
    // const [selectedItem, setSelectedItem] = useState<AutocompleteDropdownItem | null>(null);

    // console.log ('inputText here', inputText)
    // // Clear selection if input is cleared manually
    // const handleChangeText = (text: string) => {
    //     console.log('text in handlechangeText', text)
    //     if (text === '') {
    //         console.log('@@@@')
    //         // mimic onClearPress from AutocompleteDropdown
    //         setInputText('')
    //         setSelectedItem(null)
    //         if (typeof onSelectItem === 'function') {
    //             onSelectItem(null)
    //         }
    //     }
    // }

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
                    // initialValue={null}
                    onSelectItem={(item) => {
                        // setSelectedItem(item)
                        // setInputText(item?.title ?? '')
                        onSelectItem(item);
                        console.log('item', item)
                    }}
                    dataSet={dataSet}
                    ignoreAccents
                    inputContainerStyle={Styles.autocompleteInputContainerStyle}
                    textInputProps={{
                        placeholder: placeholder,
                        // value: inputText,
                        // onChangeText: handleChangeText
                    }}
                    // showClear={!!inputText}
                    emptyResultText="Nothing found"
                />
            </View>
         </View>
        </>
       
    )
}