import Checkbox from '@/src/components/Checkbox';
import PaginationButton from '@/src/components/PaginationButton';
import RadioButtonGroup from '@/src/components/RadioButtonGroup';
import SearchableDropdown, { DropdownItem } from '@/src/components/SearchableDropdown';
import ValidatedTextInput, { INPUT_TYPES } from '@/src/components/ValidatedTextInput';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { ageErrorMessage, isValidAge } from '@/src/utils/inputValidator';
import { PatientIdGenerator } from '@/src/utils/patientIdGenerator';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
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
    const [dob, setDOB] = useState<string>('');
    const [birthYear, setBirthYear] = useState<string>('');
    const [birthMonth, setBirthMonth] = useState<DropdownItem | null>(null);
    const [approxAge, setApproxAge] = useState<string>('');

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
                />
                
                {/* Sex Section */}
                {/* TODO - figure out what 'value' does in RadioButtonGroup*/}
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
                        onChange={() => {setIsDOBUnknown((prev) => !prev)}}/>  
                {
                    !isDOBUnknown
                    ?
                    // TODO - replace TextInput with DatePicker
                    <TextInput label="Date of Birth (YYYY/MM/DD)" mode="flat" style={[Styles.textInput, {marginTop: 10}]} />
                    :
                    <>
                        <Checkbox label={'Birth year and month unknown'} 
                                checked={isYearMonthUnknown} 
                                onChange={() => {setIsYearMonthUnknown((prev) => !prev)}}/>  
                        {
                            !isYearMonthUnknown
                            ?
                            <>
                                {/* TODO - replace TextInput with ValidatedTextInput */}
                                <ValidatedTextInput 
                                    label="Birth Year" 
                                    value={birthYear}
                                    onChangeText={setBirthYear}
                                    inputType={INPUT_TYPES.NUMERIC}
                                    style={{marginTop: 10}}
                                    // customValidator={() => isValidAge(approxAge)}
                                    // customErrorMessage={ageErrorMessage}
                                    isRequired={true}
                                />
                                <SearchableDropdown 
                                    data={months} 
                                    label={'Birth Month'}
                                    placeholder="Search for or select patient's birth month" 
                                    onSelect={setBirthMonth}
                                    value={birthMonth?.value}
                                    search={true}
                                    style={{marginTop: 20}}
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