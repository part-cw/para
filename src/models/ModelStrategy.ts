import { PatientData } from "../contexts/PatientDataContext";
import { ModelVariable, RiskModel, RiskPrediction } from "./types";

/**
 * calculates risk scores
 */
export abstract class ModelStrategy {
    protected model: RiskModel;
    // private age: number;

    constructor(model: RiskModel) {
        this.model = model;
    }

    // main function that calculates risk level
    public calculateRisk(patientData: PatientData): RiskPrediction {
        // round age to nearest 10th
        const age = patientData.ageInMonths && Math.round(patientData.ageInMonths *10)/10

        // 1-3. calculateRawScore -- includes scaling values and adding offset
        const rawScore = this.calculateRawScore(patientData)
        
        // 4-5. calculate scaledScore, then calculateFinalScore:multiply scaled score by 100 and round to two decimal places
        const riskScore = this.convertToRiskScore(rawScore)

        // 6. getRiskCatgory
        const riskLevel = this.getRiskLevel(riskScore)

        return {
            rawScore,
            riskScore,
            riskLevel,
            model: this.model.modelName
        }
    }

    protected calculateRawScore(patientData: PatientData): number {
        let score = this.model.rawScoreOffset;

        // process main variables and add to score -- scale each variable and multiply by coefficient 
        for (const variable of this.model.variables) {
            const contribution = this.calculateScaledVariableContribution(variable, patientData)
            score += contribution;
        }

        // process interactions, if present
        if (this.model.ageInteractions) {
            // for (const interaction of this.model.ageInteractions) {
            //     const scaledValue = this.scaleNumericValues(interaction, patientData)
            //     const contribution = this.calculateVariableContribution(scaledValue, patientData)
            //     score += contribution;
            // }
        }
        
        return score;
    }


    /**
     * 
     * @param variable 
     * @param patientData 
     * @returns calculates contribution of scaled variable value based on variable type. 
     */
    protected calculateScaledVariableContribution(variable: ModelVariable, patientData: PatientData): number {
        const value = patientData[variable.name]
        if (value === null || value === undefined) return 0;      

        // Handle different variable types -- return scaled contribution
        if (variable.type === 'boolean') {
            return this.handleBooleanVariable(variable, value);
        } else if (variable.type === 'number' && variable.coefficient !== undefined) {
            return this.handleNumericVariable(variable, value);
        } else if (variable.type === 'string' && variable?.oneOf) {
            return this.handleCategoricalVariable(variable, value)
        }

        throw Error(`Type ${variable.type} not handled`); 
    }

    /**
     * 
     * @param variable 
     * @param value 
     * scales boolean variables and multiplies by coefficient
     */
    protected handleBooleanVariable(variable: ModelVariable, value: any): number {
        const boolValue = this.convertToBoolean(value)
        // if value of variable is false, variable has no contribution - return 0
        if (!boolValue) return 0;

        // if value is true, numValue = 1, otherwise 0
        const numValue = boolValue ? 1 : 0
        const mean = variable.mean || 0
        const stdDev = variable.standardDeviation || 1
        const coeff = variable.coefficient || 0

        const scaledVal = this.scaleValue(numValue, mean, stdDev)
        return scaledVal * coeff;
    }

    /**
     * 
     * @param variable 
     * @param value numeric value in either string or number format
     * scales numeric variables and multiplies by coefficient
     */
    protected handleNumericVariable(variable: ModelVariable, value: any): number {
        const mean = variable.mean || 0
        const stdDev = variable.standardDeviation || 1
        const coeff = variable.coefficient || 0

        let numValue: number
        if (typeof(value) === 'string') {
            numValue = parseFloat(value) // need this because some variables in patientData stored as string (eg. weight)
        } else {
            numValue = value
        }

        const scaledVal = this.scaleValue(numValue, mean, stdDev)
        return scaledVal * coeff;
    }
    
