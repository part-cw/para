import { isValidNumericFormat } from "./inputValidator";

export function validateMuac(input: string): { isValid: boolean; errorMessage: string } {
    if (!isValidNumericFormat(input)){
        return { isValid: false, errorMessage: 'Invalid numeric input' };
    }

    const muac = Number(input)
    if (muac < 50) {
        return { 
            isValid: false, 
            errorMessage: 'MUAC is in millimeters. A value below 50 mm is not valid.' 
        };
    }

    if (muac < 100 || muac > 160) {
        return { 
            isValid: false, 
            errorMessage: `MUAC outside acceptable range of 100 to 160 mm. Are you sure MUAC is ${muac} mm?` 
        };
    }

    return { isValid: true, errorMessage: '' };
}