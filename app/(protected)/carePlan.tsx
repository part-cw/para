import CaregiverVideosModal from '@/src/components/CaregiverVideosModal';
import { CategorizedMedicalConditions } from '@/src/contexts/CategorizedMedicalConditions';
import { useStorage } from '@/src/contexts/StorageContext';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { getCarePlanForConditions, getVideosForConditions } from '@/src/utils/careContentLoader';
import { getFollowUpDates, getFollowUpScheduleText } from '@/src/utils/followUpScheduleLoader';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, useTheme } from 'react-native-paper';

export default function CarePlan() {
  const { colors } = useTheme();
  const { storage } = useStorage();

  const params = useLocalSearchParams();
  const patientId = params.patientId as string;
  const patientName = params.patientName as string;
  const riskCategory = params.riskCategory as string | undefined;
  const paramConditions: CategorizedMedicalConditions | null =
    params.medicalConditions ? JSON.parse(params.medicalConditions as string) : null;
  const ageParam = params.ageInMonths as string | undefined;

  const [conditions, setConditions] = useState<CategorizedMedicalConditions | null>(paramConditions);
  const [ageInMonths, setAgeInMonths] = useState<number | null>(ageParam ? Number(ageParam) : null);
  const [showVideos, setShowVideos] = useState(false);

  // Fall back to loading conditions or age from storage if they weren't passed in.
  useEffect(() => {
    if (!conditions && patientId) {
      storage.getCategorizedMedicalConditions(patientId)
        .then(setConditions)
        .catch(() => console.warn(`Could not load conditions for care plan (${patientId})`));
    }
    if (ageInMonths === null && patientId) {
      storage.getPatient(patientId)
        .then(patient => { if (patient) setAgeInMonths(patient.ageInMonths ?? null); })
        .catch(() => console.warn(`Could not load age for care plan (${patientId})`));
    }
  }, [patientId]);

  const carePlan = useMemo(() => getCarePlanForConditions(conditions, ageInMonths), [conditions, ageInMonths]);
  const videos = useMemo(() => getVideosForConditions(conditions, ageInMonths), [conditions, ageInMonths]);
  const followUpText = getFollowUpScheduleText(riskCategory);
  const followUpDates = getFollowUpDates(riskCategory);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={[Styles.pageHeaderContainer]}>
          <Text style={[Styles.pageHeaderTitle]}>Suggested Care Plan</Text>
        </View>

        <View style={{ padding: 20 }}>
          {!!patientName && (
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
              {patientName}
            </Text>
          )}
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: colors.primary }}>
              Recommendations for the Clinician
          </Text>
          <Text style={{ fontSize: 13, fontStyle: 'italic', color: '#666', marginBottom: 16 }}>
            Suggested actions based on this patient&apos;s recorded conditions. Use clinical judgement.
          </Text>

          {carePlan.map(group => (
            <View key={group.condition} style={styles.card}>
              <Text style={[styles.cardTitle, { color: colors.primary }]}>{group.condition}</Text>
              {group.steps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <MaterialIcons
                    name="check-circle"
                    size={14}
                    color={colors.primary}
                    style={{ marginRight: 8, marginTop: 4 }}
                  />
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          ))}

          {!!followUpText && (
            <>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                Community Follow-up
              </Text>
              <View style={[styles.card, { borderLeftColor: 'black' }]}>
                <Text style={[styles.cardTitle, { color: 'black' }]}>Follow-up Schedule</Text>
                <Text style={styles.stepText}>
                  {riskCategory} Risk for post-discharge risk mortality {followUpText}.
                </Text>
                {followUpDates.length > 0 && (
                  <Text style={[styles.stepText, { marginTop: 6 }]}>
                    Follow-up date{followUpDates.length > 1 ? 's' : ''}: {followUpDates.join(', ')}
                  </Text>
                )}
              </View>
            </>
          )}

          {videos.length > 0 && (
            <Button
              style={{ alignSelf: 'center', marginTop: 12 }}
              mode="elevated"
              icon="play-circle-outline"
              buttonColor={colors.tertiary}
              textColor={colors.onTertiary}
              onPress={() => setShowVideos(true)}
            >
              Watch caregiver videos
            </Button>
          )}

          <Button
            style={{ alignSelf: 'center', marginTop: 20 }}
            mode="elevated"
            buttonColor={colors.primary}
            textColor={colors.onPrimary}
            onPress={() => router.replace('/patientRecords')}
          >
            Patient Records
          </Button>
        </View>
      </ScrollView>

      <CaregiverVideosModal
        visible={showVideos}
        videos={videos}
        onRequestClose={() => setShowVideos(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f6f8fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  stepText: {
    fontSize: 15,
    lineHeight: 21,
    flexShrink: 1,
  },
});
