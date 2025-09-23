import { PatientData } from "../contexts/PatientDataContext";

export interface ModelVariable {
    name: string;
    displayName: string;
    description: string;
    type: 'float' | 'boolean' | 'string';
    units: string | null;
    required: boolean;
    dependencies?: string[];
    coefficient?: number;
    mean?: number;
    standardDeviation?: number;
    oneOf?: Array<{
        value: any;
        description: string;
        coefficient?: number;
        mean?: number;
        standardDeviation?: number;
    }>;
}

export interface ModelInteraction {
    name: string;
    displayName: string;
    description: string;
    type: 'float';
    units: string | null;
    required: boolean;
    dependencies: string[];
    coefficient: number;
    mean: number;
    standardDeviation: number;
}

export interface RiskModel {
    modelName: string;
    humanReadableName: string;
    description: string;
    usageTime: 'admission' | 'discharge';
    isUnderSixMonths: boolean;
    inputType: 'clinical' | string;
    riskThresholds: {
        low?: number;
        moderate: number;
        high: number;
        veryHigh: number;
    };
    rawScoreOffset: number;
    variables: ModelVariable[];
    interactions?: ModelInteraction[];
}

export interface RiskPrediction {
    rawScore?: number;
    scaledScore?: number;
    finalScore: number;
    riskLevel: 'low' | 'moderate' | 'high' | 'veryHigh';
    // missingVariables: string[];
    model: string;
}

/**
 * calculates risk scores
 */
export abstract class ModelStrategy {
    protected model: RiskModel;

    constructor(model: RiskModel) {
        this.model = model;
    }

    // main function that calculates risk level
    public calculateRisk(patientData: PatientData): RiskPrediction {
        // 1. for each interaction of this model, getAgeInteractionValue
        // 2. scaleNumericValues all variables and interaction values of this.model
        // 3. calculateRawScore
        // 4. calculateScaledScore
        // 5. calculateFinalScore: multiply scaled score by 100 and round to two decimal places
        // 6. getRiskCatgory

        return { // stub
            rawScore: 0,
            scaledScore: 0,
            finalScore: 0,
            riskLevel: 'low',
            model: ''
        }
    }


    private getAgeInteractionValue(age: number, val: number): number {
        return 0;
    }

    private scaleNumericValues(variable: ModelInteraction | ModelVariable): number {
        return 0;
    }

    private calculateRawScore(patientData: PatientData): number {
        // multiply scaled val by coefficient. Add results to raw score
        // add raw score offset
        return 0;
    }

    private calculateScaledScore(rawScore: number): number {
        // scaled score = 1/(1 + exp(-r))
        // where r = raw score and exp(-r)means number e = 2.718... raised to the power -r
        return 0;
    }

    private calculateFinalScore(scaledScore: number): number {
        //  multiply scaled score by 100 and round to two decimal places
        return 0;
    }

    private getRiskCategory(finalScore: number): string {
        // compare final score to low, mod, high, very high thresholds
        return '';
    }
        
    // calculation steps
    // 1. start with raw score of 0
    // 2. if age-interactions: calculatate age interaction value.
    //      -- multiple value (or numeric value or boolean) by numeric value for ageInMonths (rounded to 1 decimal)
    // 3. scale numeric values
    //      scaled val = (numeric value - mean)/standardDeviation
    // 4. multiply scaled val by coefficient. Add results to raw score
    // 5, add raw score offset
    // 6. compute scaled scor with following equation:
    //      scaled score = 1/(1 + exp(-r))
    //      where r = raw score and exp(-r)means number e = 2.718... raised to the power -r
    // 7. multiply scaled score by 100 and round to two decimal places


}