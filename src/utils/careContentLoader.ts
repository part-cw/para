import { videoAssets } from '@/src/assets/videos/videoAssets';
import { CategorizedMedicalConditions } from '@/src/contexts/CategorizedMedicalConditions';
import careContentData from '@/src/data/careContent.json';

/** A playable source for expo-video: a bundled asset (number) or a local URI. */
export type VideoSource = number | string;

/** Video metadata as authored in careContent.json */
export interface CaregiverVideoMeta {
  id: string;
  title: string;
  description?: string;
}

/** A caregiver video ready for the UI: metadata joined to its local file (if available). */
export interface CaregiverVideo extends CaregiverVideoMeta {
  /** Local, offline-playable source; undefined until a file is registered in videoAssets. */
  source?: VideoSource;
}

interface ConditionContent {
  /** Suggested care-plan steps, in the order they should be shown. */
  carePlan: string[];
  videos: CaregiverVideoMeta[];
}

 // Keys are targeted medical conditions from storage.getCategorizedMedicalConditions()
const careContent = careContentData as Record<string, ConditionContent>;

const GENERIC_KEY = 'generic';

/**
 * The distinct matched condition names for a patient, positive first then suspected,
 * that have an entry in careContent.
 */
function matchedConditionKeys(mc: CategorizedMedicalConditions | null | undefined): string[] {
  if (!mc) return [];
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const name of [...(mc.positive ?? []), ...(mc.suspected ?? [])]) {
    if (!name || seen.has(name)) continue;
    seen.add(name);
    if (careContent[name]) keys.push(name);
  }
  return keys;
}

/**
 * Caregiver education videos for a patient. The generic videos are shown for every patient and listed first,
 * followed by any condition-specific videos.
 */
export function getVideosForConditions(mc: CategorizedMedicalConditions | null | undefined): CaregiverVideo[] {
  const sourceKeys = [GENERIC_KEY, ...matchedConditionKeys(mc)];

  const seenVideos = new Set<string>();
  const videos: CaregiverVideo[] = [];
  for (const key of sourceKeys) {
    for (const meta of careContent[key]?.videos ?? []) {
      if (seenVideos.has(meta.id)) continue;
      seenVideos.add(meta.id);
      videos.push({ ...meta, source: videoAssets[meta.id] });
    }
  }
  return videos;
}

/**
 * Suggested care-plan steps grouped by condition (positive first, then suspected).
 * Falls back to the generic plan when no condition matches.
 */
export function getCarePlanForConditions(mc: CategorizedMedicalConditions | null | undefined): { condition: string; steps: string[] }[] {
  const keys = matchedConditionKeys(mc);
  if (keys.length === 0) {
    return [{ condition: 'General care', steps: careContent[GENERIC_KEY].carePlan }];
  }
  return keys.map(condition => ({ condition, steps: careContent[condition].carePlan }));
}
