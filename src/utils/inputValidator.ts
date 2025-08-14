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