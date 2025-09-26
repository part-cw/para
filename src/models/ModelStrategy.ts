import { PatientData } from "../contexts/PatientDataContext";
import { ModelInteraction, ModelVariable, RiskModel, RiskPrediction } from "./types";

/**
 * calculates risk scores
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
            const riskLevel = this.getRiskLevel(riskScore)

            return {
                rawScore,
                riskScore,
                riskLevel,
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
        const rawValue = patientData[variable.name]

        // handle missing, non-required variables
        if (rawValue === null || rawValue === undefined || rawValue === '') return 0; 

        const numericValue = this.extractNumericValue(variable, rawValue);
        const scaledValue = this.scaleValue(numericValue, variable.mean || 0, variable.standardDeviation || 1);
        
        return scaledValue * (variable.coefficient || 0);
    }

    /**
     * 
     * calculates contribution of a scaled age interaction
     */ 
    protected calculateInteractionContribution(interaction: ModelInteraction, patientData: PatientData): number {
        const age = this.getRoundedAge(patientData.ageInMonths!);
        const dependencyValue = this.getDependencyValue(interaction, patientData);
        
        const interactionValue = age * dependencyValue;
        const scaledValue = this.scaleValue(interactionValue, interaction.mean, interaction.standardDeviation);
        
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
    
    /**
     * Handles categorical variables with oneOf options. Returns numeric value 
     */
    protected handleCategoricalValue(variable: ModelVariable, value: any): number {
        if (!variable.oneOf) throw Error (`Categorical variable ${variable.name} missing oneOf options`)

        const optionArray = variable.oneOf
        const option = optionArray.find(opt => opt.value.trim().toLowerCase() === value.trim().toLowerCase())

        if (!option) throw Error(`Invalid option '${value}' for variable ${variable.name}`)

        // If option has no coefficient, it's the reference category (0 contribution)
        const numValue = (option.coefficient !== undefined) ? 1 : 0;
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
