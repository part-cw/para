import type { VideoSource } from '@/src/utils/careContentLoader';

/**
 * Maps a caregiver-video id (from src/data/careContent.json) to its bundled,
 * offline-playable .mp4 file. Any id missing from this map is
 * treated by the UI as "video not yet available" (a placeholder is shown, not a player).
 * These rows are commented out so that the public repo ships without the .mp4 files.
 */
export const videoAssets: Record<string, VideoSource> = {
  // 'breastfeeding-english': require('@/src/assets/videos/breastfeeding-english.mp4'),
  // 'hygiene-english': require('@/src/assets/videos/hygiene-english.mp4'),
  // 'immunizations-english': require('@/src/assets/videos/immunizations-english.mp4'),
  // 'medication-english': require('@/src/assets/videos/medication-english.mp4'),
  // 'mosquito-net-english': require('@/src/assets/videos/mosquito-net-english.mp4'),
  // 'nutrition-english': require('@/src/assets/videos/nutrition-english.mp4'),
  // 'seeking-care-english': require('@/src/assets/videos/seeking-care-english.mp4'),
  // 'anaemia-english': require('@/src/assets/videos/anaemia-english.mp4'),
  // 'feeding-english': require('@/src/assets/videos/feeding-english.mp4'),
  // 'malaria-english': require('@/src/assets/videos/malaria-english.mp4')
};

/**
 * Base URL of the standalone offline caregiver-video web player (see caregiver-web/), used to build
 * the QR code shown on the care plan page. When empty, the app simply hides the QR code.
 * Example: 'https://your-host.example/caregiver-web/'
 */
export const CAREGIVER_VIDEO_WEB_URL = '';
