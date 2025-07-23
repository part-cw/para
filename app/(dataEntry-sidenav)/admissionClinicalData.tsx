import RadioButtonGroup from '@/components/RadioButtonGroup';
import { GlobalStyles as Styles } from '@/themes/styles';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, IconButton, List, TextInput, useTheme } from 'react-native-paper';
import { Dropdown } from "react-native-paper-dropdown";
import { SafeAreaView } from 'react-native-safe-area-context';


export default function AdmissionClinicalDataScreen() {  
    const {colors, fonts} = useTheme()

    // TODO - fix useState and handlePress
    const [hivStatus, setHivStatus] = useState<string>('');
    const [expanded, setExpanded] = useState(false);
    const handlePress = () => setExpanded(!expanded);

    const [lastHospitalized, setLastHospitalized] = useState<string>();
    const hospitalizationOptions = [
    { label: 'Never', value: 'a' },
    { label: 'Less than 7 days ago', value: 'b' },
    { label: '7 days to 1 month ago', value: 'c' },
    { label: '1 month to 1 year ago', value: 'd' },
    { label: 'More than 1 year ago', value: 'e' }];

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <List.Section>
                    {/* Health History Accordion */}
                    <View style={Styles.accordionListWrapper}>
                        <List.Accordion
                            title="Health History"
                            titleStyle={Styles.accordionListTitle}
                            left={props => <List.Icon {...props} icon="history" />}>
                            <View style={Styles.accordionContentWrapper}>
                                <Dropdown
                                    label={"Last Hopitalized"}
                                    mode={"outlined"}
                                    options={hospitalizationOptions}
                                    value={lastHospitalized}
                                    onSelect={setLastHospitalized}
                                    menuContentStyle={{backgroundColor: colors.secondary}}
                                />
                                <Text style={Styles.accordionSubheading}>HIV Status <Text style={Styles.required}>*</Text></Text>
                                <RadioButtonGroup 
                                    options={[
                                        { label: 'Positive', value: 'positive'},
                                        { label: 'Negative', value: 'negative'},
                                        { label: 'Unknown', value: 'unknown'}]} 
                                    selected={hivStatus} 
                                    onSelect={setHivStatus}/>
                            </View>
                        </List.Accordion>
                    </View>

                    {/* Vital Signs Accordion */}
                    <View style={Styles.accordionListWrapper}>
                        <List.Accordion
                        title="Vital Signs"
                        titleStyle={Styles.accordionListTitle}
                        left={props => <List.Icon {...props} icon="heart-pulse" />}>
                            <View style={Styles.accordionContentWrapper}>
                                <TextInput 
                                    label="Weight (required)"
                                    mode="flat"
                                    keyboardType="numeric"
                                    style={Styles.accordionTextInput} 
                                    right={<TextInput.Affix text="kg" />}
                                />
                                <View style={{flexDirection:'row', alignItems: 'center'}}>
                                     <TextInput 
                                        label="MUAC (required)"
                                        mode="flat"
                                        keyboardType="numeric" 
                                        style={[Styles.accordionTextInput, { flex: 1 }]} 
                                        right={<TextInput.Affix text="mm" />}/>
                                    <IconButton
                                        icon="help-circle-outline"
                                        size={20}
                                        iconColor={colors.primary}
                                        onPress={() => {
                                        // TODO - use tooltip instead of alert message
                                        // tooltip package: https://www.npmjs.com/package/react-native-walkthrough-tooltip
                                        alert('MUAC = Mid-upper arm circumference.\nUsed to assess malnutrition.\n\nDespite local health guidlines, this is a required field for accurate model calculations');
                                        }}
                                    />
                                </View>
                                <TextInput
                                    label="Temperature (required)" 
                                    mode="flat" 
                                    keyboardType="numeric"
                                    style={Styles.accordionTextInput}
                                    right={<TextInput.Affix text="°C" />}
                                />

                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={Styles.accordionSubheading}>Respiratory Rate</Text>
                                    <IconButton
                                        icon="help-circle-outline"
                                        size={20}
                                        iconColor={colors.primary}
                                        onPress={() => {
                                        // TODO - use tooltip instead of alert message
                                        // tooltip package: https://www.npmjs.com/package/react-native-walkthrough-tooltip
                                        alert('Manually count breaths per minute, or measure from the RRate app by clicking "Record from RRate" button');
                                        }}
                                    />
                                </View>
                               
                                <TextInput
                                    label="Breaths per minute (required)"
                                    mode="flat" 
                                    keyboardType="numeric"
                                    style={Styles.accordionTextInput}
                                    right={<TextInput.Affix text="bpm" />}
                                />
                                <Button style={{ alignSelf: 'center'}}
                                        buttonColor={colors.primary} 
                                        textColor={colors.onPrimary} 
                                        mode="elevated" 
                                        onPress={() => {}}>
                                    Record from RRate
                                </Button>

                                <Text style={Styles.accordionSubheading}>Oxygen Saturation <Text style={Styles.required}>*</Text></Text>
                                <TextInput
                                    label="SpO2 (required)"
                                    mode="flat" 
                                    keyboardType="numeric"
                                    style={Styles.accordionTextInput}
                                    right={<TextInput.Affix text="%" />}
                                />
                                <TextInput
                                    label="Heart rate (required)"
                                    placeholder='Beats per minute' 
                                    mode="flat" 
                                    keyboardType="numeric"
                                    style={Styles.accordionTextInput}
                                    right={<TextInput.Affix text="bpm" />}
                                />
                            </View>
                        </List.Accordion>
                    </View>
                    
                    {/* Blantyre Coma Scale Accordion */}
                    <View style={Styles.accordionListWrapper}>
                        <List.Accordion
                            title="Blantyre Coma Scale"
                            titleStyle={Styles.accordionListTitle}
                            left={props => <List.Icon {...props} icon="head-cog-outline" />}
                            expanded={expanded}
                            onPress={handlePress}>
                            <View style={Styles.accordionContentWrapper}>
                                <List.Item title="Second item" />
                            </View>
                        </List.Accordion>
                    </View>
                </List.Section>
            </ScrollView>
        </SafeAreaView>
    );
}