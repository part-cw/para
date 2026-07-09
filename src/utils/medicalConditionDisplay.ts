/**
 * Malaria and meningitis/encephalitis are confirmed via tests that return a
 * positive/negative result, so their selections are shown to the user with clinical
 * "diagnosis" wording. The value we persist is the canonical 'Yes'/'No' (the same as
 * every other condition); these helpers convert between the stored value and the
 * diagnosis-worded display text.
 */
const diagnosisDisplayToValue: Record<string, string> = {
    'Yes - positive diagnosis': 'Yes',
    'No - negative diagnosis': 'No',
};

/** Canonical value to persist for a diagnosis-worded selection (e.g. 'Yes - positive diagnosis' -> 'Yes'). */
export const toStoredConditionValue = (displayValue: string): string =>
    diagnosisDisplayToValue[displayValue] ?? displayValue;

/** Diagnosis-worded display text for a stored Malaria/Meningitis value (e.g. 'Yes' -> 'Yes - positive diagnosis'). */
export const toDisplayConditionValue = (storedValue?: string): string | undefined =>
    Object.keys(diagnosisDisplayToValue).find(
        (display) => diagnosisDisplayToValue[display] === storedValue
    ) ?? storedValue;
