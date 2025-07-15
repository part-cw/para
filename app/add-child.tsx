import AppBar from '@/components/AppBar';
import { Text, View } from 'react-native';

export default function AddChildScreen() {
  return (
    <>
    <AppBar/>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Add Child Screen</Text>
      {/* You can add your form or inputs here */}
    </View>
    </>
  );
}