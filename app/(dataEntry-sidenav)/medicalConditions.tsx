import { Text, View } from 'react-native';

export default function MedicalConditionsScreen() {
  
    return (
        <>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Medical Conditions</Text>
            </View>
        </>
    );
}

export const options = {
  title: 'Medical Conditions',
};