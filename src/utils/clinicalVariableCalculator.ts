
//  * TODO used for WAZ score calculations -- take floor (use months completed)
//  * TODO for model calculation - round to 1 decimal place

import config from '../data/model_input_ranges.json';

type ValidationResult = {
  isValid: boolean;
  errorMessage?: string;
  warningMessage?: string;
};


export function validateMuac(input: string): ValidationResult {
    const muac = Number(input)

    // Find the config for MUAC
    const muacConfig = config.find(r => r.variable === "muac");
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

    const tempConfig = config.find(r => r.variable === "temperature");
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

export function getMuacStatus(isUnderSixMonths: boolean, muacString: string): string {
    const muacConfig = config.find(c => c.variable === "muac");
    if (!muacConfig) {
        throw new Error("MUAC config not found in model_input_ranges.json");
    }

    // find rules that apply to patient's age range (under 6 months vs 6 months+)
    const rules = muacConfig.rules?.find(r => r.isUnderSixMonths === isUnderSixMonths)
    if (!rules) {
        throw new Error ("Could not find rules for MUAC")
    }

    const muac = Number(muacString);
    if (muac >= rules.severe.min && muac <= rules.severe.max) return "severe";
    if (muac >= rules.moderate.min && muac <= rules.moderate.max) return "moderate";
    if (muac >= rules.normal.min && muac <= rules.normal.max) return "good";

    return 'invalid';
}

export function calculateWAZ(age: number, sex: string): number {
    // take floor of age in months
    // look up in JSON
    return 0; //stub
}

export function validateRespiratoryRange(input: string): ValidationResult {
    const rrate = Number(input)

    const rrateConfig = config.find(c => c.variable === "rrate");
    if (!rrateConfig) {
        throw new Error("Respiratory rate config not found in model_input_ranges.json");
    }

    const { hardMin, hardMax, softMin, softMax } = rrateConfig;

    if ((hardMin && rrate < hardMin) || (hardMax && rrate > hardMax)) {
        return { 
            isValid: false, 
            errorMessage: `Respiratory rate is outside the valid range of ${hardMin} to ${hardMax} bpm. Enter a new value.`,
            warningMessage: '' 
        };
    }

    if ((softMin && rrate < softMin) || (softMax && rrate > softMax)) {
        return { 
            isValid: false, 
            errorMessage: '',
            warningMessage: `Respiratory is outside the normal range of ${softMin} to ${softMax} bpm. Are you sure this is correct?` 
        };
    }

    return { isValid: true, errorMessage: '', warningMessage: '' };
}