    // TODO -- must test
    protected handleCategoricalVariable(variable: ModelVariable, value: any): number {
        if (!variable.oneOf) throw Error ('options not provided in model JSON')

        const optionArray = variable.oneOf
        const option = optionArray.find(opt => opt.value.trim().toLowerCase() === value.trim().toLowerCase())

        if (!option) throw Error(`${value} not listed as an option in model JSON`)
        
        // if option has no listed coefficient, mean and standard deviation, then it has no contribution to score
        if (option.coefficient === undefined && 
            option.mean === undefined && 
            option.standardDeviation && undefined) {
            return 0;
        }

        const numValue = 1
        const mean = option.mean || 0
        const stdDev = option.standardDeviation || 1
        const coeff = option.coefficient || 0

        const scaledVal = this.scaleValue(numValue, mean, stdDev)
        return scaledVal * coeff
    }

    protected getAgeInteractionValue(age: number, val: number): number {
        // ultiple value (or numeric value or boolean) by numeric value for ageInMonths (rounded to 1 decimal)
        let dependencyStrings: string[] = []
        let dependencyObjects: {}[]
        const interactions = this.model.ageInteractions

        // if (interactions) {
        //     for (const item of interactions) {
        //         if (typeof(item.dependencies === 'string')) {
        //             dependencyStrings.push(item.dependencies)
        //         }
        
        //     }
        // }

        return 0;
    }

    // scale value if mean and sd given: (value - mean) / stdDev,
    protected scaleValue(val: number, mean: number, stdDev: number): number {
        return (val - mean) / stdDev 
    }

    protected convertToRiskScore(rawScore: number): number {
        // scaled score = 1/(1 + exp(-r))
        const scaledScore = 1 / (1 + Math.exp(-rawScore))

        // convert to percentage [scaled*100] and round to nearest 2 decimal places [Math.round(percentage*100)/100]
        const finalScore = Math.round(scaledScore * 10000) / 100
        return finalScore;
    }


    protected getRiskLevel(riskScore: number): string {
        // TODO double check if errors should be thrown
        if (riskScore < 0) throw Error('Risk score cannot be negative')
        if (riskScore > 100) throw Error('Risk score cannot be more than 100%')
        
        // store 'low' threshold if it exists in model
        let low
        if (this.model.riskThresholds.low != null) { // TODO check that this condition is ok
            low = this.model.riskThresholds.low
        }

        // store other thresholds
        const moderate = this.model.riskThresholds.moderate
        const high = this.model.riskThresholds.high
        const veryHigh = this.model.riskThresholds.veryHigh

        if (riskScore >= veryHigh) return 'Very High'
        if (riskScore >= high) return 'High'
        if (riskScore >= moderate) return 'Moderate'

        // default to lowest available risk level if not mod to very high
        return (low != null) ? 'Low' : 'Moderate';
    }

    private convertToBoolean(value: any): boolean {
        if (typeof value === 'boolean') return value;
        
        if (typeof value === 'string') {
            const lower = value.toLowerCase();
            return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'positive';
        }

        return Boolean(value);
    }
}
        
    // calculation steps
    // 1. start with raw score of 0
    // 2. if age-interactions: calculatate age interaction value.
    //      -- multiply value (or numeric value or boolean) by numeric value for ageInMonths (rounded to 1 decimal)
    // 3. scale numeric values
    //      scaled val = (numeric value - mean)/standardDeviation
    // 4. multiply scaled val by coefficient. Add results to raw score
    // 5, add raw score offset
    // 6. compute scaled scor with following equation:
    //      scaled score = 1/(1 + exp(-r))
    //      where r = raw score and exp(-r)means number e = 2.718... raised to the power -r
    // 7. multiply scaled score by 100 and round to two decimal places


// // src/models/ModelStrategy.ts
// import { PatientData } from '../contexts/PatientDataContext';

