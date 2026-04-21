import { useAuth } from "@/src/contexts/AuthContext";
import { router } from "expo-router";
import { View } from "react-native";
import { Button, useTheme } from 'react-native-paper';


export default function HomeScreen() {
  const { colors } = useTheme();
  const { currentUser } = useAuth();


  return (
    <>
      <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50}}>
        {currentUser?.activeRole === 'user' && (
        <>
          <Button 
            style={{ alignSelf: 'center', marginVertical: 10 }}
            buttonColor={colors.primary} 
            textColor={colors.onPrimary} 
            icon= 'plus'
            mode="elevated" 
            onPress={() => {router.push('/(protected)/(admission-sidenav)/patientInformation')}}
          >
            Add Patient
          </Button>

          <Button 
            style={[{ alignSelf: 'center' }, {marginVertical: 10}]}
            buttonColor={colors.primary} 
            textColor={colors.onPrimary} 
            icon= 'account-group'
            mode="elevated" 
            onPress={() => {router.push('/(protected)/patientRecords')}}
          >
            Patient Records
          </Button>

          <Button 
            style={[{ alignSelf: 'center' }, {marginVertical: 10}]}
            buttonColor={colors.primary} 
            textColor={colors.onPrimary} 
            icon= 'folder'
            mode="elevated" 
            onPress={() => {router.push('/(protected)/drafts')}}
          >
            Resume Drafts
          </Button>
        </>
        )}

        {/* Admin-only button - for testing */}
        {currentUser?.activeRole === 'admin' && (
          <>
            <Button 
              style={{ alignSelf: 'center', marginVertical: 10 }}
              buttonColor={colors.primary} 
              textColor={colors.onPrimary} 
              icon='plus'
              mode="elevated" 
              onPress={() => router.push('/(protected)/createUser')}
            >
              Create User
            </Button>

            <Button 
              style={{ alignSelf: 'center', marginVertical: 10 }}
              buttonColor={colors.secondary} 
              textColor={colors.onSecondary} 
              icon='cog'
              mode="elevated" 
              onPress={() => router.push('/(protected)/(appbar-menu)/settings')}
            >
              Settings
            </Button>
          </>
        )}
      </View>
    </>
  );
}