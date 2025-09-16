import Checkbox from '@/src/components/Checkbox';
import PaginationButton from '@/src/components/PaginationButton';
import RadioButtonGroup from '@/src/components/RadioButtonGroup';
import SearchableDropdown from '@/src/components/SearchableDropdown';
import ValidatedTextInput, { INPUT_TYPES } from '@/src/components/ValidatedTextInput';
import { MAX_PATIENT_AGE } from '@/src/config';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from '@/src/utils/ageCalculator';
import { formatNumericInput, isValidYearInput, validateApproxAge, yearErrorMessage } from '@/src/utils/inputValidator';
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

// TODO refactor error hanbdling to be more like admissionClinicalData

export default function PatientInformationScreen() {
    const { height } = useWindowDimensions();

    const { patientData, updatePatientData, getPreviewPatientId, startAdmission, handleAgeChange, isDataLoaded } = usePatientData();
    const [previewPatientId, setPreviewPatientId] = useState<string>('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [ageValidationError, setAgeValidationError] = useState<string>('');
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

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
        ageInMonths // TODO calc and store age in months here -- pass it on to necessessary screens
    } = patientData;

    const ageLessThanSixMonthsError = 'Entered age is less than 6 months. Check off "patient is less than 6 months old" or enter new DOB'
    const ageGreaterThanSixMonthsError = 'Entered age is more than 6 months. Enter new DOB or unselct "...less than 6 months..." option'

    // Function to validate age and set error state
    const validateAge = () => {
        try {
            const age = AgeCalculator.calculateAgeInYears(dob, birthYear, birthMonth, approxAge);
            
            if (age < 0.5 && !isUnderSixMonths) {
                setAgeValidationError(ageLessThanSixMonthsError) 
                setCalculatedAge(null)
                return false;
            }

            if (age > 0.5 && isUnderSixMonths) {
                setAgeValidationError(ageGreaterThanSixMonthsError) 
                setCalculatedAge(null)
                return false;
            }

            updatePatientData({
                ageInMonths: AgeCalculator.calculateAgeInMonths(dob, birthYear, birthMonth, approxAge)
            })

            setCalculatedAge(age);
            setAgeValidationError(''); // Clear error if validation passes
            return true;
        } catch (error) {
            setCalculatedAge(null);
            setAgeValidationError(error instanceof Error ? error.message : 'Invalid age information');
            return false;
        }
    };

    const confirmNewIsUnderSixMonthFlagValid = (newIsUnderSixMonths: boolean) => {
        // calculate age if info available -- handles cases when checkbox checked before dob entered
        let age;
        if (dob || (birthYear && birthMonth) || approxAge) {
            age = AgeCalculator.calculateAgeInYears(dob, birthYear, birthMonth, approxAge);
        } else {
            return;
        }
        
        // Case 1: isUnderSixMonths false, entered age < 0.5 years -- INVALID
        if (age && age < 0.5 && !newIsUnderSixMonths) {
            setAgeValidationError(ageLessThanSixMonthsError)
            setCalculatedAge(null)
            return;
        }

        // Case 2: isUnderSixMonths true, entered age >= 0.5 years -- INVALID
        if (age && age >= 0.5 && newIsUnderSixMonths) {
            setAgeValidationError(ageGreaterThanSixMonthsError)
            setCalculatedAge(null)
            return
        }

        // All other cases -- VALID: (age<0.5 and isUnderSixMonths true; age >= 0.5 and isUnderSixMonths false)
        setAgeValidationError('') // clear error
        age && setCalculatedAge(age)
        return;
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

            // Clear age validation error when date changes
            setAgeValidationError('');
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

        // Clear age validation error when approx age changes
        setAgeValidationError('');
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

        // Clear age validation error when year/month changes
        setAgeValidationError('');
    }

    // Validate age whenever relevant data changes
    useEffect(() => {
        // Only validate if we have some age information
        if (dob || (birthYear && birthMonth) || approxAge) {
            // Use setTimeout to avoid validation during rapid state changes
            const timeoutId = setTimeout(() => {
                validateAge();
            }, 200);

            return () => clearTimeout(timeoutId);
        } else {
            setAgeValidationError('');
            setCalculatedAge(null);
        }
    }, [dob, birthYear, birthMonth, approxAge]);

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
                            confirmNewIsUnderSixMonthFlagValid(newValue)
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
                                setAgeValidationError(''); // clear error when toggling
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
                                    setAgeValidationError(''); // Clear error when toggling
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
                        (dob || (birthMonth && birthYear) || approxAge) && (!ageValidationError && calculatedAge!== null)
                        &&
                        <Text>
                            Estimated age: {AgeCalculator.roundAge(calculatedAge)} years old
                        </Text>
                    }
                </ScrollView>
                
                {/* Pagination controls */}
                <View style={[
                    Styles.nextButtonContainer,
                    // Platform.OS === 'android' && keyboardHeight > 0 && {
                    //     bottom: keyboardHeight
                    // }
                ]}>
                    <PaginationButton
                        onPress={() => {
                            if (!ageValidationError) {
                                router.push('../(dataEntry-sidenav)/admissionClinicalData')
                            }
                        }}
                        isNext={true}
                        label='Next'
                        disabled={!!ageValidationError} // disable pagination if there are age validation errors
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}