import { CategorizedMedicalConditions } from '@/src/contexts/CategorizedMedicalConditions';
import { getCarePlanForConditions, getVideosForConditions } from '../careContentLoader';

const mc = (positive: string[] = [], suspected: string[] = []): CategorizedMedicalConditions => ({
  positive,
  suspected,
});

// The generic (non-age specific) videos, in the order authored in careContent.json.
const GENERIC_VIDEO_IDS = [
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

    it('returns only the generic videos when no condition matches and no age given', () => {
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

    describe('age-gated breastfeeding video (generic, under 18 months)', () => {
      it('is listed first for a patient under 18 months', () => {
        const videos = getVideosForConditions(mc([]), 10);
        expect(videos[0].id).toBe('breastfeeding-english');
        expect(videos.map(v => v.id)).toEqual(['breastfeeding-english', ...GENERIC_VIDEO_IDS]);
      });

      it('is excluded at exactly 18 months (upper bound is exclusive) and beyond', () => {
        expect(getVideosForConditions(mc([]), 18).map(v => v.id)).toEqual(GENERIC_VIDEO_IDS);
        expect(getVideosForConditions(mc([]), 24).map(v => v.id)).toEqual(GENERIC_VIDEO_IDS);
      });

      it('is excluded when age is unknown (null)', () => {
        expect(getVideosForConditions(mc([]), null).map(v => v.id)).toEqual(GENERIC_VIDEO_IDS);
      });

      it('appears exactly once for a Sick Young Infant under 18 months (via generic only)', () => {
        const ids = getVideosForConditions(mc(['Sick Young Infant']), 3).map(v => v.id);
        expect(ids.filter(id => id === 'breastfeeding-english')).toHaveLength(1);
      });
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

    it('always includes age-less steps regardless of age', () => {
      for (const age of [null, 1, 12, 60]) {
        const steps = getCarePlanForConditions(mc(['Pneumonia']), age)[0].steps;
        expect(steps).toContain('Recommend completing medication.');
      }
    });

    describe('age-banded diarrhea zinc dose', () => {
      const zincSteps = (age: number | null) =>
        getCarePlanForConditions(mc(['Diarrhea (Acute)']), age)[0].steps.filter(s => /zinc/i.test(s));

      it('always shows the ORS step', () => {
        for (const age of [null, 1, 4, 9]) {
          const steps = getCarePlanForConditions(mc(['Diarrhea (Acute)']), age)[0].steps;
          expect(steps.some(s => /ORS/.test(s))).toBe(true);
        }
      });

      it('gives the 10 mg dose from 2 to 6 months, inclusive of 6', () => {
        expect(zincSteps(4)).toEqual([expect.stringMatching(/10 mg/)]);
        expect(zincSteps(6)).toEqual([expect.stringMatching(/10 mg/)]);
      });

      it('gives the 20 mg dose only over 6 months', () => {
        expect(zincSteps(7)).toEqual([expect.stringMatching(/20 mg/)]);
        expect(zincSteps(24)).toEqual([expect.stringMatching(/20 mg/)]);
      });

      it('gives no zinc step under 2 months or when age is unknown', () => {
        expect(zincSteps(1)).toHaveLength(0);
        expect(zincSteps(null)).toHaveLength(0);
      });

      it('behaves the same for persistent diarrhea', () => {
        const steps = getCarePlanForConditions(mc(['Diarrhea (Persistent)']), 4)[0].steps.filter(s => /zinc/i.test(s));
        expect(steps).toEqual([expect.stringMatching(/10 mg/)]);
      });
    });
  });
});
