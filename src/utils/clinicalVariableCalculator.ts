
//  * TODO used for WAZ score calculations -- take floor (use months completed)
//  * TODO for model calculation - round to 1 decimal place

import config from '../data/model_input_ranges.json';
import waz_female from '../data/wazscore_female.json';
import waz_male from '../data/wazscore_male.json';

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
    if (muac >= rules.normal.min && muac <= rules.normal.max) return "normal";

    return 'invalid';
}

// TODO -- add more checks -- any max/min values?? 
export function validateWeight(weight: string): ValidationResult {
    const weightNum = parseFloat(weight.trim())

    if (!weight || !weightNum) {
        return {
            isValid: false,
            errorMessage: 'Weight is required and must be a valid number',
            warningMessage: ''
        } 
    }

    if (weightNum < 0) {
        return {
            isValid: false,
            errorMessage: 'Weight cannot be negative. Enter a new value',
            warningMessage: ''
        } 
    }

    // no errors
    return {isValid: true, errorMessage: '', warningMessage: ''};
}

/**
 * 
 * @param months unrounded age in months
 * @param sex male or female
 * @param weight validated weight in kg
 * @returns 
 */
export function calculateWAZ(months: number, sex: string, weight: number): number {
    // take floor of age in months
    const roundedMonth = Math.floor(months)
    console.log('calculating waz...')
    console.log('original months', months)
    console.log('rounded months', roundedMonth)
    console.log('sex', sex)
    console.log('weight', weight)

    // look up sex-specifc growth standard for given age (in months)
    let data;
    if (sex.toLowerCase() === 'male') {
        data = waz_male.find(d => d.Month === roundedMonth)
    } else if (sex.toLowerCase() === 'female'){
        data = waz_female.find(d => d.Month === roundedMonth)
    } else {
        throw new Error ('Missing patient sex')
    }

    // throw error if data not found
    if (!data) throw new Error (`Growth standard for ${roundedMonth} month old ${sex} not found`)
    
    console.log('data', data)
    // calculate waz score if growth standard data found
    const l = data.L
    const m = data.M
    const s = data.S

    const zScore = (((weight / m)**l) - 1) / (l * s)
    console.log('zscore', zScore)
    return zScore;
}

/**
 * 
 * @param waz 
 * @returns maps waz to nutritional status (normal, moderate, severe) or returns 'invalid'
 */
export function getWazNutritionalStatus(waz: number): string {
    if (waz >= -2) return "normal"
    if ((waz < -2) && (waz >= -3)) return "moderate"
    if (waz < -3) return "severe"
    
    // default
    return 'invalid'
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

export function validateOxygenSaturationRange(input: string): ValidationResult {
    const spo2 = Number(input)

    const spo2Config = config.find(c => c.variable === "spo2");
    if (!spo2Config) {
        throw new Error("SpO2 config not found in model_input_ranges.json");
    }

    const { hardMin, hardMax } = spo2Config;

    if ((hardMin && spo2 < hardMin) || (hardMax && spo2 > hardMax)) {
        return { 
            isValid: false, 
            errorMessage: `SpO₂ must be between ${hardMin}-${hardMax}%. Enter a new value.`,
            warningMessage: '' 
        };
    }

    return { isValid: true, errorMessage: '', warningMessage: '' };
}

export function nutritionStatusToIndex(status: string): number {
    const statusMap: Record<string, number> = {
        normal: 0,
        moderate: 1,
        severe: 2,
    };

    return statusMap[status] ?? -1; // -1 if not found
}

export function indexToNutritionStatus(index: number): string {
    const indexMap: Record<number, string> = {
        0: 'normal',
        1: 'moderate',
        2: 'severe',
    };

    return indexMap[index] ?? 'invalid'; // -1 if not found
}