// export abstract class ModelStrategy {
//   protected model: RiskModel;

//   constructor(model: RiskModel) {
//     this.model = model;
//   }

//   // Main method to calculate risk
//   public calculateRisk(patientData: PatientData): RiskPrediction {
//     const missingVariables = this.validateRequiredData(patientData);
    
//     if (missingVariables.length > 0) {
//       return {
//         rawScore: 0,
//         riskLevel: 'low',
//         riskScore: 0,
//         missingVariables,
//         model: this.model.modelName
//       };
//     }

//     const rawScore = this.calculateRawScore(patientData);
//     const riskLevel = this.determineRiskLevel(rawScore);
//     const riskScore = this.convertToRiskScore(rawScore);

//     return {
//       rawScore,
//       riskLevel,
//       riskScore,
//       missingVariables: [],
//       model: this.model.modelName
//     };
//   }

//   private calculateRawScore(patientData: PatientData): number {
//     let score = this.model.rawScoreOffset;

//     // Process main variables
//     for (const variable of this.model.variables) {
//       const contribution = this.calculateVariableContribution(variable, patientData);
//       score += contribution;
//     }

//     // Process interactions
//     for (const interaction of this.model.interactions) {
//       const contribution = this.calculateInteractionContribution(interaction, patientData);
//       score += contribution;
//     }

//     return score;
//   }

//   private calculateVariableContribution(variable: ModelVariable, patientData: PatientData): number {
//     const value = this.getPatientValue(variable.name, patientData);
    
//     if (value === null || value === undefined) {
//       return 0;
//     }

//     // Handle different variable types
//     if (variable.type === 'boolean') {
//       return this.handleBooleanVariable(variable, value);
//     } else if (variable.type === 'string' && variable.contraints?.oneOf) {
//       return this.handleCategoricalVariable(variable, value);
//     } else if (variable.type === 'float' && variable.coefficient !== undefined) {
//       return this.handleContinuousVariable(variable, value);
//     }

//     return 0;
//   }

//   private handleBooleanVariable(variable: ModelVariable, value: any): number {
//     const boolValue = this.convertToBoolean(value);
    
//     if (variable.oneOf) {
//       const option = variable.oneOf.find(opt => opt.value === boolValue);
//       return option?.coefficient || 0;
//     } else if (variable.contraints?.oneOf) {
//       const option = variable.contraints.oneOf.find(opt => opt.value === boolValue);
//       return option?.coefficient || 0;
//     }
    
//     return 0;
//   }

//   private handleCategoricalVariable(variable: ModelVariable, value: any): number {
//     if (!variable.contraints?.oneOf) return 0;
    
//     const option = variable.contraints.oneOf.find(opt => opt.value === value);
//     return option?.coefficient || 0;
//   }

//   private handleContinuousVariable(variable: ModelVariable, value: any): number {
//     const numValue = parseFloat(value);
//     if (isNaN(numValue)) return 0;
    
//     // Standardize the value: (value - mean) / std_dev
//     const standardized = (numValue - (variable.mean || 0)) / (variable.standardDeviation || 1);
//     return standardized * (variable.coefficient || 0);
//   }

//   private calculateInteractionContribution(interaction: ModelInteraction, patientData: PatientData): number {
//     // Handle special interaction calculations
//     switch (interaction.name) {
//       case 'ageJaundice':
//         return this.calculateAgeJaundiceInteraction(interaction, patientData);
//       case 'ageWaz':
//         return this.calculateAgeWazInteraction(interaction, patientData);
//       case 'ageFeedingStatus':
//         return this.calculateAgeFeedingStatusInteraction(interaction, patientData);
//       case 'ageIllnessDuration':
//         return this.calculateAgeIllnessDurationInteraction(interaction, patientData);
//       default:
//         return 0;
//     }
//   }

