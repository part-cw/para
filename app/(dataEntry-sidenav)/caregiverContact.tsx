import DebugStack from '@/components/DebugStack';
import PaginationControls from '@/components/PaginationControls';
import { router } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CaregiverContactScreen() {
  
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <DebugStack/>
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