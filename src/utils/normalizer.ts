
export function normalizeBoolean(input: boolean | number | string): boolean {
    if (typeof input === 'number') return numberToBoolean(input)

    if (typeof input === 'string') return stringToBoolean(input);

    // Default: typeof input is boolean
    return input;

} 

export const stringToBoolean = (input: string): boolean => {
    const lower = input.toLowerCase();
    const truthy = ['1', 'yes', 'true', 'positive'];
    const falsy = ['0', 'no', 'false', 'negative'];

    if (truthy.includes(lower)) return true;
    if (falsy.includes(lower)) return false;

    throw new Error(
        "String boolean invalid. Input must be one of '1'/'0', 'true'/'false', 'yes'/'no', or 'positive'/'negative'."
    );
}

export const numberToBoolean = (input: number): boolean => {
    if (input !== 0 && input !== 1) 
        throw new Error('Invalid numeric boolean. Input must be either 0 or 1');
    return input === 1;
}

/**
 * Given boolean or string booleans (ie 'true', 'false') returns either 'yes' or 'no'.
 * If input is empty string, returns '', otherwise throw error.
 */
export const convertToYesNo = (input: boolean | string) => {
    if (input === undefined) return '';
    
    if (typeof input === 'string') {
        if (input === '') return ''

        const truthy = ['true', 'yes'];
        const falsy = ['false', 'no'];

        if (truthy.includes(input.toLowerCase())) return 'yes';
        if (falsy.includes(input.toLowerCase())) return 'no';

        throw Error ('invalid input')
    }
    
    // input is boolean 
    return input ? 'yes' : 'no';
}