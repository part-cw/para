import { PatientData } from "../contexts/PatientDataContext";

export interface ModelContext {
  isUnderSixMonths: boolean;
  usageTime: 'admission' | 'discharge' | string;
}

export interface ModelVariable {
    name: keyof PatientData;
    displayName: string;
    description: string;
    type: string;
    units: string | null;
    required: boolean;
    dependencies?: string[];
    coefficient?: number;
    mean?: number;
    standardDeviation?: number;
    oneOf?: Array<{
        value: any;
        numericValue?: number;
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
    type: string;
    units: string | null;
    required: boolean;
    dependencies: string | {}
    coefficient: number;
    mean: number;
    standardDeviation: number;
}

export interface RiskModel {
    modelName: string;
    humanReadableName: string;
    description: string;
    usageTime: 'admission' | 'discharge' | string;
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
    ageInteractions?: ModelInteraction[];
}

export interface RiskPrediction {
    rawScore: number;
    riskScore: number;
    riskLevel: 'low' | 'moderate' | 'high' | 'veryHigh' | string;
    // missingVariables: string[];
    model: string;
}