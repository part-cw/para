import NutritionStatusBar from '@/src/components/NutritionStatusBar';
import PaginationControls from '@/src/components/PaginationControls';
import RadioButtonGroup from '@/src/components/RadioButtonGroup';
import SearchableDropdown from '@/src/components/SearchableDropdown';
import ValidatedTextInput, { INPUT_TYPES } from '@/src/components/ValidatedTextInput';
import ValidationSummary from '@/src/components/ValidationSummary';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { useValidation } from '@/src/contexts/ValidationContext';
import { displayNames } from '@/src/forms/displayNames';
import { bcsGeneralInfo, eyeMovementInfo, jaundiceInfo, motorResponseInfo, muacInfo, rrateButtonInfo } from '@/src/forms/infoText';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { calculateBcsScore, calculateWAZ, getMuacStatus, getWazNutritionalStatus, indexToNutritionStatus, isAbnormalBcs, mapBcsScoreToVariant, nutritionStatusToIndex, validateMuac, validateOxygenSaturationRange, validateRespiratoryRange, validateTemperatureRange, validateWeight } from '@/src/utils/clinicalVariableCalculator';
import { isValidNumericFormat } from '@/src/utils/inputValidator';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, IconButton, List, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// TODO Add rrate link on button press

export default function AdmissionClinicalDataScreen() {  
    const { colors } = useTheme()
    const { patientData, updatePatientData, isDataLoaded } = usePatientData();
    const { setValidationErrors, setValidationWarnings, getScreenErrors, getScreenWarnings } = useValidation();

    const validationErrors = getScreenErrors('admissionClinicalData')
    const hasValidationErrors = validationErrors.length > 0;

    const validationWarnings = getScreenWarnings('admissionClinicalData');
    const hasValidationWarnings = validationWarnings.length > 0;

    const [showErrorSummary, setShowErrorSummary] = useState<boolean>(false)
    const [showMuacStatusBar, setShowMuacStatusBar] = useState<boolean>(false)

    // For BCS calcualtions
    const [eyeScore, setEyeScore] = useState<number | null>(null)
    const [motorScore, setMotorScore] = useState<number | null>(null)
    const [verbalScore, setVerbalScore] = useState<number | null>(null)

    const {
        // common fields
        weight,
        waz,
        muac,
        spo2,

        //0-6months
        illnessDuration,
        neonatalJaundice: jaundice,
        bulgingFontanelle,
        feedingWell: feedingStatus,

        //6-60 months
        hivStatus,
        temperature,
        rrate,
        lastHospitalized,
        eyeMovement,
        motorResponse,
        verbalResponse,
        bcsScore,
        abnormalBCS,

        // other necessary info
        isUnderSixMonths,
        sex,
        ageInMonths,
        isNeonate,
        malnutritionStatus
    } = patientData

    const validateAllFields = () => {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Common validations for both age groups
        if (!weight || !isValidNumericFormat(weight)) {
            errors.push('Weight is required and must be a valid number');
        } else {
            const weightValidation = validateWeight(weight)
            if (!weightValidation.isValid) {
                weightValidation.errorMessage && errors.push(weightValidation.errorMessage);
                weightValidation.warningMessage && warnings.push(weightValidation.warningMessage)
            }
        }
        
        if (!muac || !isValidNumericFormat(muac)){
            errors.push('MUAC is required and must be a valid number');
        } else {
            const muacValidation = validateMuac(muac);
            if (!muacValidation.isValid) {
                muacValidation.errorMessage && errors.push(muacValidation.errorMessage);
                muacValidation.warningMessage && warnings.push(muacValidation.warningMessage)
            }
        }
        
        if (!spo2 || !isValidNumericFormat(spo2)) {
            errors.push('SpO₂ is required and must be a valid number');
        } else {
            const spo2Validation= validateOxygenSaturationRange(spo2);
            if (!spo2Validation.isValid) {
                spo2Validation.errorMessage && errors.push(spo2Validation.errorMessage);
            }
        }
        
        if (isUnderSixMonths) {
            // Validations for 0-6 months
            if (!illnessDuration) {
                errors.push('Illness duration is required');
            }
            if (isNeonate && !jaundice) {
                errors.push('Jaundice status is required');
            }
            if (!bulgingFontanelle) {
                errors.push('Bulging fontanelle status is required');
            }
            if (!feedingStatus) {
                errors.push('Feeding status is required');
            }
        } else {
            // Validations for 6-60 months
            if (!hivStatus) {
                errors.push('HIV status is required');
            }

            if (!lastHospitalized) {
                errors.push('Last hospitalized is required');
            }

            if (!temperature || !isValidNumericFormat(temperature)) {
                errors.push('Temperature is required and must be a valid number');
            } else {
                const tempValidation = validateTemperatureRange(temperature);
                if (!tempValidation.isValid) {
                    tempValidation.errorMessage && errors.push(tempValidation.errorMessage);
                    tempValidation.warningMessage && warnings.push(tempValidation.warningMessage)
                }
            }


            if (!rrate || !isValidNumericFormat(rrate)) {
                errors.push('Respiratory rate is required and must be a valid number');
            } else {
                const rrateValidation = validateRespiratoryRange(rrate)
                if (!rrateValidation.isValid) {
                    rrateValidation.errorMessage && errors.push(rrateValidation.errorMessage)
                    rrateValidation.warningMessage && warnings.push(rrateValidation.warningMessage)
                }
            }
            
            // Blantyre Coma Scale validations
            if (!eyeMovement) {
                errors.push('Eye movement assessment is required');
            }
            if (!motorResponse) {
                errors.push('Motor response assessment is required');
            }
            if (!verbalResponse) {
                errors.push('Verbal response assessment is required');
            }
        }
        
        console.log('warnings', warnings)
        return {errors: errors, warnings: warnings}
    };

    useEffect(() => {
        const messages = validateAllFields();
        setValidationErrors('admissionClinicalData', messages.errors);
        setValidationWarnings('admissionClinicalData', messages.warnings);
    }, [
        weight, muac, spo2, 
        illnessDuration, jaundice, bulgingFontanelle, feedingStatus,
        hivStatus, lastHospitalized, temperature, rrate,
        eyeMovement, motorResponse, verbalResponse,
        isUnderSixMonths
    ]);

     // Clear errors when component unmounts or navigates away
    useEffect(() => {
        return () => {
            // Only clear if no errors exist
            if (validateAllFields().errors.length === 0) {
                setValidationErrors('admissionClinicalData', []);
            }
            if (validateAllFields().warnings.length === 0) {
                setValidationWarnings('admissionClinicalData', []);
            }
        };
    }, []);

    // handle WAZ calculation on weight change
    useEffect(() => {
        if (validateWeight(weight).isValid) {
            updatePatientData({waz: calculateWAZ(ageInMonths as number, sex, parseFloat(weight))})
        } else {
            updatePatientData({waz: null})
        }

    }, [weight])

    // handles changes in waz and muac - updates malnutrtion status accordingly
    useEffect(() => {
        setMalnutritionStatus()
    }, [waz, muac])

    // handle changes in BCS selections and updates scores accordingly
    useEffect(() => {
        // if options selected, set scores
        eyeMovement?.value ? setEyeScore(Number(eyeMovement.key)) : setEyeScore(null)
        motorResponse?.value ? setMotorScore(Number(motorResponse.key)) : setMotorScore(null)
        verbalResponse?.value ? setVerbalScore(Number(verbalResponse.key)) : setVerbalScore(null)

        if (eyeScore !== null && motorScore !== null && verbalScore !==null) {
            const score = calculateBcsScore(eyeScore, motorScore, verbalScore)
            updatePatientData({
                bcsScore: score,
                abnormalBCS: isAbnormalBcs(score)
            })
        } else {
            updatePatientData({
                bcsScore: null,
                abnormalBCS: null
            })
        }

    }, [eyeMovement, motorResponse, verbalResponse, eyeScore, verbalScore, motorScore])

    // handle changes to isNeonate; resets jaundice selection if changes made to age
    useEffect(() => {
        if (!isNeonate) updatePatientData({neonatalJaundice: ''})
    }, [isNeonate])
    
    const setMalnutritionStatus = () => {
        if ((waz || waz !== null) && muac) {
            const wazStatus = getWazNutritionalStatus(waz)
            const muacStatus = getMuacStatus(isUnderSixMonths, muac)

            const wazNutritionIndex = nutritionStatusToIndex(wazStatus)
            const muacNutritionIndex = nutritionStatusToIndex(muacStatus)

            const malnutritionIndex = 
                (wazNutritionIndex > muacNutritionIndex) 
                ? wazNutritionIndex
                : muacNutritionIndex
                
            updatePatientData({
                malnutritionStatus: indexToNutritionStatus(malnutritionIndex)
            })
        } else {
           updatePatientData({
                malnutritionStatus: undefined
            }) 
        }
    }

    const handleMuacBlur = () => {
        const warning = validateMuac(muac).warningMessage;

        if (!warning) {
            setShowMuacStatusBar(true);
            return;
        }

        if (Platform.OS === 'web') {
            // Web: use confirm to mimic Cancel / OK
            const confirmResult = window.confirm(
                `Data Outside Physiological Range\n\n${warning}\n\nPress OK to continue, Cancel to clear value.`
            );

            if (confirmResult) {
                // ok
                setShowMuacStatusBar(true);
            } else {
                // Cancel
                updatePatientData({ muac: '' });
                setShowMuacStatusBar(false);
            }
        } else {
            // Mobile (iOS/Android)
            Alert.alert(
                'Data Outside Physiological Range',
                warning,
                [
                    {
                        text: 'Cancel',
                        onPress: () => {
                            updatePatientData({ muac: '' });
                            setShowMuacStatusBar(false);
                    }},
                    {
                        text: 'Yes',
                        style: 'cancel',
                        onPress: () => setShowMuacStatusBar(true),
                    },
                ]
            );
        }
    };

    const handleTemperatureBlur = () => {
        const warning = validateTemperatureRange(temperature).warningMessage;
        
        if (!warning) return;

        if (Platform.OS === 'web') {
            // Web: use confirm to mimic Cancel / OK
            const confirmResult = window.confirm(
                `Data Outside Physiological Range\n\n${warning}\n\nPress OK to continue, Cancel to clear value.`
            );

            if (confirmResult) {
                // ok
                return;
            } else {
                // Cancel
                updatePatientData({ temperature: '' });
            }
        } else {
            // Mobile (iOS/Android)
            Alert.alert(
                'Data Outside Physiological Range',
                warning,
                [
                    {
                        text: 'Cancel',
                        onPress: () => {
                            updatePatientData({ temperature: '' });
                    }},
                    {
                        text: 'Yes',
                        style: 'cancel',
                    },
                ]
            );
        }
    };

      const handleRrateBlur = () => {
        const warning = validateRespiratoryRange(rrate).warningMessage;
        
        if (!warning) return;

        if (Platform.OS === 'web') {
            // Web: use confirm to mimic Cancel / OK
            const confirmResult = window.confirm(
                `Data Outside Physiological Range\n\n${warning}\n\nPress OK to continue, Cancel to clear value.`
            );

            if (confirmResult) {
                // ok
                return;
            } else {
                // Cancel
                updatePatientData({ temperature: '' });
            }
        } else {
            // Mobile (iOS/Android)
            Alert.alert(
                'Data Outside Physiological Range',
                warning,
                [
                    {
                        text: 'Cancel',
                        onPress: () => {
                            updatePatientData({ temperature: '' });
                    }},
                    {
                        text: 'Yes',
                        style: 'cancel',
                    },
                ]
            );
        }
    };

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
    { value: '7 days to 1 month ago', key: '7d-1mo' },
    { value: '1 month to 1 year ago', key: '1mo-1y' },
    { value: 'More than 1 year ago', key: '>1y' }];

    const eyeMovementOptions = [
        {value: 'Watches or follows', key: '1'},
        {value: 'Fails to watch or follow', key: '0'}
    ]

    const motorResponseOptions = [
        // {value: 'Normal behaviour observed', key: '2'},
        {value: 'Normal behaviour or localizes painful stimulus', key: "2"},
        {value: 'Withdraws limb from painful stimulus', key: '1'},
        {value: 'No response/inappropriate response', key: '0'}
    ]

    const verbalResponseOptions = [
        // {value: 'Normal behaviour observed', key: '2'},
        {value: 'Normal behaviour or cries appropriately with pain (or speaks if verbal)', key: '2'},
        {value: 'Moan or abnormal cry with pain', key: '1'},
        {value: 'No vocal response to pain', key: '0'}
    ]

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

                                    {isNeonate &&
                                        <View style={{flexDirection:'row', alignItems: 'center'}}>
                                            <SearchableDropdown 
                                                data={[
                                                    { value: 'Yes', key: 'yes'},
                                                    { value: 'No', key: 'no'},
                                                    { value: "Unsure", key: "unsure"}
                                                ]} 
                                                label={'Neonatal Jaundice (required)'}
                                                placeholder='select option below' 
                                                onSelect={(item) => updatePatientData({ neonatalJaundice: item.value })}
                                                value={jaundice}
                                                search={false}
                                            />
                                            <IconButton
                                                icon="help-circle-outline"
                                                size={20}
                                                iconColor={colors.primary}
                                                onPress={() => {
                                                    Platform.OS !== 'web' ? Alert.alert('Info', jaundiceInfo) : alert(jaundiceInfo)
                                                }}
                                            />
                                        </View>
                                    }

                                    {/* TODO - replace dropdown with yes/no radio buttons */}
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
                                        selected={feedingStatus ? 'yes' : 'no'} 
                                        onSelect={(value) => updatePatientData({ feedingWell: value === 'yes' })}/>
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
                                    <ValidatedTextInput 
                                        label={'Weight (required)'}
                                        value={weight} 
                                        onChangeText={(value) => updatePatientData({ weight: value})}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true} 
                                        customValidator={(value) => validateWeight(value).isValid}
                                        customErrorMessage={validateWeight(weight).errorMessage}
                                        showErrorOnTyping={true}
                                        right={<TextInput.Affix text="kg" />}                             
                                    />

                                    {/* If no error and waz calculated, show nutrition status bar */}
                                    {!validateWeight(weight).errorMessage && waz !== null &&
                                        <NutritionStatusBar 
                                            title={`WAZ Nutritional Status: ${getWazNutritionalStatus(waz).toUpperCase()}`} 
                                            content={`z-score = ${waz.toFixed(2)}`}
                                            variant={getWazNutritionalStatus(waz as number) || 'invalid'}
                                        />
                                    }
                                    <View style={{flexDirection:'row', alignItems: 'center'}}>
                                        <ValidatedTextInput 
                                            label={'MUAC (required)'}
                                            value={muac} 
                                            onChangeText={(value) => {
                                                updatePatientData({ muac: value })
                                                setShowMuacStatusBar(false)
                                            }}
                                            onBlurExternal={handleMuacBlur}
                                            inputType={INPUT_TYPES.NUMERIC}
                                            isRequired={true} 
                                            showErrorOnTyping={true}
                                            customValidator={(value) => validateMuac(value).isValid}
                                            customErrorMessage={validateMuac(muac).errorMessage }
                                            style={[Styles.accordionTextInput, { flex: 1 }]}
                                            right={<TextInput.Affix text="mm" />}                             
                                        />
                                        <IconButton
                                            icon="help-circle-outline"
                                            size={20}
                                            iconColor={colors.primary}
                                            onPress={() => {
                                                (Platform.OS !== 'web') ? Alert.alert('Info', muacInfo) : alert(muacInfo)
                                            }}
                                        />
                                    </View>
                                    {showMuacStatusBar &&
                                        <NutritionStatusBar 
                                            title={`MUAC Nutritional Status: ${getMuacStatus(isUnderSixMonths, muac).toUpperCase()}`} 
                                            content=''
                                            variant={getMuacStatus(isUnderSixMonths, muac)}
                                        />
                                    }
                                    <Text style={Styles.accordionSubheading}>Oxygen Saturation <Text style={Styles.required}>*</Text></Text>
                                    <ValidatedTextInput 
                                        label={'SpO₂ (required)'}
                                        value={spo2} 
                                        onChangeText={(value) => updatePatientData({ spo2: value })}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true}
                                        customValidator={(value) => validateOxygenSaturationRange(value).isValid}
                                        customErrorMessage={validateOxygenSaturationRange(spo2).errorMessage } 
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
                                    <ValidatedTextInput 
                                        label={'Weight (required)'}
                                        value={weight} 
                                        onChangeText={(value) => updatePatientData({ weight: value})}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true} 
                                        customValidator={(value) => validateWeight(value).isValid}
                                        customErrorMessage={validateWeight(weight).errorMessage}
                                        showErrorOnTyping={true}
                                        right={<TextInput.Affix text="kg" />}                             
                                    />

                                    {/* If no error and waz calculated, show nutrition status bar */}
                                    {!validateWeight(weight).errorMessage && waz !== null &&
                                        <NutritionStatusBar 
                                            title={`WAZ Nutritional Status: ${getWazNutritionalStatus(waz).toUpperCase()}`} 
                                            content={`z-score = ${waz.toFixed(2)}`}
                                            variant={getWazNutritionalStatus(waz as number) || 'invalid'}
                                        />
                                    }
                                    <View style={{flexDirection:'row', alignItems: 'center'}}>
                                        <ValidatedTextInput 
                                            label={'MUAC (required)'}
                                            value={muac} 
                                            onChangeText={(value) => {
                                                updatePatientData({ muac: value })
                                                setShowMuacStatusBar(false)
                                            }}
                                            inputType={INPUT_TYPES.NUMERIC}
                                            isRequired={true} 
                                            customValidator={(value) => validateMuac(value).isValid}
                                            customErrorMessage={validateMuac(muac).errorMessage }
                                            onBlurExternal={handleMuacBlur}
                                            style={[Styles.accordionTextInput, { flex: 1 }, {marginBottom: 0}]}
                                            right={<TextInput.Affix text="mm" />}                             
                                        />
                                        <IconButton
                                            icon="help-circle-outline"
                                            size={20}
                                            iconColor={colors.primary}
                                            onPress={() => {
                                                Platform.OS !== 'web' ? Alert.alert('Info', muacInfo) : alert(muacInfo)
                                            }}
                                        />
                                    </View>
                                    { showMuacStatusBar &&
                                        <NutritionStatusBar 
                                            title={`MUAC Nutritional Status: ${getMuacStatus(isUnderSixMonths, muac).toUpperCase()}`} 
                                            content=''
                                            variant={getMuacStatus(isUnderSixMonths, muac)}
                                        />
                                    }
                                    
                                    <ValidatedTextInput 
                                        label={'Temperature (required)'}
                                        value={temperature} 
                                        onChangeText={(value) => updatePatientData({ temperature: value })}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true} 
                                        customValidator={(value) => validateTemperatureRange(value).isValid}
                                        customErrorMessage={validateTemperatureRange(temperature).errorMessage}
                                        onBlurExternal={handleTemperatureBlur}
                                        right={<TextInput.Affix text="°C" />}                             
                                    />

                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Text style={Styles.accordionSubheading}>Respiratory Rate <Text style={Styles.required}>*</Text></Text>
                                        <IconButton
                                            icon="help-circle-outline"
                                            size={20}
                                            iconColor={colors.primary}
                                            onPress={() => {
                                                if (Platform.OS !== 'web') {
                                                    Alert.alert('Instructions', rrateButtonInfo)
                                                } else {
                                                    alert(rrateButtonInfo)
                                                }
                                            }}
                                        />
                                    </View>
                                
                                    <ValidatedTextInput 
                                        label={'Breaths per minute (required)'}
                                        value={rrate} 
                                        onChangeText={(value) => updatePatientData({ rrate: value })}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        isRequired={true}
                                        customValidator={(value) => validateRespiratoryRange(value).isValid}
                                        customErrorMessage={validateRespiratoryRange(rrate).errorMessage }
                                        onBlurExternal={handleRrateBlur}
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
                                        customValidator={(value) => validateOxygenSaturationRange(value).isValid}
                                        customErrorMessage={validateOxygenSaturationRange(spo2).errorMessage } 
                                        right={<TextInput.Affix text="%" />}                             
                                    />
                                </View>
                            </List.Accordion>
                        </View>
                        
                        {/* Blantyre Coma Scale Accordion for patients 6-60 months*/}
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
                                                onSelect={(item) => {
                                                    updatePatientData({ eyeMovement: item})
                                                }}
                                                value={eyeMovement?.value}
                                                search={false}
                                            />
                                        </View>
                                        <IconButton
                                            icon="information-outline"
                                            size={20}
                                            iconColor={colors.primary}
                                            onPress={() => {
                                                Platform.OS !== 'web' ? Alert.alert('Instructions', eyeMovementInfo) : alert(eyeMovementInfo)
                                            }}
                                        />
                                    </View>

                                    {/* Motor response dropdown */}
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <View style={{flex: 1}}>
                                                <SearchableDropdown 
                                                    data={motorResponseOptions} 
                                                    label={'Best motor response'}
                                                    placeholder='select option below' 
                                                    onSelect={(item) => {
                                                        updatePatientData({ motorResponse: item})
                                                    }}
                                                    value={motorResponse?.value}
                                                    search={false}
                                                />
                                            </View>
                                            <IconButton
                                                icon="information-outline"
                                                size={20}
                                                iconColor={colors.primary}
                                                onPress={() => {
                                                    Platform.OS !== 'web' ? Alert.alert('Instructions', motorResponseInfo) : alert(motorResponseInfo)
                                                }}
                                            />
                                    </View>
                                    
                                    {/* Verbal response dropdown */}
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <View style={{flex: 1}}>
                                            <SearchableDropdown 
                                                data={verbalResponseOptions} 
                                                label={'Verbal response'}
                                                placeholder='select option below' 
                                                onSelect={(item) => {
                                                    updatePatientData({ verbalResponse: item})
                                                }}
                                                value={verbalResponse?.value}
                                                search={false}
                                            />
                                        </View>
                                        {/* White icon to align dropdown with others */}
                                        <IconButton
                                            icon="information-outline"
                                            size={20}
                                            iconColor='white'
                                        />
                                    </View>
                                    { bcsScore !== null && eyeMovement?.value && motorResponse?.value && verbalResponse?.value &&
                                        <NutritionStatusBar 
                                            title={`BCS Status: ${abnormalBCS ? 'ABNORMAL' : 'NORMAL'}`}
                                            content={`calculated BCS score = ${bcsScore}`}
                                            variant={mapBcsScoreToVariant(bcsScore)}
                                        />
                                    }
                                    
                                </View>
                            </List.Accordion>
                        </View>
                    </List.Section>
                }
            </ScrollView>

            {/* Display error summary*/}
            { showErrorSummary &&
                <ValidationSummary 
                    errors={validationErrors}
                    variant='error'
                    title= 'ALERT: Fix Errors Below'
                />
            }

             { hasValidationWarnings &&
                <ValidationSummary 
                errors={validationWarnings}
                variant='warning'
                title='WARNING: Data Outside Expected Range'
                />
            }

            <PaginationControls
                showPrevious={true}
                showNext={true}
                onPrevious={() => router.back()}
                onNext={() => {
                    if (hasValidationErrors) {
                      setShowErrorSummary(true)
                    } else {
                        setShowErrorSummary(false)
                        router.push('/(dataEntry-sidenav)/medicalConditions')}
                    }
                }
            />
        </SafeAreaView>
    );
}