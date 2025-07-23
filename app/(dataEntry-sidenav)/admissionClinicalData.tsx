import { GlobalStyles as Styles } from '@/themes/styles';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, List, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function AdmissionClinicalDataScreen() {  
    const {colors, fonts} = useTheme()

    // TODO - fix useState and handlePress
    const [expanded, setExpanded] = useState(false);
    const handlePress = () => setExpanded(!expanded);

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
                                {/* TODO - remove placeholder */}
                                <List.Item title="First item" />
                                <List.Item title="Second item" />
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
                                <TextInput 
                                    label="MUAC (required)"
                                    mode="flat"
                                    keyboardType="numeric" 
                                    style={Styles.accordionTextInput} 
                                    right={<TextInput.Affix text="mm" />}                        />
                                <TextInput
                                    label="Temperature (required)" 
                                    mode="flat" 
                                    keyboardType="numeric"
                                    style={Styles.accordionTextInput}
                                    right={<TextInput.Affix text="°C" />}
                                />
                                
                                <Text style={Styles.accordionSubheading}>Respiratory Rate <Text style={Styles.required}>*</Text></Text>
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
                                    Record from RRate App
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