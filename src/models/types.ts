import { PatientData } from "../contexts/PatientData";

type SingleKeyValueObject = { [key: string]: string };

export interface ModelContext {
  isUnderSixMonths: boolean;
  usageTime: 'admission' | 'discharge' | string;
}

export interface Option {
    value: any;
    label?: string;
    description: string;
    coefficient?: number;
    mean?: number;
    standardDeviation?: number;
}

export interface ModelVariable {
    name: keyof PatientData;
    displayName: string;
    description: string;
    type: string;
    units: string | null;
    required: boolean;
    /**
     * An array lists the fields this variable is derived from (waz comes from weight, sex
     * and age). A single string names a PatientData flag that gates whether the variable
     * applies at all - neonatalJaundice is only asked when isNeonate is true.
     */
    dependencies?: string | string[];
    coefficient?: number;
    mean?: number;
    standardDeviation?: number;
    oneOf?: Option[];
}

export interface ModelInteraction {
    name: string;
    displayName: string;
    description: string;
    type: string;
    units: string | null;
    required: boolean;
    dependency: string | SingleKeyValueObject;
    dependencyType: string;
    coefficient: number;
    mean: number;
    standardDeviation: number;
}

/**
 * One risk level of a model: the risk score at which a patient enters it, the name it is
 * shown under, and the average post-discharge mortality risk of the level.
 */
export interface RiskLevel {
    /** Lowest risk score, as a percentage, that falls in this level */
    threshold: number;
    /** How the level is named in the UI and stored in RiskPrediction.riskCategory */
    label: string;
    /** Approximate post-discharge mortality risk for the level, as a percentage */
    mortalityRisk: number;
}

export interface RiskModel {
    modelName: string;
    humanReadableName: string;
    description: string;
    usageTime: 'admission' | 'discharge' | string;
    isUnderSixMonths: boolean;
    modelType: 'logistic_regression' | string;
    inputType: 'clinical' | string;
    /** 'low' is absent in models whose lowest level is 'moderate' */
    riskLevels: {
        low?: RiskLevel;
        moderate: RiskLevel;
        high: RiskLevel;
        veryHigh: RiskLevel;
    };
    rawScoreOffset: number;
    variables: ModelVariable[];
    ageInteractions?: ModelInteraction[];
}

/**
 * One additive term of a linear predictor and the log-odds effect it carries.
 * Terms with two owners (age interactions) share their effect evenly between them.
 */
export interface TermContribution {
    /** The model's name for this term, e.g. 'muac' or 'ageHospitalizedUnderSevenDays' */
    name: string;
    /** PatientData keys this term involves (2 for an age interaction) */
    variables: string[];
    contribution: number;
}

export interface TopPredictor {
  name: string;          // Feature name (e.g., 'temperature', 'waz')
  contribution: number;  // Signed SHAP value in log-odds space; positive raises risk
  value?: string;        // Actual value for this patient, when available
}

/** Everything a risk calculation worked out for one patient, for logging and diagnostics. */
export interface ScoreBreakdown {
    patientData: PatientData;
    terms: TermContribution[];
    /** Every variable's contribution, ranked */
    contributions: TopPredictor[];
    topPredictors: TopPredictor[];
    rawScore: number;
    riskScore: number;
    riskCategory: string;
}

export interface RiskPrediction {
    riskScore: number;
    /** The active level's display label ('Very High'). Raised by a manual elevation. */
    riskCategory: string;
    model: string;
    /**
     * The level the model placed the patient in, carrying the mortality risk reported for every
     * patient in that level. A manual elevation does not move this: an elevated prediction still
     * reports the estimate that was made for the calculated level.
     */
    calculatedLevel?: RiskLevel;
    topPredictors?: TopPredictor[];
    isManuallyElevated?: boolean;
    originalRiskCategory?: string; // model-calculated category when there's a manual elevation
    calculatedAt?: string; // when the prediction was calculated
}

/**
 * 'admission' is most recently calculated risk using admission models.
 * 'discharge' is risk calcualted at discharge, using discharge model.
 * 'override' is a map of overriden admission or discharge risk categories, 
 * where key is either 'admission' or 'discharge' and value is the new category
 */
export interface RiskAssessment {
  admission?: RiskPrediction | null;
  discharge?: RiskPrediction | null;
  override?: Map<'admission' | 'discharge', string>;
}