import Checkbox from '@/src/components/Checkbox';
import PaginationButton from '@/src/components/PaginationButton';
import RadioButtonGroup from '@/src/components/RadioButtonGroup';
import SearchableDropdown from '@/src/components/SearchableDropdown';
import ValidatedTextInput, { INPUT_TYPES } from '@/src/components/ValidatedTextInput';
import ValidationSummary from '@/src/components/ValidationSummary';
import { MAX_PATIENT_AGE } from '@/src/config';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { useValidation } from '@/src/contexts/ValidationContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from '@/src/utils/ageCalculator';
import { formatNumericInput, isValidTextFormat, isValidYearInput, textErrorMessage, validateApproxAge, yearErrorMessage } from '@/src/utils/inputValidator';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function PatientInformationScreen() {
    const { height } = useWindowDimensions();

    const { patientData, updatePatientData, getPreviewPatientId, startAdmission, handleAgeChange, isDataLoaded } = usePatientData();
    const { setValidationErrors, getScreenErrors, getScreenWarnings } = useValidation();

    const [previewPatientId, setPreviewPatientId] = useState<string>('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [ageDisplay, setAgeDisplay] = useState<number | null>(null);
    const [showErrorSummary, setShowErrorSummary] = useState<boolean>(false)

    const validationErrors = getScreenErrors('patientInformation');
    const hasValidationErrors = validationErrors.length > 0;

    // Local state for form validation and UI
    const {
        sex,
        isUnderSixMonths,
        isDOBUnknown,
        isYearMonthUnknown,
        surname,
        firstName,
        otherName,
        dob,
        birthYear,
        birthMonth,
        approxAgeInYears: approxAge,
    } = patientData;

    const ageLessThanSixMonthsError = 'Entered age is less than 6 months. Check off "patient is less than 6 months old" or enter new DOB'
    const ageGreaterThanSixMonthsError = 'Entered age is more than 6 months. Enter new DOB or deselect "...less than 6 months..." option'
    const ageRequiredError = 'Age information required';

    const ageValidationError = validationErrors.find(err => 
        err === ageLessThanSixMonthsError || 
        err === ageGreaterThanSixMonthsError || 
        err.includes('Invalid age') ||
        err === ageRequiredError
    ) || '';

    const months = [
        { value: 'January', key: 'Jan'},
        { value: 'February', key: 'Feb'},
        { value: 'March', key: 'Mar'},
        { value: 'April', key: 'Apr'},
        { value: 'May', key: 'May'},
        { value: 'June', key: 'Jun'},
        { value: 'July', key: 'Jul'},
        { value: 'August', key: 'Aug'},
        { value: 'September', key: 'Sep'},
        { value: 'October', key: 'Oct'},
        { value: 'November', key: 'Nov'},
        { value: 'December', key: 'Dec'},
    ]

    const validateAllFields = () => {
        const errors: string[] = []

        if (!surname) {
            errors.push('Surname is required');
        } else if (!isValidTextFormat(surname)){
            errors.push(`Invalid surname. ${textErrorMessage}`)
        }

        if (!firstName) {
            errors.push('First name is required');

        } else if (!isValidTextFormat(firstName)){
            errors.push(`Invalid first name. ${textErrorMessage}`)
        }

        if (otherName && !isValidTextFormat(otherName)){
            errors.push(`Invalid 'other name'. ${textErrorMessage}`)
        }

        if (sex === '') {
            errors.push(`Sex is required.`)
        }

        // Age validation
        const hasAgeInfo = dob || (birthMonth && birthYear) || approxAge;
        if (!hasAgeInfo) {
            errors.push(ageRequiredError)
        } else {
            try {
                const age = AgeCalculator.calculateAgeInMonths(dob, birthYear, birthMonth, approxAge);
                updatePatientData({
                    ageInMonths: age,
                    isNeonate: dob && AgeCalculator.getAgeInDaysFromDob(dob) < 30
                })

                if (age < 6 && !isUnderSixMonths) {
                    errors.push(ageLessThanSixMonthsError) 
                    setAgeDisplay(null)
                } else if (age > 6 && isUnderSixMonths) {
                    errors.push(ageGreaterThanSixMonthsError)
                    setAgeDisplay(null)
                } else {
                    setAgeDisplay(age)
                }
            } catch (error) {
                setAgeDisplay(null);
                const errMessage = error instanceof Error ? error.message : 'Invalid age information'
                errors.push(errMessage)
            }
        }


        return errors;
    }

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === "set" && selectedDate) {
            const ageInDays = AgeCalculator.getAgeInDaysFromDob(selectedDate);
            const isYoungInfant = ageInDays < 28; // true if < 28 days
            updatePatientData({
                dob: selectedDate,
                birthYear: '',
                birthMonth: '',
                approxAgeInYears: '',
                sickYoungInfant: isYoungInfant
            })
        }

        if (Platform.OS === "android") {
            setShowDatePicker(false); // Android requires manual closing
        }
    };

    const handleApproxAgeChange = (value: string) => {
        // Check if value is valid before calculating sickYoungInfant
        updatePatientData({ 
            approxAgeInYears: value,
            sickYoungInfant: (() => {
                // Check if value is valid before calculating sickYoungInfant
                const numericValue = parseFloat(value.trim())
                if (isNaN(numericValue) || numericValue < 0 || numericValue > MAX_PATIENT_AGE) {
                    // Don't update sickYoungInfant for invalid values, keep current state
                    return patientData.sickYoungInfant;
                }

                const ageInDays = numericValue * 365.25;
                const roundedAgeInDays = AgeCalculator.roundAge(ageInDays);
                return roundedAgeInDays < 28;
            })()
        })
    }

    const handleYearMonthChange = (year: string, month: string | undefined) => {
        let isYoungInfant
        if (year && month) {
            const dob = AgeCalculator.createDob(year, month)
            const ageInDays = AgeCalculator.getAgeInDaysFromDob(dob)
            isYoungInfant = ageInDays < 28;
        }

        updatePatientData({ 
            birthYear: year,
            birthMonth: month,
            sickYoungInfant: isYoungInfant
        })
    }

    // Validate age whenever relevant data changes
    useEffect(() => {
        const errorMessages = validateAllFields();
        setValidationErrors('patientInformation', errorMessages)
    }, [dob, birthYear, birthMonth, approxAge, surname, firstName, otherName, sex, isUnderSixMonths]);

    // Clear errors when component unmounts or navigates away
    useEffect(() => {
        return () => {
            // Only clear if no errors exist
            if (validateAllFields().length === 0) {
                setValidationErrors('admissionClinicalData', []);
            }
        };
    }, []);

    useEffect(() => {
        const fetchId = async () => {
            const id = await getPreviewPatientId();
            setPreviewPatientId(id);
        };
        fetchId();

        // Start admission tracking when user first enters patient information screen
        startAdmission();
    }, []);

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
            <KeyboardAvoidingView 
                style={{flex: 1}} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={height > 700 ? 60 : 40}
            >
                <ScrollView 
                    contentContainerStyle={{ 
                        padding: 20,
                    }} 
                    automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} // true only in iOS
                    showsVerticalScrollIndicator={false}
                >
                    {/* Patient ID Section */}
                    <Text style={Styles.sectionHeader}>Patient ID</Text>
                    <TextInput mode="flat" value={previewPatientId} disabled />

                    {/* Patient Name Section */}
                    <Text style={Styles.sectionHeader}>Patient Name <Text style={Styles.required}>*</Text></Text>
                    <ValidatedTextInput 
                        label="Surname (required)" 
                        value={surname}
                        onChangeText={(value) => updatePatientData({ surname: value })}
                        inputType={INPUT_TYPES.TEXT}
                        isRequired={true}
                    />
                    <ValidatedTextInput 
                        label="First Name (required)" 
                        value={firstName}
                        onChangeText={(value) => updatePatientData({ firstName: value })}
                        inputType={INPUT_TYPES.TEXT}
                        isRequired={true}
                    />
                    <ValidatedTextInput 
                        label="Other Name (optional)" 
                        value={otherName}
                        onChangeText={(value) => updatePatientData({ otherName: value })}
                        inputType={INPUT_TYPES.TEXT}
                        isRequired={false}
                        showErrorOnTyping={true}
                    />
                    
                    {/* Sex Section */}
                    <Text style={Styles.sectionHeader}>Sex <Text style={Styles.required}>*</Text></Text>
                    <RadioButtonGroup 
                        options={[
                            { label: 'Male', value: 'male'},
                            { label: 'Female', value: 'female'}]} 
                        selected={sex} 
                        onSelect={(value) => updatePatientData({ sex: value })}/>

                    {/* Age Section */}
                    <Text style={Styles.sectionHeader}>Age <Text style={Styles.required}>*</Text></Text>
                    <Checkbox 
                        label={'Patient is less than 6 months old'} 
                        checked={isUnderSixMonths} 
                        onChange={() => {
                            const newValue = !isUnderSixMonths
                            updatePatientData({isUnderSixMonths: newValue})
                            handleAgeChange(newValue)
                        }}
                    /> 
                    <Checkbox label={'Exact date of birth (DOB) unknown'} 
                            checked={isDOBUnknown} 
                            onChange={() => {
                                const newValue = !isDOBUnknown;
                                updatePatientData({
                                    isDOBUnknown: newValue,
                                    dob: null,
                                    ...(newValue ? {} : {
                                        // reset and clear all othe fields when dob unknown checked
                                        isYearMonthUnknown: false,
                                        birthYear: '',
                                        birthMonth: '',
                                        approxAgeInYears: ''
                                    })
                                })
                            }}
                    />  
                    {
                        (!isDOBUnknown || isUnderSixMonths)
                        ?
                        // TODO - DatePicker not supported on web - use regular TextInput if Platform.OS === 'web'
                        <>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                <TextInput 
                                    label="Date of Birth (YYYY-MM-DD)" 
                                    placeholder='Select date' 
                                    mode="flat" 
                                    value={dob ? dob.toISOString().split("T")[0] : ""}
                                    style={[Styles.textInput, {marginTop: 10}]}
                                    editable={false}
                                    pointerEvents="none"
                                />
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dob || new Date()}
                                    mode="date"
                                    display={Platform.OS === "ios" ? "spinner" : "default"}
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </>
                        :
                        <>
                            <Checkbox 
                                label={'Birth year and month unknown'} 
                                checked={isYearMonthUnknown} 
                                onChange={() => {
                                    const newVal = !isYearMonthUnknown;
                                    updatePatientData({
                                        isYearMonthUnknown: newVal,
                                        birthYear: '',
                                        birthMonth: '',
                                        ...(newVal ? {} : {
                                            dob: null,
                                            approxAgeInYears: ''
                                        })
                                    });
                                }}
                            />  
                            {
                                !isYearMonthUnknown
                                ?
                                <>
                                    <ValidatedTextInput 
                                        label="Birth Year" 
                                        value={birthYear}
                                        onChangeText={(value) => handleYearMonthChange(value, patientData.birthMonth)}
                                        inputType={INPUT_TYPES.NUMERIC}
                                        style={{marginTop: 10}}
                                        customValidator={() => isValidYearInput(birthYear)}
                                        customErrorMessage={yearErrorMessage}
                                        isRequired={true}
                                    />
                                    <SearchableDropdown 
                                        data={months} 
                                        label={'Birth Month'}
                                        placeholder="Search for or select patient's birth month" 
                                        onSelect={(item) => handleYearMonthChange(patientData.birthYear, item.value)}
                                        value={birthMonth}
                                        search={true}
                                        style={{marginTop: 10}}
                                    />
                                </>
                                :
                                <ValidatedTextInput 
                                    label="Approximate Age (in years)" 
                                    value={approxAge}
                                    onChangeText={handleApproxAgeChange}
                                    inputType={INPUT_TYPES.NUMERIC}
                                    isRequired={true}
                                    right={<TextInput.Affix text="years old" />}
                                    customValidator={validateApproxAge}
                                    showErrorOnTyping={true} 
                                    onBlur={() => {
                                        // Only format if the value is valid
                                        if (validateApproxAge(approxAge)) {
                                            handleApproxAgeChange(formatNumericInput(approxAge));
                                        }
                                    }}
                                />
                            }       
                        </>
                    }
                    
                    {/* Display age validation error */}
                    {ageValidationError && (
                        <Text style={[Styles.errorText, {marginTop: 5}]}>{ageValidationError}</Text>
                    )}

                    {/* Display estimated age if necessary fields filled and no ageValidation error */}
                    {
                        (dob || (birthMonth && birthYear) || approxAge) && (!ageValidationError && ageDisplay!== null)
                        &&
                        <Text>
                            Estimated age: {AgeCalculator.formatAge(ageDisplay)} old 
                        </Text>
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
                
                {/* Pagination controls */}
                <View style={[
                    Styles.nextButtonContainer,
                    // Platform.OS === 'android' && keyboardHeight > 0 && {
                    //     bottom: keyboardHeight
                    // }
                ]}>
                    <PaginationButton
                        onPress={() => {
                            if (hasValidationErrors) {
                                setShowErrorSummary(true)
                            } else {
                                setShowErrorSummary(false)
                                router.push('../(dataEntry-sidenav)/admissionClinicalData')
                            }
                        }}
                        isNext={true}
                        label='Next'
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}