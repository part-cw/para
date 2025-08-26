import Checkbox from '@/src/components/Checkbox';
import PaginationButton from '@/src/components/PaginationButton';
import RadioButtonGroup from '@/src/components/RadioButtonGroup';
import SearchableDropdown, { DropdownItem } from '@/src/components/SearchableDropdown';
import ValidatedTextInput, { INPUT_TYPES } from '@/src/components/ValidatedTextInput';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { AgeCalculator } from '@/src/utils/ageCalculator';
import { ageErrorMessage, isValidAge, isValidYearInput, yearErrorMessage } from '@/src/utils/inputValidator';
import { PatientIdGenerator } from '@/src/utils/patientIdGenerator';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// TODO - add age validation for DOB and birth year/month!
// TODO - find good date picker for DOB

export default function PatientInformationScreen() {
    const [sex, setSex] = useState<string>('');
    const [isUnderSixMonths, setIsUnderSixMonths] = useState(false);
    const [isDOBUnknown, setIsDOBUnknown] = useState(false);
    const [isYearMonthUnknown, setIsYearMonthUnknown] = useState(false);
    const [previewPatientId, setPreviewPatientId] = useState<string>('');
    
    const [surname, setSurname] = useState<string>('');
    const [firstName, setFirstName] = useState<string>('');
    const [otherName, setOtherName] = useState<string>('');
    
    const [dob, setDOB] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [birthYear, setBirthYear] = useState<string>('');
    const [birthMonth, setBirthMonth] = useState<DropdownItem | null>(null);
    const [approxAge, setApproxAge] = useState<string>('');

    console.log('dob', dob)
    console.log('year', birthYear)
    console.log('month', birthMonth)
    console.log('approxAge', approxAge)
    console.log('estimated age', AgeCalculator.calculateEstimatedAge(dob, birthYear, birthMonth, approxAge))

    
    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === "set" && selectedDate) {
            // make sure only one of these age params are set to non-null at a time (except year and month must be set together)
            setDOB(selectedDate);
            setBirthYear('');
            setBirthMonth(null);
            setApproxAge('');
        }
    
        if (Platform.OS === "android") {
            setShowDatePicker(false); // Android requires manual closing
        }
    };

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
        const id = await PatientIdGenerator.getPreviewPatientId();
        setPreviewPatientId(id);
        };
        fetchId();
    }, []);

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Patient ID Section */}
                <Text style={Styles.sectionHeader}>Patient ID</Text>
                <TextInput mode="flat" value={previewPatientId} disabled />

                {/* Patient Name Section */}
                <Text style={Styles.sectionHeader}>Patient Name <Text style={Styles.required}>*</Text></Text>
                 <ValidatedTextInput 
                    label="Surname (required)" 
                    value={surname}
                    onChangeText={setSurname}
                    inputType={INPUT_TYPES.TEXT}
                    isRequired={true}
                />
                <ValidatedTextInput 
                    label="First Name (required)" 
                    value={firstName}
                    onChangeText={setFirstName}
                    inputType={INPUT_TYPES.TEXT}
                    isRequired={true}
                />
                 <ValidatedTextInput 
                    label="Other Name (optional)" 
                    value={otherName}
                    onChangeText={setOtherName}
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
                    onSelect={setSex}/>

                {/* Age Section */}
                <Text style={Styles.sectionHeader}>Age <Text style={Styles.required}>*</Text></Text>
                <Checkbox label={'Patient is less than 6 months old'} 
                          checked={isUnderSixMonths} 
                          onChange={() => {setIsUnderSixMonths((prev) => !prev)}}/>
                <Checkbox label={'Exact date of birth (DOB) unknown'} 
                        checked={isDOBUnknown} 
                        onChange={() => {
                            setIsDOBUnknown(prev => {
                                const newValue = !prev;
                                setDOB(null) // reset DOB value when checkbox clicked

                                if (!newValue) { // DOB is known
                                    setIsYearMonthUnknown(false); // reset when DOB is known
                                    
                                    // clear less detailed age fields
                                    setBirthYear('')
                                    setBirthMonth(null)
                                    setApproxAge('')
                                }
                                return newValue;

                            });
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
                                setIsYearMonthUnknown((prev) => {
                                    const newVal = !prev; // change checkbox val
                                    
                                    // reset year/month when checkbox clicked
                                    setBirthYear('')
                                    setBirthMonth(null)

                                    // if birth year and birth month are known clear other age values
                                    if (!newVal) {
                                        setDOB(null)
                                        setApproxAge('')
                                    }
                                    return newVal;
                                })
                            }}
                        />  
                        {
                            !isYearMonthUnknown
                            ?
                            <>
                                {/* TODO - validate year -- numbers only, no special characters */}
                                <ValidatedTextInput 
                                    label="Birth Year" 
                                    value={birthYear}
                                    onChangeText={setBirthYear}
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
                                    onSelect={setBirthMonth}
                                    value={birthMonth?.value}
                                    search={true}
                                    style={{marginTop: 10}}
                                />
                            </>
                            :
                            <ValidatedTextInput 
                                label="Approximate Age (in years)" 
                                value={approxAge}
                                onChangeText={setApproxAge}
                                inputType={INPUT_TYPES.NUMERIC}
                                customValidator={() => isValidAge(approxAge)}
                                customErrorMessage={ageErrorMessage}
                                isRequired={true}
                                right={<TextInput.Affix text="years old" />}
                            />
                        }
                        
                    </>
                }
                        
                
            </ScrollView>
            
            {/* Pagination controls */}
            <View style={Styles.nextButtonContainer}>
                <PaginationButton
                    // TODO - add alerts on press ??
                    onPress={() => 
                        {router.push('../(dataEntry-sidenav)/admissionClinicalData')}}
                    isNext={ true }
                    label='Next'
                />
            </View>
          
        </SafeAreaView>
    );
}