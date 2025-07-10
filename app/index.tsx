// import { Text, View } from "react-native";

// export default function Index() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Text>Edit app/index.tsx to edit this screen.</Text>
//     </View>
//   );
// }

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync(); // Prevent auto-hide

export default function Layout() {
  useEffect(() => {
    const hideSplash = async () => {
      // delay for testing visuals -- TODO: remove
      await new Promise(resolve => setTimeout(resolve, 10000));

      await SplashScreen.hideAsync(); // Hide when ready
    };

    hideSplash();
  }, []);

  return <Stack />;
}