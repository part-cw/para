/*
Functions to validate text input and convert entered text to proper form 
*/

import { ValidationResult } from "../components/SearchableDropdown";

export const textErrorMessage:string = 'Text must be 2 characters or more, and can only contain letters, spaces, hyphens, exclamation marks or apostrophes.'


/** 
* convert input to proper case: trim leading/trailing spaces, capitalize first letter of each word 
*/
export function formatText(input: string): string {
  if (input.trim().length < 2) {
    return ''
  }
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

/**
 *  Determines if text input is valid. 
 *  Must contain only allow letters, spaces, hyphen, exclamation marks, or apostrophe, and be 2 or more characters
 */ 
export function isValidTextFormat(input: string): boolean {
    console.log('validating input...', input)
    if (!input) return true;
    if (!input.trim()) return false;

    const trimmed = input.trim();
    const regex = /^[A-Za-z\s'!-]+$/;

  return trimmed.length >= 2 && regex.test(trimmed);
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

  // Phone number validator function - wraps existing utils with dropdown interface
    export const validatePhoneNumber = (value: string): ValidationResult => {
        const trimmed = value.trim();
        
        // Empty is okay since phone is optional
        if (!trimmed) {
            return { isValid: true };
        }

        if (!isValidPhoneNumber(trimmed)) {
            return {
                isValid: false,
                errorMessage: 'Invalid phone number format. Use format: 0xxxxxxxxx (10 digits starting with 0) or +xxx... (international)'
            };
        }

        return {
            isValid: true,
            formattedValue: formatPhoneNumber(trimmed)
        };
    };