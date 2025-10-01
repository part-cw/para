import { PatientData } from "../contexts/PatientData";
import { ModelInteraction, ModelVariable, RiskModel, RiskPrediction } from "./types";

type Stats = {
  coefficient: number
  mean: number
  standardDeviation: number
}

/**
 * calculates risk scores for given models
 * NOTE: if any other models are used, this should be further generalized 
 *       and all LR calculation functions should move to concrete LogisticRegressionStrategy class 
 */
export abstract class ModelStrategy {
    protected model: RiskModel;

    constructor(model: RiskModel) {
        this.model = model;
    }

    /**
     * Main function that calculates risk level
     */
    public calculateRisk(patientData: PatientData): RiskPrediction {
        try {
            this.validateRequiredData(patientData)
            const rawScore = this.calculateRawScore(patientData) // scales variables/interactions, multiply by coefficient, add offset         
            const riskScore = this.convertToRiskScore(rawScore) // scale raw score and convert to percentage
            const riskCategory = this.getRiskCategory(riskScore)

            console.log('rawScore', rawScore)
            console.log('riskScore', riskScore)
            console.log('category', riskCategory)

            return {
                riskScore,
                riskCategory,
                model: this.model.modelName
            }
        } catch (err) {
            const error = err as Error;
            throw new Error (`Risk calculation failed for model ${this.model.modelName}: ${error.message}`)
        }
    }

    /**
     * Validates that all required variables are present
     */
    protected validateRequiredData(patientData: PatientData): void {
        const missingVariables: string[] = [];
        
        for (const variable of this.model.variables) {
            if (variable.required) {
                const value = patientData[variable.name];
                if (value === null || value === undefined || value === '') {
                    missingVariables.push(variable.displayName || variable.name);
                }
            }
        }

        if (missingVariables.length > 0) {
            throw new Error(`Missing required variables: ${missingVariables.join(', ')}`);
        }

        // Validate age for interactions if they exist
        const interactions = this.model.ageInteractions
        if ((interactions && interactions.length > 0) && !patientData.ageInMonths) {
            throw new Error('Age in months is required for models with age interactions');
        }
    }

    protected calculateRawScore(patientData: PatientData): number {
        console.log('intercept', this.model.rawScoreOffset)
        let score = this.model.rawScoreOffset;

        // add variable contributions
        for (const variable of this.model.variables) {
            const contribution = this.calculateVariableContribution(variable, patientData)
            score += contribution;
        }

        // add interaction contributions
        if (this.model.ageInteractions) {
            for (const interaction of this.model.ageInteractions) {
                const contribution = this.calculateInteractionContribution(interaction, patientData)
                score += contribution;
            }
        }
        
        return score;
    }

    /**
     * 
     * @param variable 
     * @param patientData 
     * @returns  calculates contribution of a single scaled variable
     */
    protected calculateVariableContribution(variable: ModelVariable, patientData: PatientData): number {
        console.log('calculating contribution of varibale', variable.name)
        const rawValue = patientData[variable.name]
        console.log('rawValue', rawValue)

        // handle missing, non-required variables
        if (rawValue === null || rawValue === undefined || rawValue === '') return 0; 

        const numericValue = this.extractNumericValue(variable, rawValue);
        console.log('numeric value', numericValue)
        // if (variable.type === 'boolean' && numericValue === 0) {
        //     console.log ('boolean variable is false -- no contirbution')
        //     return 0;
        // }

        const stats = this.extractStats(variable, rawValue)
        console.log('stats', stats)
        
        const scaledValue = this.scaleValue(numericValue, stats.mean || 0, stats.standardDeviation || 1);
        console.log('scaled val', scaledValue)
        console.log('contribution: ', scaledValue * (stats.coefficient || 0))

        return scaledValue * (stats.coefficient || 0);
    }

    /**
     * 
     * calculates contribution of a scaled age interaction
     */ 
    protected calculateInteractionContribution(interaction: ModelInteraction, patientData: PatientData): number {
        console.log('calcuakting interaction contribution for', interaction.name)
        const age = this.getRoundedAge(patientData.ageInMonths!);
        console.log('rounded age', age)

        const dependencyValue = this.getDependencyValue(interaction, patientData);
        console.log('dependency val', dependencyValue)
        
        const interactionValue = age * dependencyValue;
        const scaledValue = this.scaleValue(interactionValue, interaction.mean, interaction.standardDeviation);
        console.log('scaled value', scaledValue)
        console.log('contribution', (scaledValue * interaction.coefficient))
        return scaledValue * interaction.coefficient;
    }

