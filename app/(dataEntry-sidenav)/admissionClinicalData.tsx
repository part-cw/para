import PaginationControls from '@/src/components/PaginationControls';
import RadioButtonGroup from '@/src/components/RadioButtonGroup';
import SearchableDropdown from '@/src/components/SearchableDropdown';
import ValidatedTextInput, { INPUT_TYPES } from '@/src/components/ValidatedTextInput';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { displayNames } from '@/src/forms/displayNames';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, IconButton, List, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function AdmissionClinicalDataScreen() {  
    const { colors } = useTheme()
    const { patientData, updatePatientData, isDataLoaded } = usePatientData();

    const {
        // common fields
        weight,
        muac,
        spo2,

        //0-6months
        illnessDuration,
        jaundice,
        bulgingFontanelle,
        feedingStatus,

        //6-60 months
        hivStatus,
        temperature,
        rrate,
        lastHospitalized,
        eyeMovement,
        motorResponse,
        verbalResponse,

        // Age indicator
        isUnderSixMonths
    } = patientData

    const durationOptions = [
        { value: 'Less than 48 hours', key: '<48h' },
        { value: '48 hours to 7 days', key: '48h-7d' },
        { value: '7 days to 1 month', key: '7d-1mo' },
        { value: 'More than 1 month', key: '>1mo' }
    ];
    
    const simplifiedOptions = [
        { value: 'Yes', key: 'yes'},
        { value: 'No', key: 'no'},
        { value: "Unsure", key: "unsure"}
                                        
    ];

    const hospitalizationOptions = [
    { value: 'Never', key: 'never' },
    { value: 'Less than 7 days ago', key: '<7d' },
    { value: '7 days to 1 month ago', key: '7d-1m' },
    { value: '1 month to 1 year ago', key: '1m-1y' },
    { value: 'More than 1 year ago', key: '>1y' }];

    const eyeMovementOptions = [
        {value: 'Watches or follows', key: 'watches'},
        {value: 'Fails to watch or follow', key: 'fails'}
    ]

    const motorResponseOptions = [
        {value: 'Normal behavior observed', key: 'normal'},
        {value: 'Localizes painful stimulus', key: 'localize'},
        {value: 'Withdraws from painful stimulus', key: 'withdraw'},
        {value: 'No resonse/inappropriate response', key: 'no-response'}
    ]

    const verbalResponseOptions = [
        {value: 'Normal behavior observed', key: 'normal'},
        {value: 'Cries appropriately', key: 'cries'},
        {value: 'Moan or abnormal cry', key: 'moan'},
        {value: 'No vocal response', key: 'no-response'}
    ]

    const bcsGeneralInfo = "Fully conscious children score 5 (have appropriate eye movement, motor response, and verbal response). Children who are unresponsive to painful stimuli score 0."
    const eyeMovementInfo =  "Have the caregiver put a toy or bright object in front of the child, and see if they are able to follow it with their eyes";
    const motorResponseInfo = "Response to pain should be assessed with firm nailbed pressure or pinch";

    // Don't render until data is loaded
    if (!isDataLoaded) {
        return (
            <SafeAreaView style={{flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                <Text>Loading...</Text>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {
                    isUnderSixMonths
                    ?
                    <List.Section>
                        {/* Health History & Observations Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Health History & Observations"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="history" />}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <SearchableDropdown 
                                        data={durationOptions} 
                                        label={`${displayNames['illnessDuration']} (required)`}
                                        placeholder='select option below'
                                        onSelect={(item) => updatePatientData({ illnessDuration: item.value })}
                                        value={illnessDuration}
                                        search={false}
                                    />

                                    <SearchableDropdown 
                                        data={[
                                            { value: 'Yes', key: 'yes'},
                                            { value: 'No', key: 'no'},
                                            { value: "Unsure", key: "unsure"}
                                        ]} 
                                        label={'Jaundice (required)'}
                                        placeholder='select option below' 
                                        onSelect={(item) => updatePatientData({ jaundice: item.value })}
                                        value={jaundice}
                                        search={false}
                                    />

                                    <SearchableDropdown 
                                        data={simplifiedOptions} 
                                        label={'Bulging Fontanelle (required)'}
                                        placeholder='select option below' 
                                        onSelect={(item) => updatePatientData({ bulgingFontanelle: item.value })}
                                        value={bulgingFontanelle}
                                        search={false}
                                    />

                                    <Text style={[Styles.accordionSubheading, {fontWeight: 'bold'}]}>Feeding Status <Text style={Styles.required}>*</Text></Text>
                                    <Text>{displayNames['feedingStatusQuestion']}</Text>
                                    <RadioButtonGroup 
                                        options={[
                                            { label: 'Yes', value: 'yes'},
                                            { label: 'No', value: 'no'},]} 
                                        selected={feedingStatus} 
                                        onSelect={(value) => updatePatientData({ feedingStatus: value })}/>
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Vitals & Body Measurements */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Body Measurements & Vitals"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="heart-pulse" />}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    {/* TODO - add custom validator and custom messge for each of the inputs */}
                                    <ValidatedTextInput 
                                        label={'Weight (required)'}
                                        value={weight} 
                                        onChangeText={(value) => updatePatientData({ weight: value })}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true} 
                                        right={<TextInput.Affix text="kg" />}                             
                                    />
                                    <View style={{flexDirection:'row', alignItems: 'center'}}>
                                        <ValidatedTextInput 
                                            label={'MUAC (required)'}
                                            value={muac} 
                                            onChangeText={(value) => updatePatientData({ muac: value })}
                                            inputType={INPUT_TYPES.NUMERIC}
                                            isRequired={true} 
                                            style={[Styles.accordionTextInput, { flex: 1 }]}
                                            right={<TextInput.Affix text="mm" />}                             
                                        />
                                        <IconButton
                                            icon="help-circle-outline"
                                            size={20}
                                            iconColor={colors.primary}
                                            onPress={() => {
                                            alert('MUAC = Mid-upper arm circumference.\nUsed to assess malnutrition.\n\nDespite local health guidlines, this is a required field for all age groups to ensure accurate AI model predictions');
                                            }}
                                        />
                                    </View>
                                    <Text style={Styles.accordionSubheading}>Oxygen Saturation <Text style={Styles.required}>*</Text></Text>
                                    <ValidatedTextInput 
                                        label={'SpO₂ (required)'}
                                        value={spo2} 
                                        onChangeText={(value) => updatePatientData({ spo2: value })}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true} 
                                        right={<TextInput.Affix text="%" />}                             
                                    />
                                </View>
                            </List.Accordion>
                        </View>
                        

                    </List.Section>

                    :
                    // For patients over 6 months
                    <List.Section>
                        {/* Health History Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Health History"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="history" />}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <SearchableDropdown 
                                        data={hospitalizationOptions} 
                                        label={'Last Hopitalized (required)'}
                                        placeholder='select option below' 
                                        onSelect={(item) => updatePatientData({ lastHospitalized: item.value })}
                                        value={lastHospitalized}
                                        search={false}
                                    />
                                    <Text style={Styles.accordionSubheading}>HIV Status <Text style={Styles.required}>*</Text></Text>
                                    <RadioButtonGroup 
                                        options={[
                                            { label: 'Positive', value: 'positive'},
                                            { label: 'Negative', value: 'negative'},
                                            { label: 'Unknown', value: 'unknown'}]} 
                                        selected={hivStatus} 
                                        onSelect={(value) => updatePatientData({ hivStatus: value })}/>
                                </View>
                            </List.Accordion>
                        </View>

                        {/* Vital Signs Accordion */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Body Measurements & Vitals"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="heart-pulse" />}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    {/* TODO - add custom validator and custom messge for each of the inputs */}
                                    <ValidatedTextInput 
                                        label={'Weight (required)'}
                                        value={weight} 
                                        onChangeText={(value) => updatePatientData({ weight: value })}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true} 
                                        right={<TextInput.Affix text="kg" />}                             
                                    />
                                    <View style={{flexDirection:'row', alignItems: 'center'}}>
                                        <ValidatedTextInput 
                                            label={'MUAC (required)'}
                                            value={muac} 
                                            onChangeText={(value) => updatePatientData({ muac: value })}
                                            inputType={INPUT_TYPES.NUMERIC}
                                            isRequired={true} 
                                            style={[Styles.accordionTextInput, { flex: 1 }]}
                                            right={<TextInput.Affix text="mm" />}                             
                                        />
                                        <IconButton
                                            icon="help-circle-outline"
                                            size={20}
                                            iconColor={colors.primary}
                                            onPress={() => {
                                            alert('MUAC = Mid-upper arm circumference.\nUsed to assess malnutrition.\n\nDespite local health guidlines, this is a required field for all age groups to ensure accurate AI model predictions');
                                            }}
                                        />
                                    </View>
                                    <ValidatedTextInput 
                                        label={'Temperature (required)'}
                                        value={temperature} 
                                        onChangeText={(value) => updatePatientData({ temperature: value })}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true} 
                                        right={<TextInput.Affix text="°C" />}                             
                                    />

                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Text style={Styles.accordionSubheading}>Respiratory Rate <Text style={Styles.required}>*</Text></Text>
                                        <IconButton
                                            icon="help-circle-outline"
                                            size={20}
                                            iconColor={colors.primary}
                                            onPress={() => {
                                            alert('Manually count breaths per minute, or measure from the RRate app by clicking "Record from RRate" button');
                                            }}
                                        />
                                    </View>
                                
                                    <ValidatedTextInput 
                                        label={'Breaths per minute (required)'}
                                        value={rrate} 
                                        onChangeText={(value) => updatePatientData({ rrate: value })}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true} 
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
                                    <ValidatedTextInput 
                                        label={'SpO₂ (required)'}
                                        value={spo2} 
                                        onChangeText={(value) => updatePatientData({ spo2: value })}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true} 
                                        right={<TextInput.Affix text="%" />}                             
                                    />
                                </View>
                            </List.Accordion>
                        </View>
                        
                        {/* Blantyre Coma Scale Accordion for patients 6-60 months*/}
                        {/* TODO - add BCS score card & required flag */}
                        <View style={Styles.accordionListWrapper}>
                            <List.Accordion
                                title="Blantyre Coma Scale"
                                titleStyle={Styles.accordionListTitle}
                                left={props => <List.Icon {...props} icon="head-cog-outline" />}
                            >
                                <View style={Styles.accordionContentWrapper}>
                                    <Text style={{fontStyle: 'normal'}}>{bcsGeneralInfo}</Text>
                                    <Text style={[Styles.required, {fontStyle: 'italic', marginBottom: 8}]}>**All fields required**</Text>
                                    
                                    {/* Eye movement dropdown */}
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <View style={{flex: 1}}>
                                            <SearchableDropdown 
                                                data={eyeMovementOptions} 
                                                label={'Eye movement'}
                                                placeholder='select option below' 
                                                onSelect={(item) => updatePatientData({ eyeMovement: item.value })}
                                                value={eyeMovement}
                                                search={false}
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
                                                <SearchableDropdown 
                                                    data={motorResponseOptions} 
                                                    label={'Best motor response'}
                                                    placeholder='select option below' 
                                                    onSelect={(item) => updatePatientData({ motorResponse: item.value})}
                                                    value={motorResponse}
                                                    search={false}
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
                                            <SearchableDropdown 
                                                data={verbalResponseOptions} 
                                                label={'Verbal response'}
                                                placeholder='select option below' 
                                                onSelect={(item) => updatePatientData({ verbalResponse: item.value })}
                                                value={verbalResponse}
                                                search={false}
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
                }
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