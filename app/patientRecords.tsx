import { Text, View } from "react-native";
import { useTheme } from 'react-native-paper';


export default function PatientRecords() {
  const { colors } = useTheme();

  return (
    <>
        <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{paddingBlock: 50}}>TODO Edit app/patientRecords.tsx to edit records.</Text>
        </View>
    </>
  );
}