// import { GlobalStyles as Style } from '@/themes/styles';
// import { MaterialIcons } from '@expo/vector-icons';
// import React from 'react';
// import { Pressable, Text, View } from 'react-native';

// type Props = {
//   label: string;
//   checked: boolean;
//   onChange: () => void;
// };

// // Checkbox component adapted from RRate repo: 
// // https://github.com/part-cw/rrate/blob/main/components/Checkbox.tsx
// export default function Checkbox({ label, checked, onChange }: Props) {
//   return (
//     <Pressable style={Style.checkboxContainer} onPress={onChange}>
//       <View style={[Style.checkbox, checked && Style.checked]}>
//         {checked && <MaterialIcons name="check" size={18} color="white" />}
//       </View>
//       <Text style={{ fontSize: 16 }}>{label}</Text>
//     </Pressable>
//   );
// }