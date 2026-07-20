import { videoAssets } from '@/src/assets/videos/videoAssets';
import { CategorizedMedicalConditions } from '@/src/contexts/CategorizedMedicalConditions';
import careContentData from '@/src/data/careContent.json';

/** A playable source for expo-video: a bundled asset (number) or a local URI. */
export type VideoSource = number | string;

/**
 * An optional age constraint (in months) on a piece of care content.
 * `gte` (≥), `gt` (>), `lte` (≤), `lt` (<). Any subset may be given (lower only, upper only, both).
 */
export interface AgeRange {
  gte?: number;
  gt?: number;
  lte?: number;
  lt?: number;
}

/** Video metadata as authored in careContent.json */
export interface CaregiverVideoMeta {
  id: string;
  title: string;
  description?: string;
  /** When set, the video is only shown for patients whose age (months) satisfies this range. */
  age?: AgeRange;
}

/** A caregiver video ready for the UI: metadata joined to its local file (if available). */
export interface CaregiverVideo extends CaregiverVideoMeta {
  /** Local, offline-playable source; undefined until a file is registered in videoAssets. */
  source?: VideoSource;
}

/**
 * A care-plan step. When age is set, the step is only shown for patients whose age (months)
 * satisfies it; when omitted, the step is always shown. If no age known, age-constrained steps are omitted.
 */
interface CarePlanStep {
  text: string;
  age?: AgeRange;
}

interface ConditionContent {
   // Suggested care-plan steps, in the order they should be shown.
  carePlan: (string | CarePlanStep)[];
  videos: CaregiverVideoMeta[];
}

/**
 * Whether a piece of content should be shown to a patient of the given age.
 * Content with no age constraint always shows.
 */
function inAgeRange(age: AgeRange | undefined, ageInMonths: number | null): boolean {
  if (!age) return true;
  if (ageInMonths === null) return false;
  if (age.gte !== undefined && ageInMonths < age.gte) return false;
  if (age.gt !== undefined && ageInMonths <= age.gt) return false;
  if (age.lte !== undefined && ageInMonths > age.lte) return false;
  if (age.lt !== undefined && ageInMonths >= age.lt) return false;
  return true;
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
 * followed by any condition-specific videos. Videos with an age constraint are only included when the
 * patient's age (in months) satisfies it
 */
export function getVideosForConditions(
  mc: CategorizedMedicalConditions | null | undefined,
  ageInMonths: number | null = null,
): CaregiverVideo[] {
  const sourceKeys = [GENERIC_KEY, ...matchedConditionKeys(mc)];

  const seenVideos = new Set<string>();
  const videos: CaregiverVideo[] = [];
  for (const key of sourceKeys) {
    for (const meta of careContent[key]?.videos ?? []) {
      if (seenVideos.has(meta.id)) continue;
      if (!inAgeRange(meta.age, ageInMonths)) continue;
      seenVideos.add(meta.id);
      videos.push({ ...meta, source: videoAssets[meta.id] });
    }
  }
  return videos;
}

/**
 * Normalize each care-plan step to a CarePlanStep
 * drop those whose `age` the patient falls outside, and flatten to display strings.
 */
function resolveSteps(steps: (string | CarePlanStep)[], ageInMonths: number | null): string[] {
  return steps
    .map(step => (typeof step === 'string' ? { text: step } : step))
    .filter(step => inAgeRange(step.age, ageInMonths))
    .map(step => step.text);
}

/**
 * Suggested care-plan steps grouped by condition (positive first, then suspected).
 * Falls back to the generic plan when no condition matches. Age-specific steps are only included when
 * the patient's age (in months) satisfies the age range
 */
export function getCarePlanForConditions(
  mc: CategorizedMedicalConditions | null | undefined,
  ageInMonths: number | null = null,
): { condition: string; steps: string[] }[] {
  const keys = [GENERIC_KEY, ...matchedConditionKeys(mc)];
  return keys
    .map(condition => ({ condition: condition == "generic" ? "General" : condition, steps: resolveSteps(careContent[condition].carePlan, ageInMonths) }))
    .filter(item => item.steps.length > 0);
}
