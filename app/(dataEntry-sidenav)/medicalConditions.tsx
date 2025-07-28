import DebugStack from '@/components/DebugStack';
import PaginationButton from '@/components/PaginationButton';
import { GlobalStyles as Styles } from '@/themes/styles';
import { router } from 'expo-router';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MedicalConditionsScreen() {
  
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <DebugStack/>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                
            </ScrollView>

            {/* Pagination controls */}
            {/* TODO - make sure this is the correct way to navigate to different screens */}
            <View style={Styles.paginationButtonContainer}>
                <PaginationButton
                    // TODO - add alerts on press ??
                    onPress={() => {
                        router.push('../(dataEntry-sidenav)/admissionClinicalData')
                    }}
                    isNext={ false }
                    label='Previous'
                />
                <PaginationButton
                    // TODO - add alerts on press ??
                    onPress={() => {
                        router.push('../(dataEntry-sidenav)/vhtReferral')
                    }}
                    isNext={ true }
                    label='Next'
                />
            </View>
        </SafeAreaView>
    );
}
