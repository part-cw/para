import Checkbox from '@/src/components/Checkbox';
import PaginationControls from '@/src/components/PaginationControls';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// TODO: add evenhandlers and autosave
// TODO: maybe replace alert with tooltip

export default function CaregiverContactScreen() {
    const { colors } = useTheme();
    const [sendReminders, setSendReminder] = useState(false);
    const [isCaregiversPhone, setIsCaregiversPhone] = useState(false);

    const telephoneInfo = "If the patient's caregiver does not have a phone, enter the number of a relative or friend who lives nearby"
    const telephoneCheckboxInfo = "Do not select this option if the entered telephone number belongs to anyone other than the patient's caregiver (e.g. friend, neighbour, or other relative)"

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
                {/* <DebugStack/> */}
                <Card style={Styles.cardWrapper}>
                    <Card.Content>
                        <Text variant="bodyLarge">
                            The following information will be sent to the VHT so 
                            they can connect with the patient and their caregiver.     
                        </Text>
                        <Text variant="bodyLarge" style={{marginTop: 10}}>
                            Enter the contact information of the 
                            <Text style={{ fontWeight: 'bold' }}> patient's parent or guardian</Text>.
                            This may be different from the person who brought in the patient. 
                        </Text>
                    </Card.Content>
                </Card>

                <TextInput 
                    label="Name of Head of Family (required)"
                    placeholder="Enter name of the patient's primary caregiver" 
                    mode="outlined" 
                    style={Styles.textInput} />
                    
                <TextInput 
                    label="Subvillage (required)"
                    placeholder="Enter subvillage name" 
                    mode="outlined" 
                    style={Styles.textInput} />
                
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                     <TextInput 
                        label="Telephone"
                        placeholder="Enter phone number" 
                        mode="outlined"
                        keyboardType='numeric' 
                        style={[Styles.textInput, {flex: 1}]} />
                    <IconButton
                        icon="help-circle-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => {alert(telephoneInfo)}}/>
                </View>
               
                <TextInput 
                    label="Confirm Telephone"
                    placeholder="Re-enter phone number" 
                    mode="outlined" 
                    keyboardType='numeric' 
                    style={Styles.textInput} />
                
                <View style={{marginLeft: 8, marginRight: 8}}>
                    <Text style={Styles.sectionHeader}>Additional Information</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Checkbox 
                            label={'Phone number belongs to caregiver'} 
                            checked={isCaregiversPhone} 
                            onChange={() => {setIsCaregiversPhone((prev) => !prev)}}/>
                        <IconButton
                        icon="help-circle-outline"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => {alert(telephoneCheckboxInfo)}}/>
                    </View>
                    
                    <Checkbox label={'Receive reminders by text message'} 
                                checked={sendReminders} 
                                onChange={() => {setSendReminder((prev) => !prev)}}/>
                </View>

            </ScrollView>

        <PaginationControls
            showPrevious={true}
            showNext={true}
            onPrevious={() => router.push('/(dataEntry-sidenav)/vhtReferral')}
            onNext={() => router.push('/(dataEntry-sidenav)/review')}
        />            
        </SafeAreaView>
    );
}