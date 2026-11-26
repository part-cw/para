/**
 * Displays name as 'Firstname Other Surname' OR 'Firstname Surname'
 */
export function formatName(firstName: string, surname: string, othername?: string): string {
    if (othername) {
        return `${firstName} ${othername} ${surname}`
    }

    return `${firstName} ${surname}`
}

export function displayDob(dob?: Date, yob?: string, mob?: string, approxAgeInYears?: string): string {
    if (dob) {
        return formatAsLocalDateString(dob);
    } else if (yob && mob) {
        return `${mob} ${yob}`;
    } else if (approxAgeInYears) {
        return `${approxAgeInYears} years old`;
    }
    return 'Not provided';
};

export const formatChronicIllness = (items: string[] = []): string => {
        if (!items || items.length === 0) return 'Not provided';

        // Make sure 'None' and 'Unsure' aren't included in the list if HIV is present; this occurs for patients > 6 months 
        // when a positive HIV status is recorded on Clinical Data page but "None" or "Unsure" is selected for other chronic conditions.
        const filtered_items = items.includes('HIV')
            ? items.filter(item => item !== 'unsure' && item !== 'none')
            : items;

        // Capitalize the first letter of each illness and normalize spacing
        const formatted = filtered_items.map(item => {
            const trimmed = item.trim();
            if (!trimmed) return null;

            // Capitalize only the first letter (including after "other:")
            const formattedText =
            trimmed.length > 0
                ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
                : trimmed;

            return `• ${formattedText}`;
        }).filter(Boolean);

        return formatted.join('\n');
};

export const formatOtherChronicIllness = (otherIllness: string | undefined): string => {
    if (!otherIllness || otherIllness.trim() === '') return 'Not provided';
    
    // Split by comma and format as a list
    const illnesses = otherIllness.split(',').map(item => item.trim()).filter(Boolean);
    return illnesses.join(', ');
};

export const getOtherChronicIllnessList = (otherIllness: string | undefined): string[] => {
    if (!otherIllness || otherIllness.trim() === '') return [];
    return otherIllness.split(',').map(item => item.trim()).filter(Boolean);
};

export const capitalizeFirstLetter = (input: string) => {
  if (typeof input !== 'string' || input.length === 0) {
    return ''; // Handles empty strings or non-string input
  }
  return input.charAt(0).toUpperCase() + input.slice(1);
}

 // Helper function to display a Date object as a local date string in YYYY-MM-DD format
export const formatAsLocalDateString = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
