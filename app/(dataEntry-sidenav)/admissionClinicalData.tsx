import DebugStack from '@/components/DebugStack';
import PaginationControls from '@/components/PaginationControls';
import RadioButtonGroup from '@/components/RadioButtonGroup';
import { GlobalStyles as Styles } from '@/themes/styles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, IconButton, List, TextInput, useTheme } from 'react-native-paper';
import { Dropdown } from "react-native-paper-dropdown";
import { SafeAreaView } from 'react-native-safe-area-context';


export default function AdmissionClinicalDataScreen() {  
    const { colors } = useTheme()

    // TODO - fix setuseState and handlePress
    const [expanded, setExpanded] = useState(false);
    const handlePress = () => setExpanded(!expanded);

    const [hivStatus, setHivStatus] = useState<string>('');

    const [lastHospitalized, setLastHospitalized] = useState<string>();
    const hospitalizationOptions = [
    { label: 'Never', value: 'never' },
    { label: 'Less than 7 days ago', value: '<7d' },
    { label: '7 days to 1 month ago', value: '7d-1m' },
    { label: '1 month to 1 year ago', value: '1m-1y' },
    { label: 'More than 1 year ago', value: '>1y' }];

    const [eyeMovement, setEyeMovement] = useState<string>();
    const eyeMovementOptions = [
        {label: 'Watches or follows', value: 'watches'},
        {label: 'Fails to watch or follow', value: 'fails'}
    ]

    const [motorResponse, setMotorResponse] = useState<string>();
    const motorResponseOptions = [
        {label: 'Normal behavior observed', value: 'normal'},
        {label: 'Localizes painful stimulus', value: 'localize'},
        {label: 'Withdraws from painful stimulus', value: 'withdraw'},
        {label: 'No resonse/inappropriate response', value: 'no-response'}
    ]

    const [verbalResponse, setVerbalResponse] = useState<string>();
    const verbalResponseOptions = [
        {label: 'Normal behavior observed', value: 'normal'},
        {label: 'Cries appropriately', value: 'cries'},
        {label: 'Moan or abnormal cry', value: 'moan'},
        {label: 'No vocal response', value: 'no-response'}
    ]

    const bcsGeneralInfo = "Fully conscious children score 5 (have appropriate eye movement, motor response, and verbal response). Children who are unresponsive to painful stimuli score 0."
    const eyeMovementInfo =  "Have the caregiver put a toy or bright object in front of the child, and see if they are able to follow it with their eyes";
    const motorResponseInfo = "Response to pain should be assessed with firm nailbed pressure or pinch";

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <DebugStack/>
                <List.Section>
                    {/* Health History Accordion */}
                    <View style={Styles.accordionListWrapper}>
                        <List.Accordion
                            title="Health History"
                            titleStyle={Styles.accordionListTitle}
                            left={props => <List.Icon {...props} icon="history" />}>
                            <View style={Styles.accordionContentWrapper}>
                                <Dropdown
                                    label={"Last Hopitalized (required)"}
                                    mode={"outlined"}
                                    options={hospitalizationOptions}
                                    value={lastHospitalized}
                                    onSelect={setLastHospitalized}
                                    menuContentStyle={{backgroundColor: colors.secondary}}
                                    hideMenuHeader = {Platform.OS === 'web'}
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
                        title="Body Measurements & Vitals"
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
                                        alert('MUAC = Mid-upper arm circumference.\nUsed to assess malnutrition.\n\nDespite local health guidlines, this is a required field for all age groups to ensure accurate AI model predictions');
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
                                    <Text style={Styles.accordionSubheading}>Respiratory Rate <Text style={Styles.required}>*</Text></Text>
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
                    {/* TODO - add BCS score card & required flag */}
                    <View style={Styles.accordionListWrapper}>
                        <List.Accordion
                            title="Blantyre Coma Scale"
                            titleStyle={Styles.accordionListTitle}
                            left={props => <List.Icon {...props} icon="head-cog-outline" />}
                            expanded={expanded}
                            onPress={handlePress}>
                            <View style={Styles.accordionContentWrapper}>
                                <Text style={{fontStyle: 'normal'}}>{bcsGeneralInfo}</Text>
                                <Text style={[Styles.required, {fontStyle: 'italic'}]}>**All fields required**</Text>
                                
                                {/* Eye movement dropdown */}
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <View style={{flex: 1}}>
                                         <Dropdown
                                            label={"Eye movement"}
                                            mode={"outlined"}
                                            options={eyeMovementOptions}
                                            value={eyeMovement}
                                            onSelect={setEyeMovement}
                                            menuContentStyle={{backgroundColor: colors.secondary}}
                                            hideMenuHeader = {Platform.OS === 'web'}
                                        />
                                    </View>
                                    <IconButton
                                        icon="information-outline"
                                        size={20}
                                        iconColor={colors.primary}
                                        onPress={() => {alert(eyeMovementInfo)}} // TODO - change to tooltip
                                    />
                                </View>

                                {/* Motor response dropdown */}
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <View style={{flex: 1}}>
                                            <Dropdown
                                                label={"Best motor response"}
                                                mode={"outlined"}
                                                options={motorResponseOptions}
                                                value={motorResponse}
                                                onSelect={setMotorResponse}
                                                menuContentStyle={{
                                                    backgroundColor: colors.secondary,
                                                    minWidth: 320}}
                                                hideMenuHeader = {Platform.OS === 'web'}
                                            />
                                        </View>
                                        <IconButton
                                            icon="information-outline"
                                            size={20}
                                            iconColor={colors.primary}
                                            onPress={() => {alert(motorResponseInfo)}} // TODO - change to tooltip
                                        />
                                </View>
                                
                                {/* Verbal response dropdown */}
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <View style={{flex: 1}}>
                                        <Dropdown
                                            label={"Best verbal response"}
                                            mode={"outlined"}
                                            options={verbalResponseOptions}
                                            value={verbalResponse}
                                            onSelect={setVerbalResponse}
                                            menuContentStyle={{backgroundColor: colors.secondary}}
                                            hideMenuHeader = {Platform.OS === 'web'}
                                        />
                                    </View>
                                    {/* White icon to align dropdown with others */}
                                    <IconButton
                                        icon="information-outline"
                                        size={20}
                                        iconColor='#FFFF'
                                    />
                                </View>
                            </View>
                        </List.Accordion>
                    </View>
                </List.Section>
            </ScrollView>
            <PaginationControls
                showPrevious={true}
                showNext={true}
                onPrevious={() => router.back()}
                onNext={() => router.push('/(dataEntry-sidenav)/medicalConditions')}
            />
        </SafeAreaView>
    );
}