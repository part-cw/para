import { CAREGIVER_VIDEO_WEB_URL } from '@/src/assets/videos/videoAssets';
import { CaregiverVideo } from '@/src/utils/careContentLoader';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';

type Props = {
  videos: CaregiverVideo[];
};

/**
 * QR code linking to the standalone offline caregiver-video web player (caregiver-web/), encoding
 * the given videos' ids. Shown wherever caregiver videos are offered (care plan, risk display and
 * the videos modal) so a caregiver can open the same playlist on a separate tablet.
 *
 * Renders nothing unless CAREGIVER_VIDEO_WEB_URL is configured (see videoAssets.ts) and there is at
 * least one video.
 */
export default function CaregiverVideosQR({ videos }: Props) {
  const { colors } = useTheme();

  const url = useMemo(() => {
    if (!CAREGIVER_VIDEO_WEB_URL || videos.length === 0) return null;
    const ids = videos.map(v => v.id).join(',');
    return `${CAREGIVER_VIDEO_WEB_URL}?ids=${encodeURIComponent(ids)}`;
  }, [videos]);

  if (!url) return null;

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: colors.primary }]}>Watch on the caregiver tablet</Text>
      <Text style={styles.caption}>Scan this code with the caregiver tablet to open these videos.</Text>
      <View style={styles.qrWrapper}>
        <QRCode value={url} size={180} color="#000000" backgroundColor="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f6f8fa',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  caption: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
});
