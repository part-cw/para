
/**
 * remove timestamp from date string. Date displayed in format of YYYY-MM-DD
 */
export function formatDateString(date: string): string {
    return date.split('T')[0];
}

/**
 * Displays name as 'Firstname Other Surname' OR 'Firstname Surname'
 */
export function formatName(firstName: string, surname: string, othername?: string): string {
    if (othername) {
        return `${firstName} ${othername} ${surname}`
    }

    return `${firstName} ${surname}`
}


export function displayDob(dob?: string, yob?: string, mob?: string): string {
    if (dob) {
        return formatDateString(dob);
    } else if (yob && mob) {
        return `${mob} ${yob}`;
    } 
    return 'Not provided';
};

export const formatChronicIllness = (items: string[] = []): string => {
        if (!items || items.length === 0) return 'Not provided';

        // Capitalize the first letter of each illness and normalize spacing
        const formatted = items.map(item => {
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