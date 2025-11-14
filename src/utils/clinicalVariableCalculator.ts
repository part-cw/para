import waz_table from '../data/waz_lookup.json';
import config from '../models/model_input_ranges.json';

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

/**
 * 
 * @param input temperature as string; assume valid
 */
export function getTempSquared(input: string): number {
    const temp = parseFloat(input)
    return temp * temp
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
    if (!weight) {
        return {
            isValid: false,
            errorMessage: 'Weight is required and must be a valid number',
            warningMessage: ''
        } 
    }

    const weightNum = parseFloat(weight.trim())

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
    let data;

    if (months < 1) {
        const ageWeeks = (months * 30) / 7
        const roundedWeeks = Math.round(ageWeeks)

        data = waz_table.find(d => 
            (d.Under1Month.toLowerCase() === 'yes') && 
            (d.Sex.toLowerCase() === sex.toLowerCase()) &&
            (d.WeekOrMonth === roundedWeeks)
        )

        if (!data) throw new Error (`Growth standard for ${roundedWeeks} week old ${sex.toLowerCase()} not found`)

    } else {
        const roundedMonth = Math.round(months)

        data = waz_table.find(d => 
            (d.Under1Month.toLowerCase() === 'no') && 
            (d.Sex.toLowerCase() === sex.toLowerCase()) &&
            (d.WeekOrMonth === roundedMonth)
        )

        if (!data) throw new Error (`Growth standard for ${roundedMonth} month old ${sex.toLowerCase()} not found`)
    }

    
    // calculate waz score if growth standard data found
    const l = data.L
    const m = data.M
    const s = data.S

    const zScore = (((weight / m)**l) - 1) / (l * s)
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
            warningMessage: `Respiratory rate is outside the normal range of ${softMin} to ${softMax} bpm. Are you sure this is correct?` 
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

    return indexMap[index] ?? 'invalid'; // invalid if not found
}

export function getEyeMovementScore(value: string): number {
    const scoreMap: Record<string, number> = {
        "watches or follows": 1,
        "fails to watch or follow": 0,
    };

     return scoreMap[value.toLowerCase()];
}

export function getMotorResponseScore(value: string): number {
    const scoreMap: Record<string, number> = {
        "normal behaviour observed": 2,
        "localizes painful stimulus": 2,
        'withdraws limb from painful stimulus': 1,
        'no response or inappropriate response': 0
    };

     return scoreMap[value.toLowerCase()];
}

export function getVerbalResponseScore(value: string): number {
    const scoreMap: Record<string, number> = {
        "normal behaviour observed": 2,
        "cries appropriately with pain (or speaks if verbal)": 2,
        'moan or abnormal cry with pain': 1,
        'no vocal response to pain': 0
    };

     return scoreMap[value.toLowerCase()];
}


/**
 * 
 * @param score value in range of  [0, 5]
 * @returns true if score = 5, else false
 */
export function isAbnormalBcs(score: number): boolean {
    if (score > 5 || score < 0) throw Error(abnormalBcsErrorMessage)
    return (score < 5);
}

/**
 * 
 * @param eyeScore integer value between [0,1]
 * @param motorScore integer value between [0,2]
 * @param verbalScore integer value between [0,2]
 * @returns sum of all observed scores; integer value between [0,5]
 */
export function calculateBcsScore(eyeScore: number, motorScore: number, verbalScore: number): number {
    if (eyeScore < 0 || eyeScore > 1) throw Error ('invalid eye movement score')
    if (motorScore < 0 || motorScore > 2) throw Error ('invalid motor response score')
    if (verbalScore < 0 || verbalScore > 2) throw Error ('invalid verbal response score')

    return (eyeScore + motorScore + verbalScore)
}

export function mapBcsScoreToVariant(score: number): string {
    const bcsMap: Record<number, string> = {
        0: 'severe',
        1: 'severe',
        2: 'severe',
        3: 'severe',
        4: 'severe',
        5: 'normal'
    }

    return bcsMap[score] ?? 'invalid'
}

// Error messages
export const abnormalBcsErrorMessage = 'Invalid BCS score. Must be integer value from 0 to 5'