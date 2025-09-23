import {
  calculateBcsScore,
  calculateWAZ,
  getMuacStatus,
  getWazNutritionalStatus,
  indexToNutritionStatus,
  nutritionStatusToIndex,
  validateMuac,
  validateOxygenSaturationRange,
  validateRespiratoryRange,
  validateTemperatureRange,
  validateWeight
} from '../clinicalVariableCalculator';

import config from '../../models/model_input_ranges.json';

describe('Integration tests with real config', () => {
  it('muac config should exist', () => {
    const muacConfig = config.find(c => c.variable === 'muac');
    expect(muacConfig).toBeDefined();
  });

  it('validateMuac respects real config boundaries', () => {
    const muacConfig = config.find(c => c.variable === 'muac')!;
    expect(validateMuac(String(muacConfig.hardMin - 1)).isValid).toBe(false);
    expect(validateMuac(String(muacConfig.hardMax + 1)).isValid).toBe(false);
    expect(validateMuac(String((muacConfig.softMin ?? 0) - 1)).warningMessage).toMatch(/MUAC/);
    expect(validateMuac(String((muacConfig.softMax ?? 9999) + 1)).warningMessage).toMatch(/MUAC/);
  });

  it('validateTemperatureRange respects real config boundaries', () => {
    const tempConfig = config.find(c => c.variable === 'temperature')!;
    expect(validateTemperatureRange(String(tempConfig.hardMin - 5)).isValid).toBe(false);
    expect(validateTemperatureRange(String(tempConfig.hardMax + 5)).isValid).toBe(false);
    if (tempConfig.softMin) {
      expect(validateTemperatureRange(String(tempConfig.softMin - 1)).warningMessage).toContain('Temperature');
    }
  });

  it('getMuacStatus matches one of severe/moderate/normal/invalid', () => {
    const muacConfig = config.find(c => c.variable === 'muac')!;
    const rule = muacConfig.rules?.[0];
    if (rule) {
      expect(getMuacStatus(rule.isUnderSixMonths, String(rule.severe.min))).toBe('severe');
      expect(getMuacStatus(rule.isUnderSixMonths, String(rule.moderate.min))).toBe('moderate');
      expect(getMuacStatus(rule.isUnderSixMonths, String(rule.normal.min))).toBe('normal');
    }
  });

  it('validateWeight works with valid, empty, and negative inputs', () => {
    expect(validateWeight('')).toMatchObject({ isValid: false });
    expect(validateWeight('-5')).toMatchObject({ isValid: false });
    expect(validateWeight('0')).toMatchObject({ isValid: false });
    expect(validateWeight('10')).toMatchObject({ isValid: true });
  });

  it('calculateWAZ finds correct growth standards for male/female', () => {
    expect(() => calculateWAZ(6, 'male', 3)).not.toThrow();
    expect(() => calculateWAZ(6, 'male', 3)).not.toThrow();

    // inputs and expected values from RedCap
    expect(calculateWAZ(26, 'female', 11)).toBeCloseTo(-0.64); 
    expect(calculateWAZ(47, 'female', 15.6)).toBeCloseTo(-0.13);
    expect(calculateWAZ(21, 'female', 6.2)).toBeCloseTo(-4.92);  
    
    expect(calculateWAZ(9, 'male', 8.4)).toBeCloseTo(-0.53);
    expect(calculateWAZ(12, 'male', 7.5)).toBeCloseTo(-2.29);
    expect(calculateWAZ(24, 'male', 8.2)).toBeCloseTo(-3.45);

  });

  it('calculateWAZ should throw error if age not found in JSON', () => {
    expect(() => calculateWAZ(241, 'female', 3)).toThrow();
    expect(() => calculateWAZ(241, 'male', 3)).toThrow();
  });


  it('getWazNutritionalStatus returns correct categories', () => {
    expect(getWazNutritionalStatus(-2)).toBe('normal');
    expect(getWazNutritionalStatus(-1.9)).toBe('normal');
    expect(getWazNutritionalStatus(-2.01)).toBe('moderate');
    expect(getWazNutritionalStatus(-3)).toBe('moderate');
    expect(getWazNutritionalStatus(-3.01)).toBe('severe');
  });

  it('validateRespiratoryRange respects config boundaries', () => {
    const rConfig = config.find(c => c.variable === 'rrate')!;
    expect(validateRespiratoryRange(String(rConfig.hardMin - 1)).isValid).toBe(false);
    expect(validateRespiratoryRange(String(rConfig.hardMax + 1)).isValid).toBe(false);
  });

  it('validateOxygenSaturationRange respects config boundaries', () => {
    const spo2Config = config.find(c => c.variable === 'spo2')!;
    expect(validateOxygenSaturationRange(String(spo2Config.hardMin - 1)).isValid).toBe(false);
    expect(validateOxygenSaturationRange(String(spo2Config.hardMax + 1)).isValid).toBe(false);
  });

  it('nutritionStatusToIndex and indexToNutritionStatus are consistent', () => {
    expect(indexToNutritionStatus(nutritionStatusToIndex('moderate'))).toBe('moderate');
    expect(nutritionStatusToIndex('invalid')).toBe(-1);
    expect(indexToNutritionStatus(999)).toBe('invalid');
  });

  it('calculateBcsScore correctly given valid inputs', () => {
    expect(calculateBcsScore(0,0,0)).toBe(0)
    expect(calculateBcsScore(1,1,1)).toBe(3)
    expect(calculateBcsScore(1,2,2)).toBe(5)
  });

  it('calculateBcsScore throws error for eye scores > 1', () => {
    try {
      calculateBcsScore(2, 2, 2);
      fail('Expected error to be thrown but none was')
    } catch (e) {
      const err = e as Error;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBeDefined();
      expect(err.message).toBe("invalid eye movement score");
    }
  });

  it('calculateBcsScore throws error for eye scores < 0', () => {
    try {
      calculateBcsScore(-1, 2, 2);
      fail('Expected error to be thrown but none was')
    } catch (e) {
      const err = e as Error;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBeDefined();
      expect(err.message).toBe("invalid eye movement score");
    }
  });

  it('calculateBcsScore throws error for invalid motor reponse score > 2', () => {
    try {
      calculateBcsScore(1, 3, 2);
      fail('Expected error to be thrown but none was')
    } catch (e) {
      const err = e as Error;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBeDefined();
      expect(err.message).toBe("invalid motor response score");
    }
  });

  it('calculateBcsScore throws error for motor response scores < 0', () => {
    try {
      calculateBcsScore(1, -1, 2);
      fail('Expected error to be thrown but none was')
    } catch (e) {
      const err = e as Error;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBeDefined();
      expect(err.message).toBe("invalid motor response score");
    }
  });

  it('calculateBcsScore throws error for invalid verbal reponse score > 2', () => {
    try {
      calculateBcsScore(1, 2, 3);
      fail('Expected error to be thrown but none was')
    } catch (e) {
      const err = e as Error;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBeDefined();
      expect(err.message).toBe("invalid verbal response score");
    }
  });

  it('calculateBcsScore throws error for invalid verbal reponse score < 0', () => {
    try {
      calculateBcsScore(1, 2, -1);
      fail('Expected error to be thrown but none was')
    } catch (e) {
      const err = e as Error;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBeDefined();
      expect(err.message).toBe("invalid verbal response score");
    }
  });


});