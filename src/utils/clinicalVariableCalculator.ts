
//  * TODO used for WAZ score calculations -- take floor (use months completed)
//  * TODO for model calculation - round to 1 decimal place

import ranges from '../data/model_input_ranges.json';

type ValidationResult = {
  isValid: boolean;
  errorMessage?: string;
  warningMessage?: string;
};


export function validateMuac(input: string): ValidationResult {
    const muac = Number(input)

    // Find the config for MUAC
    const muacConfig = ranges.find(r => r.variable === "muac");
    if (!muacConfig) {
        throw new Error("MUAC config not found in model_input_ranges.json");
    }

    const { hardMin, hardMax, softMin, softMax } = muacConfig;


    if (hardMin && (muac < hardMin)) {
        return { 
            isValid: false, 
            errorMessage: `MUAC is in millimeters. A value below ${hardMin} mm is not valid.`,
            warningMessage: ''  
        };
    }

      if (hardMax && muac > hardMax) {
        return { 
            isValid: false, 
            errorMessage: `MUAC is in millimeters. A value above ${hardMax} mm is not valid.`,
            warningMessage: '' 
        };
    }

    if ((softMin && muac < softMin) || (softMax && muac > softMax)) {
        return { 
            isValid: false, 
            errorMessage: '',
            warningMessage: `MUAC outside acceptable range of ${softMin}-${softMax} mm. Are you sure this is correct?` 
        };
    }

    return { isValid: true, errorMessage: '', warningMessage: ''  };
}

export function validateTemperatureRange(input: string): ValidationResult {
    const temperature = Number(input)

    const tempConfig = ranges.find(r => r.variable === "temperature");
    if (!tempConfig) {
        throw new Error("Temperature config not found in model_input_ranges.json");
    }

    const { hardMin, hardMax, softMin } = tempConfig;

    if ((hardMin && temperature < hardMin) || (hardMax && temperature > hardMax)) {
        return { 
            isValid: false, 
            errorMessage: `Temperature is outside the valid range of ${hardMin}-${hardMax}°C. Enter a new value.`,
            warningMessage: '' 
        };
    }

      if (softMin && temperature < softMin) {
        return { 
            isValid: false, 
            errorMessage: '',
            warningMessage: `Temperature is below the normal range. Are you sure this is correct?` 
        };
    }

    return { isValid: true, errorMessage: '', warningMessage: '' };
}

export function calculateWAZ(age: number, sex: string): number {
    // take floor of age in months
    // look up in JSON
    return 0; //stub
}