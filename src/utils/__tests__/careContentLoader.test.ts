import { CategorizedMedicalConditions } from '@/src/contexts/CategorizedMedicalConditions';
import { getCarePlanForConditions, getVideosForConditions } from '../careContentLoader';

const mc = (positive: string[] = [], suspected: string[] = []): CategorizedMedicalConditions => ({
  positive,
  suspected,
});

// The generic videos shown for every patient, in the order authored in careContent.json.
const GENERIC_VIDEO_IDS = [
  'breastfeeding-english',
  'hygiene-english',
  'immunizations-english',
  'medication-english',
  'mosquito-net-english',
  'nutrition-english',
  'seeking-care-english',
];

describe('careContentLoader', () => {
  describe('getVideosForConditions', () => {
    it('always lists the generic videos first, then condition-specific ones', () => {
      const videos = getVideosForConditions(mc(['Pneumonia']));
      expect(videos.slice(0, GENERIC_VIDEO_IDS.length).map(v => v.id)).toEqual(GENERIC_VIDEO_IDS);
      expect(videos.map(v => v.id)).toContain('pneumonia');
    });

    it('does not list the same video twice when shared across conditions', () => {
      // Both diarrhea entries reference the same video id.
      const videos = getVideosForConditions(mc(['Diarrhea (Acute)', 'Diarrhea (Persistent)']));
      const ids = videos.map(v => v.id);
      expect(ids.filter(id => id === 'diarrhea')).toHaveLength(1);
    });

    it('returns only the generic videos when no condition matches', () => {
      expect(getVideosForConditions(mc([], [])).map(v => v.id)).toEqual(GENERIC_VIDEO_IDS);
      expect(getVideosForConditions(mc(['Some Free-Text Illness'])).map(v => v.id)).toEqual(GENERIC_VIDEO_IDS);
    });

    it('returns only the generic videos for null/undefined conditions', () => {
      expect(getVideosForConditions(null).map(v => v.id)).toEqual(GENERIC_VIDEO_IDS);
      expect(getVideosForConditions(undefined).map(v => v.id)).toEqual(GENERIC_VIDEO_IDS);
    });

    it('joins each video to its registry source (undefined when no .mp4)', () => {
      const generic = getVideosForConditions(null).find(v => v.id === 'hygiene-english');
      expect(generic).toBeDefined();
      expect(generic).toHaveProperty('source');
    });
  });

  describe('getCarePlanForConditions', () => {
    it('returns care-plan steps grouped by matched condition', () => {
      const plan = getCarePlanForConditions(mc(['Pneumonia']));
      expect(plan).toHaveLength(1);
      expect(plan[0].condition).toBe('Pneumonia');
      expect(plan[0].steps[0]).toMatch(/completing medication/i);
    });

    it('orders positive conditions before suspected', () => {
      const plan = getCarePlanForConditions(mc(['Malaria'], ['Sepsis']));
      expect(plan.map(g => g.condition)).toEqual(['Malaria', 'Sepsis']);
    });

    it('Only includes once a condition appearing in both positive and suspected', () => {
      const plan = getCarePlanForConditions(mc(['Pneumonia'], ['Sepsis', 'Pneumonia']));
      expect(plan).toHaveLength(2);
      expect(plan[0].condition).toBe('Pneumonia');
      expect(plan[1].condition).toBe('Sepsis');
    });

    it('falls back to a generic plan when no condition matches', () => {
      const plan = getCarePlanForConditions(mc([], []));
      expect(plan).toHaveLength(1);
      expect(plan[0].condition).toBe('General care');
      expect(plan[0].steps.length).toBeGreaterThan(0);
    });
  });
});
