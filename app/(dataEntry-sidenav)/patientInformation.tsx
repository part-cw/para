import Checkbox from '@/src/components/Checkbox';
import PaginationButton from '@/src/components/PaginationButton';
import RadioButtonGroup from '@/src/components/RadioButtonGroup';
import SearchableDropdown, { DropdownItem } from '@/src/components/SearchableDropdown';
import ValidatedTextInput, { INPUT_TYPES } from '@/src/components/ValidatedTextInput';
import { usePatientData } from '@/src/contexts/PatientDataContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from '@/src/utils/ageCalculator';
import { formatNumericInput, isValidYearInput, yearErrorMessage } from '@/src/utils/inputValidator';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO - add age validation for DOB and birth year/month - ensure estimated age is <= 5.5!

export default function PatientInformationScreen() {
    const { patientData, updatePatientData, getPreviewPatientId, startAdmission, isDataLoaded } = usePatientData();
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
        approxAge,
        sickYoungInfant,
    } = patientData;

    // Function to validate age and set error state
    const validateAge = () => {
        try {
            const age = AgeCalculator.calculateAgeInYears(dob, birthYear, birthMonth, approxAge);
            console.log('setting calculatedAge to', age)
            setCalculatedAge(age);
            setAgeValidationError(''); // Clear error if validation passes
            return true;
        } catch (error) {
            setCalculatedAge(null);
            setAgeValidationError(error instanceof Error ? error.message : 'Invalid age information');
            return false;
        }
    };

    console.log('calcualtedAge', calculatedAge)
    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === "set" && selectedDate) {
            const ageInDays = AgeCalculator.getAgeInDaysFromDob(selectedDate);
            const isYoungInfant = ageInDays < 28; // true if < 28 days
            
            updatePatientData({
                dob: selectedDate,
                birthYear: '',
                birthMonth: null,
                approxAge: '',
                sickYoungInfant: isYoungInfant
            })

            // Clear age validation error when date changes
            setAgeValidationError('');
        }

        if (Platform.OS === "android") {
            setShowDatePicker(false); // Android requires manual closing
        }
    };

    console.log('patientdata.approxage', patientData.approxAge)
    const handleApproxAgeChange = (value: string) => {
        // multiply years by 365.25 days/year
        let ageInDays = Number(value) * 365.25
        ageInDays = AgeCalculator.roundAge(ageInDays);
        const isYoungInfant = ageInDays < 28;

        let enteredAge = value;
        if (Number(value) < 0) {
            enteredAge = ''
        }

        updatePatientData({ 
            approxAge: enteredAge,
            sickYoungInfant: isYoungInfant 
        })

        // Clear age validation error when approx age changes
        setAgeValidationError('');
    }

    const handleYearMonthChange = (year: string, month: DropdownItem | null) => {
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
            }, 500);

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
            <ScrollView contentContainerStyle={{ padding: 20 }} automaticallyAdjustKeyboardInsets={true}>
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
                <Checkbox label={'Patient is less than 6 months old'} 
                          checked={isUnderSixMonths} 
                          onChange={() => updatePatientData({isUnderSixMonths: !isUnderSixMonths})}/> 
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
                                    birthMonth: null,
                                    approxAge: ''
                                })
                            })
                            setAgeValidationError(''); // clear error when toggling
                        }}
                />  
                {
                    !isDOBUnknown
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
                                    birthMonth: null,
                                    ...(newVal ? {} : {
                                        dob: null,
                                        approxAge: ''
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
                                    onSelect={(value) => handleYearMonthChange(patientData.birthYear, value)}
                                    value={birthMonth?.value}
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
                                onBlur={() => handleApproxAgeChange(formatNumericInput(approxAge))}
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
            <View style={Styles.nextButtonContainer}>
                <PaginationButton
                    onPress={() => {
                        if (!ageValidationError) {
                            router.push('../(dataEntry-sidenav)/admissionClinicalData')
                        }
                    }}
                    isNext={ true }
                    label='Next'
                    disabled={!!ageValidationError} // disable pagination if there are age validation errors
                />
            </View>
          
        </SafeAreaView>
    );
}