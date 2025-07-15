import AddChildHeader from '@/components/AddChildHeader';
import { Text, View } from 'react-native';

export default function AddChildScreen() {
  return (
    <>
    <AddChildHeader title="Admission Clinical Data"/>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Add Child Screen</Text>
      {/* You can add your form or inputs here */}
    </View>
    </>
  );
}