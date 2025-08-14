/*
Functions to validate text input and convert entered text to proper form 
*/

// convert input to proper case: trim leading/trailing spaces, capitalize first letter of each word
export function toProperCase(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ") // replace multiple spaces with single space
    .split(" ")
    .map(word =>
      word.length > 0
        ? word[0].toUpperCase() + word.slice(1).toLowerCase()
        : ""
    )
    .join(" ");
}

// Determines if text input has proper case
// TODO - remove?
export function isProperCase(input: string): boolean {
   return (input === toProperCase(input) ? true : false)
}

/**
 * Formats a phone number string.
 * - Single number: "0123456789"
 * - Multiple numbers separated by "/": "0123456789/0987654321"
 * - International numbers starting with "+": unchanged -- assume # in valid international format 
 * - 9-digit numbers not starting with 0: prepended with "0"
 * - 10-digit numbers starting with 0:  unchanged
 * - Everything else = Invalid strings: return empty string
 */
export function formatPhoneNumber(str: string): string {
    const trimmed = str.trim();

    if (trimmed.length === 0) return "";

    const slashPos = trimmed.indexOf("/");

    // Handle multiple numbers separated by "/"
    if (slashPos >= 0) {
        const part1 = formatPhoneNumber(trimmed.slice(0, slashPos).trim());
        const part2 = formatPhoneNumber(trimmed.slice(slashPos + 1).trim());
        
        if (part1 && part2) {
            return `${part1}/${part2}`;
        }
        return part1 || part2;
    }

    const firstChar = trimmed[0];

    // International number
    if (firstChar === "+") return trimmed;

    // 10-digit local number starting with 0
    if (trimmed.length === 10 && firstChar === "0") return trimmed;

    // 9-digit local number --> prepend 0
    if (trimmed.length === 9 && firstChar !== "0") return "0" + trimmed;

    // Anything else is invalid
    // TODO what to do with 10 digits, no 0 and 9 digits starts with 0 -- currently return ''
    return ""; // TODO -- handle invalid number differently ??
}

/**
 * 
 * Determines whether entered phone # is valid
 * - Assumes only a single phone number is provided -- multiple numbers separated by '/' invalid
 * - Returns True if valid, else False
 */
export function isValidPhoneNumber(input: string): boolean {
    const invalidSymbols = /[^0-9]/
    const trimmedInput = input.trim()

    // '+' international numbers allowed without further checks
    // TODO - make this more strict in the future - should explicitly validate international format
    if (trimmedInput.startsWith("+")) {
        return trimmedInput.length > 1;
    }

    // False if empty input, or if containts non-numerical characters
    if (!input || trimmedInput === '' || invalidSymbols.test(input)) return false

    
    // phone must be 10 digits and start with 0
    if(trimmedInput.length !== 10) {
        return false
    } else {
        return trimmedInput.startsWith("0")
    }

}