    protected getDependencyValue(interaction: ModelInteraction, patientData: PatientData): number {
        const { dependency, dependencyType } = interaction;

        if (typeof(dependency) === 'object') {
            // Handle object dependencies (e.g., {illnessDuration: '48h-7d'})
            const [varName, requiredValue] = Object.entries(dependency)[0]; // e.g ['illnessDuration', '48h-7d']            
            const actualVal = patientData[varName as keyof PatientData]
            const doesActualMatchRequired = String(actualVal).trim().toLowerCase() === String(requiredValue).trim().toLowerCase()
            return doesActualMatchRequired ? 1 : 0;
        }

        // handle string dependencies e.g. 'neonatalJaundice'
        const storedVal =  patientData[dependency as keyof PatientData]

        switch (dependencyType) {
            case 'boolean':
                return this.convertToNumericBoolean(storedVal)
            case 'number' :
                return this.handleNumericValue(storedVal);
            default: throw Error (`Unsupported dependency type: ${dependencyType}`)
        }
    }

    /**
     * Extract numeric value from raw patient data based on variable type
     */
    protected extractNumericValue(variable: ModelVariable, rawValue: any): number {
        switch (variable.type) {
            case 'boolean':
                return this.convertToNumericBoolean(rawValue);
            
            case 'number':
                return this.handleNumericValue(rawValue);
            
            case 'string':
                return this.handleCategoricalValue(variable, rawValue);
            
            default:
                throw new Error(`Unsupported variable type: ${variable.type}`);
        }
    }

    protected extractStats(variable: ModelVariable, rawValue: any) {
        if (variable.type === 'string') {
            return this.getOption(variable, rawValue)
        }

        // default for numeric and boolean values
        return {
            mean: variable.mean || 0,
            standardDeviation: variable.standardDeviation || 1,
            coefficient: variable.coefficient || 0
        }
    }

    private getOption(variable: ModelVariable, value: any) {
        if (!variable.oneOf) throw Error (`Categorical variable ${variable.name} missing oneOf options`)

        const optionArray = variable.oneOf
        const option = optionArray.find(opt => opt.value.trim().toLowerCase() === value.trim().toLowerCase())

        if (!option) throw Error(`Invalid option '${value}' for variable ${variable.name}`)

        return option;
    }

    
    /**
     * Handles categorical variables with oneOf options. Returns numeric value 
     */
    protected handleCategoricalValue(variable: ModelVariable, value: any): number {
        const option = this.getOption(variable, value)   

        // If option has no coefficient, it's the reference category (0 contribution)
        const numValue = (option.coefficient !== undefined) ? 1 : 0;
        console.log('cat option', value)
        console.log('numval', numValue)
        return numValue;
    }

    /**
     * 
     * @param rawScore 
     * @returns scales raw score and converts it to percetage, rounded to the nearest 2 decimal places
     */
    protected convertToRiskScore(rawScore: number): number {
        const scaledScore = 1 / (1 + Math.exp(-rawScore))

        // convert to percentage [scaled*100] and round to nearest 2 decimal places [Math.round(percentage*100)/100]
        const finalScore = Math.round(scaledScore * 10000) / 100
        return finalScore;
    }


    protected getRiskCategory(riskScore: number): string {
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

     /**
     * Convert various boolean representations to numeric (0 or 1). 1 = true/yes/positive, 0 = false/no/negative
     */
    protected convertToNumericBoolean(value: any): number {
        if (typeof value === 'boolean') {
            return value ? 1 : 0
        };
        
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            const truthyValues = ['true', 'yes', '1', 'positive'];
            return truthyValues.includes(normalized) ? 1 : 0;
        }

        return Boolean(value) ? 1: 0;
    }

    /**
     * 
     * @param val value 
     * @param mean 
     * @param sd standard deviation
     * @returns 
     */
    protected scaleValue(val: number, mean: number, sd: number): number {
        console.log('scaling value...')
        return (val-mean) / sd
    }

    /**
     * Parse numeric values from string or number
     */
    protected handleNumericValue(value: any): number {
        if (typeof(value) === 'number') return value;

        if (typeof(value) === 'string') {
            const parsed = parseFloat(value)
            if (isNaN(parsed)) {
                throw new Error(`Cannot parse '${value}' as a number`);
            }
            return parsed
        } 
   
        throw Error(`Invalid numeric value: ${value}`)
    }

    /**
     * Get age rounded to 1 decimal place
     */
    protected getRoundedAge(ageInMonths: number): number {
        return Math.round(ageInMonths * 10) / 10;
    }
}

// TODO:  move lr-specific calculations to this concrete class
export class LogisticRegressionStrategy extends ModelStrategy {
    constructor(model: RiskModel) {
        if (model.modelType !== 'logistic_regression') {
            throw new Error('LogisticRegressionStrategy only supports LR models')
        }
        super(model)
    }
}

/**
 * Factory function to create appropriate model strategy
 */
export function createModelStrategy(model: RiskModel): ModelStrategy {
    switch (model.inputType) {
        case 'logistic_regression':
            return new LogisticRegressionStrategy(model);
        default:
            throw new Error(`Unsupported model type: ${model.modelType}`);
    }
}
