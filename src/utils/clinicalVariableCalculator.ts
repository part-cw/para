
//  * TODO used for WAZ score calculations -- take floor (use months completed)
//  * TODO for model calculation - round to 1 decimal place

const muacMax = 270
const muacMin = 50
const muacSoftMax = 250;
const muacSoftMin = 60

const tempMax = 45
const tempMin = 30
const tempSoftMin = 34



export function validateMuac(input: string): { isValid: boolean; errorMessage: string | undefined; warningMessage: string | undefined } {
    const muac = Number(input)
    if (muac < muacMin) {
        return { 
            isValid: false, 
            errorMessage: `MUAC is in millimeters. A value below ${muacMin} mm is not valid.`,
            warningMessage: ''  
        };
    }

      if (muac > muacMax) {
        return { 
            isValid: false, 
            errorMessage: `MUAC is in millimeters. A value above ${muacMax} mm is not valid.`,
            warningMessage: '' 
        };
    }

    if (muac < muacSoftMin || muac > muacSoftMax) {
        return { 
            isValid: false, 
            errorMessage: '',
            warningMessage: `MUAC outside acceptable range of ${muacSoftMin}-${muacSoftMax} mm. Are you sure this is correct?` 
        };
    }

    return { isValid: true, errorMessage: '', warningMessage: ''  };
}

export function validateTemperatureRange(input: string): { isValid: boolean; errorMessage: string|undefined; warningMessage: string|undefined  } {
    const temperature = Number(input)

    if (temperature < tempMin || temperature > tempMax) {
        return { 
            isValid: false, 
            errorMessage: `Temperature is outside the valid range of ${tempMin}-${tempMax}°C. Enter a new value.`,
            warningMessage: '' 
        };
    }

      if (temperature < tempSoftMin) {
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


/**
 * Things to ask Matt:
 * - malnutrition score uses height in smart triage - do we want to do the same in smart discharge
 * - no don't use height --> have a label for waz have a table for muac... for nutritional status: use most severe of the 
 * - what are the hard and soft limits for: MUAC, WAZ, temperature, spo2, rrate  -- use whatever is in smart triage
 * -- temperature: 30-34 soft limit -warning ; over 40 under 30 hard limit
 * - ie when do I display an error (force uer to change value) vs warning (allow them to keep the entered value)
 */