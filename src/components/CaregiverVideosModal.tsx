import { CaregiverVideo } from '@/src/utils/careContentLoader';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, useTheme } from 'react-native-paper';
import CaregiverVideosQR from './CaregiverVideosQR';

type Props = {
  visible: boolean;
  videos: CaregiverVideo[];
  onRequestClose: () => void;
};

/**
 * Shared caregiver-education video surface used by riskDisplay, the care plan page and
 * PatientCard. Lists the videos matched to a patient's conditions and plays the selected
 * one inline (offline) via expo-video. Videos whose local file has not been added yet
 * still appear, but show a "not yet available" placeholder instead of a player.
 */
export default function CaregiverVideosModal({ visible, videos, onRequestClose }: Props) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<CaregiverVideo | null>(null);

  const player = useVideoPlayer(null, p => {
    p.loop = false;
  });

  // Load/clear the player when the selected video changes.
  useEffect(() => {
    let cancelled = false;
    if (selected?.source != null) {
      player.replaceAsync(selected.source)
        .then(() => { if (!cancelled) player.play(); })
        .catch(() => { if (!cancelled) console.warn('Failed to load caregiver video'); });
    } else {
      player.pause();
    }
    return () => { cancelled = true; };
  }, [selected, player]);

  // Reset to the list whenever the modal is closed.
  useEffect(() => {
    if (!visible) setSelected(null);
  }, [visible]);

  const handleClose = () => {
    setSelected(null);
    onRequestClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={Styles.modalOverlay}>
        <View style={[Styles.modalContentWrapper, styles.wrapper]}>
          <Text style={[Styles.modalHeader, { color: colors.primary }]}>
            Caregiver Education Videos
          </Text>

          {videos.length === 0 ? (
            <Text style={Styles.modalText}>
              No videos are available for this patient&apos;s conditions.
            </Text>
          ) : selected ? (
            // ---- Detail / player view ----
            <View>
              {selected.source != null ? (
                <VideoView
                  player={player}
                  style={styles.video}
                  nativeControls
                  fullscreenOptions={{ enable: true }}
                  contentFit="contain"
                />
              ) : (
                <View style={[styles.video, styles.unavailable]}>
                  <MaterialIcons name="videocam-off" size={40} color="#fff" />
                  <Text style={styles.unavailableText}>Video not yet available</Text>
                </View>
              )}

              <Text style={styles.detailTitle}>{selected.title}</Text>
              {!!selected.description && (
                <Text style={styles.detailDescription}>{selected.description}</Text>
              )}

              <Button
                mode="text"
                icon="chevron-left"
                textColor={colors.primary}
                onPress={() => setSelected(null)}
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
              >
                Back to videos
              </Button>
            </View>
          ) : (
            // ---- List view ----
            <>
              <ScrollView style={{ maxHeight: 320 }}>
                {videos.map(video => (
                  <TouchableOpacity
                    key={video.id}
                    style={styles.row}
                    onPress={() => setSelected(video)}
                  >
                    <MaterialIcons name="play-circle-outline" size={28} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{video.title}</Text>
                      {!!video.description && (
                        <Text style={styles.rowDescription}>{video.description}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <CaregiverVideosQR videos={videos} />
            </>
          )}

          <Button
            mode="contained"
            buttonColor={colors.primary}
            textColor={colors.onPrimary}
            onPress={handleClose}
            style={{ marginTop: 20 }}
          >
            Close
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '90%',
    maxWidth: 480,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  unavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  unavailableText: {
    color: '#fff',
    fontSize: 14,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  detailDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});
