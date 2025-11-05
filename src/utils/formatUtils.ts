
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