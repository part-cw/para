import Checkbox from '@/components/Checkbox';
import PaginationButton from '@/components/PaginationButton';
import RadioButtonGroup from '@/components/RadioButtonGroup';
import { GlobalStyles as Styles } from '@/themes/styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


// // TODO - implement functionality for event handlers!

export default function PatientInformationScreen() {
    const [sex, setSex] = useState<string>('');
    const [isUnderSixMonths, setIsUnderSixMonths] = useState(false);
    const [isDOBUnknown, setIsDOBUnknown] = useState(false);
  
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Patient ID Section */}
                {/* TODO - implement setID function */}
                <Text style={Styles.sectionHeader}>Patient ID</Text>
                <TextInput mode="flat" value="<<auto-filled by setID function>>" disabled />

                {/* Patient Name Section */}
                <Text style={Styles.sectionHeader}>Patient Name <Text style={Styles.required}>*</Text></Text>
                <TextInput label="Surname (required)" mode="flat" style={Styles.textInput} />
                <TextInput label="First Name (required)" mode="flat" style={Styles.textInput} />
                <TextInput label="Other Name (optional)" mode="flat" style={Styles.textInput} />

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
                <TextInput label="Date of Birth (YYYY/MM/DD)" mode="flat" style={Styles.textInput} />
                
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