import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Checkbox from '../../components/Checkbox';


export default function PatientInformationScreen() {
    const { fonts } = useTheme();
  
    return (
        <SafeAreaView>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View style={{flex: 1, alignItems: 'flex-start',  margin: 15}}>
                    <Text style={{fontSize: fonts.bodyLarge.fontSize, fontWeight: 'bold'}}>Patient Name</Text>
                </View>
                <TextInput mode='flat' label="Surname"/>
                <TextInput label="First Name"/>
                <TextInput label="Other Name"/>

                <Checkbox label={'test'} checked={false} onChange={() => {}}/>
            </ScrollView>
        </SafeAreaView>
    );
}