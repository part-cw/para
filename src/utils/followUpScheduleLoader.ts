import followUpScheduleData from '@/src/data/followUpSchedule.json';

// Keys are risk categories as produced by the risk model ('Low' | 'Moderate' | 'High' | 'Very High').
const followUpSchedule = followUpScheduleData as Record<string, number[]>;

function formatDayList(days: number[]): string {
  if (days.length === 1) return `${days[0]}`;
  if (days.length === 2) return `${days[0]} and ${days[1]}`;
  return `${days.slice(0, -1).join(', ')}, and ${days[days.length - 1]}`;
}

/**
 * Text describing follow-up based on schedule,
 * e.g. "so community follow-up scheduled for 2, 7, and 14 days after discharge".
 * Returns '' for an unknown/undefined category.
 */
export function getFollowUpScheduleText(riskCategory: string | undefined): string {
  if (!riskCategory || !(riskCategory in followUpSchedule)) return '';
  const days = followUpSchedule[riskCategory];
  if (days.length === 0) return 'so no community follow-up scheduled';
  return `so community follow-up scheduled for ${formatDayList(days)} days after discharge`;
}

/**
 * Concrete calendar follow-up dates for a category, each computed by adding the day offset to
 * today's date and formatted like "Jul 16". Empty when there is no follow-up.
 */
export function getFollowUpDates(riskCategory: string | undefined, from: Date = new Date()): string[] {
  const days = riskCategory && riskCategory in followUpSchedule ? followUpSchedule[riskCategory] : [];
  return days.map(offset => {
    const date = new Date(from);
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
}