//   private calculateAgeJaundiceInteraction(interaction: ModelInteraction, patientData: PatientData): number {
//     const age = patientData.ageInMonths || 0;
//     const jaundice = this.convertToBoolean(patientData.jaundice);
//     const interactionValue = age * (jaundice ? 1 : 0);
    
//     const standardized = (interactionValue - interaction.mean) / interaction.standardDeviation;
//     return standardized * interaction.coefficient;
//   }

//   private calculateAgeWazInteraction(interaction: ModelInteraction, patientData: PatientData): number {
//     const age = patientData.ageInMonths || 0;
//     const waz = patientData.waz || 0;
//     const interactionValue = age * waz;
    
//     const standardized = (interactionValue - interaction.mean) / interaction.standardDeviation;
//     return standardized * interaction.coefficient;
//   }

//   private calculateAgeFeedingStatusInteraction(interaction: ModelInteraction, patientData: PatientData): number {
//     const age = patientData.ageInMonths || 0;
//     const feedingWell = this.convertToBoolean(patientData.feedingStatus);
//     const interactionValue = age * (feedingWell ? 1 : 0);
    
//     const standardized = (interactionValue - interaction.mean) / interaction.standardDeviation;
//     return standardized * interaction.coefficient;
//   }

//   private calculateAgeIllnessDurationInteraction(interaction: ModelInteraction, patientData: PatientData): number {
//     const age = patientData.ageInMonths || 0;
//     const is48hTo7d = patientData.illnessDuration === '48h-7d';
//     const interactionValue = age * (is48hTo7d ? 1 : 0);
    
//     const standardized = (interactionValue - interaction.mean) / interaction.standardDeviation;
//     return standardized * interaction.coefficient;
//   }

//   private determineRiskLevel(rawScore: number): 'low' | 'moderate' | 'high' | 'veryHigh' {
//     const { moderate, high, veryHigh } = this.model.riskThresholds;
    
//     if (rawScore >= veryHigh) return 'veryHigh';
//     if (rawScore >= high) return 'high';
//     if (rawScore >= moderate) return 'moderate';
//     return 'low';
//   }

//   private convertToRiskScore(rawScore: number): number {
//     // Convert raw score to probability using logistic function
//     // P = 1 / (1 + e^(-rawScore))
//     const probability = 1 / (1 + Math.exp(-rawScore));
//     return Math.round(probability * 100); // Convert to percentage
//   }

//   private validateRequiredData(patientData: PatientData): string[] {
//     const missing: string[] = [];
    
//     for (const variable of this.model.variables) {
//       if (variable.required) {
//         const value = this.getPatientValue(variable.name, patientData);
//         if (value === null || value === undefined || value === '') {
//           missing.push(variable.displayName);
//         }
//       }
//     }
    
//     return missing;
//   }

//   private getPatientValue(variableName: string, patientData: PatientData): any {
//     // Map model variable names to patient data properties
//     const mapping: { [key: string]: keyof PatientData } = {
//       'waz': 'waz',
//       'muac': 'muac',
//       'feedingStatus': 'feedingStatus',
//       'spo2': 'spo2',
//       'illnessDuration': 'illnessDuration',
//       'ageInMonths': 'ageInMonths',
//       'bulgingFontanelle': 'bulgingFontanelle',
//       'jaundice': 'jaundice',
//       'hivStatus': 'hivStatus',
//       'temperature': 'temperature',
//       'rrate': 'rrate',
//       'lastHospitalized': 'lastHospitalized',
//       'weight': 'weight',
//       // Add other mappings as needed
//     };

//     const propertyName = mapping[variableName];
//     return propertyName ? patientData[propertyName] : null;
//   }

//   private convertToBoolean(value: any): boolean {
//     if (typeof value === 'boolean') return value;
//     if (typeof value === 'string') {
//       const lower = value.toLowerCase();
//       return lower === 'true' || lower === 'yes' || lower === '1';
//     }
//     return Boolean(value);
//   }
// }