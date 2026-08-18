import { PatientData } from "../contexts/PatientData";
import { ModelInteraction, ModelVariable, RiskModel, RiskPrediction, ScoreBreakdown, TermContribution, TopPredictor } from "./types";

/** The variable every age interaction shares a half of */
export const AGE_VARIABLE = 'ageInMonths';

/** How many predictors to report on the risk display */
export const TOP_PREDICTOR_COUNT = 3;

/**
 * Model variables reported under another variable they are a facet of, so that one
 * clinical concept cannot occupy more than one slot in the top predictors.
 */
const PREDICTOR_ALIASES: Record<string, string> = {
    temperatureSquared: 'temperature',      // quadratic pair - report the combined effect
    abnormalBCS: 'levelOfConsciousness',    // flag derived from the recorded level
};

/**
 * Abstract base class for risk model strategies.
 * Concrete subclasses implement model-specific logic for calculating risk scores.
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
            const terms = this.calculateTermContributions(patientData) // model-specific: additive terms in the model
            const rawScore = this.sumContributions(terms)
            const riskScore = this.convertToRiskScore(rawScore) // model-specific: convert raw score to a percentage
            const riskCategory = this.getRiskCategory(riskScore)
            const contributions = this.calculateAllPredictorContributions(terms, patientData)
            const topPredictors = this.selectTopPredictors(contributions, patientData)
            this.logContributions({ patientData, terms, contributions, topPredictors, rawScore, riskScore, riskCategory })

            return {
                riskScore,
                riskCategory,
                model: this.model.modelName,
                topPredictors
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
                 // handle neonatal jaundice -- TODO - do this dynamically for all conditionally required varaibles
                if (variable.name === 'neonatalJaundice' && !patientData.isNeonate) {
                    break;
                }

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
        if ((interactions && interactions.length > 0) && typeof patientData.ageInMonths !== 'number') {
            throw new Error('Age in months is required for models with age interactions');
        }
    }

    /**
     * Calculate the individual terms of the score, each tagged with the
     * variable(s) its effect belongs to. Model-type specific. A model type that cannot decompose its
     * score returns no terms.
     */
    protected abstract calculateTermContributions(patientData: PatientData): TermContribution[];

    /**
     * Convert a raw score into a risk percentage. Model-type specific.
     */
    protected abstract convertToRiskScore(rawScore: number): number;

    /**
     * Combine terms into the raw score.
     */
    protected sumContributions(terms: TermContribution[]): number {
        return terms.reduce((score, term) => score + term.contribution, this.model.rawScoreOffset);
    }

    /**
     * Combine patient data into a single raw score.
     *
     * Convenience for callers that only want the number and do not need the contributions or breakdown.
     */
    protected calculateRawScore(patientData: PatientData): number {
        return this.sumContributions(this.calculateTermContributions(patientData));
    }

    /**
     * Per-variable contributions to the score, ranked by magnitude. Model-type specific.
     * A model type that cannot decompose its score reports none.
     * Takes the score's calculated terms so these may be reused for some model types.
     */
    protected calculateAllPredictorContributions(_terms: TermContribution[], _patientData: PatientData): TopPredictor[] {
        return [];
    }

    /**
     * The variables that most influenced this patient's score, most influential first.
     */
    protected selectTopPredictors(contributions: TopPredictor[], patientData: PatientData): TopPredictor[] {
        return contributions
            .filter(predictor => this.wasPredictorRecorded(predictor.name, patientData))
            .slice(0, TOP_PREDICTOR_COUNT);
    }

    /**
     * Hook for a model type to report how it reached a score, called on every calculation.
     *
     * Prints nothing by default: what is worth saying about a score, and in what terms, is
     * specific to how the model type computes it.
     */
    protected logContributions(_breakdown: ScoreBreakdown): void {}

    /**
     * Whether this patient has a recorded value for a variable. A variable that was never
     * collected still picks up a share of its age interaction, because the interaction reads
     * a missing dependency as 0 and 0 sits off the training mean - so it must be dropped
     * rather than reported as driving a risk nobody measured.
     */
    protected wasPredictorRecorded(name: string, patientData: PatientData): boolean {
        const value = patientData[name as keyof PatientData];
        return value !== null && value !== undefined && value !== '';
    }

    /**
     * Get a risk category from the risk score based on the model's thresholds.
     */
    protected getRiskCategory(riskScore: number): string {
        if (riskScore < 0) throw Error('Risk score cannot be negative')
        if (riskScore > 100) throw Error('Risk score cannot be more than 100%')

        // store 'low' threshold if it exists in model
        let low
        if (this.model.riskThresholds.low != null) {
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
}

/**
 * Logistic regression risk model. Computes a linear predictor from the model's
 * scaled variables and age interactions, then maps it to a probability with the
 * logistic function.
 */
export class LogisticRegressionStrategy extends ModelStrategy {
    constructor(model: RiskModel) {
        if (model.modelType !== 'logistic_regression') {
            throw new Error('LogisticRegressionStrategy only supports LR models')
        }
        super(model)
    }

    /**
     * Calculates each term of the logistic regression model in log-odds space including
     * the interaction terms in a model.
     * @param patientData Data for the patient having the score calculated
     * @returns one term per model variable and per interaction term
     */
    protected calculateTermContributions(patientData: PatientData): TermContribution[] {
        const terms: TermContribution[] = this.model.variables.map(variable => ({
            name: variable.name,
            variables: [variable.name],
            contribution: this.calculateVariableContribution(variable, patientData)
        }));

        // add interaction contributions
        if (this.model.ageInteractions) {
            for (const interaction of this.model.ageInteractions) {
                terms.push({
                    name: interaction.name,
                    variables: [AGE_VARIABLE, this.getDependencyName(interaction)],
                    contribution: this.calculateInteractionContribution(interaction, patientData)
                });
            }
        }

        return terms;
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

        if (variable.type === 'string' && variable.oneOf) {
            return this.calculateCategoricalVariableContribution(variable, rawValue)
        }
       
        const numericValue = this.extractNumericValue(variable, rawValue);
        const stats = this.extractStats(variable, rawValue)
        const scaledValue = this.scaleValue(numericValue, stats.mean || 0, stats.standardDeviation || 1);

        return scaledValue * (stats.coefficient || 0);
    }

    /**
     * 
     * calculates contribution of a scaled age interaction
     */ 
    protected calculateInteractionContribution(interaction: ModelInteraction, patientData: PatientData): number {
        const age = patientData.ageInMonths!;
        const dependencyValue = this.getDependencyValue(interaction, patientData);
        const interactionValue = age * dependencyValue;
        const scaledValue = this.scaleValue(interactionValue, interaction.mean, interaction.standardDeviation);
        return scaledValue * interaction.coefficient;
    }

    /**
     * Per-variable SHAP contributions, ranked by magnitude, unfiltered and unsliced.
     *
     * Simplified linear SHAP, in log-odds:
     *
     *     phi_j = beta_j*(x_j - xbar_j) + SUM_k beta_jk*(x_j - xbar_j)*(x_k + xbar_k)/2
     *
     * where beta is the coefficient scaled by the term's standard deviation only (no mean
     * subtraction), x is the patient's value and xbar the training mean.
     *
     * The interaction part is the exact Shapley value for a two-variable product term: note
     * it takes the *difference* from the mean for j but the *sum* with the mean for k. This
     * is not the same as the centred product term the score itself uses. This function should
     * thus be called just for an explanation feature, not as part of the score computation itself.
     *
     * Only the interaction contributions are different than the actual score calculation.
     * A main effect is already exactly beta_j*(x_j - xbar_j), so the score's own single-variable terms 
     * are used as they are.
     */
    protected calculateAllPredictorContributions(terms: TermContribution[], patientData: PatientData): TopPredictor[] {
        const totals = new Map<string, number>();

        const add = (variable: string, contribution: number) => {
            const name = PREDICTOR_ALIASES[variable] ?? variable;
            totals.set(name, (totals.get(name) ?? 0) + contribution);
        };

        // main effects: beta_j*(x_j - xbar_j), already computed as the score's own terms
        for (const term of terms.filter(term => term.variables.length === 1)) {
            add(term.variables[0], term.contribution);
        }

        // interaction shares, one to each of the two variables involved
        for (const interaction of this.model.ageInteractions ?? []) {
            const shares = this.calculateInteractionShares(interaction, patientData);
            add(AGE_VARIABLE, shares.age);
            add(this.getDependencyName(interaction), shares.dependency);
        }

        // rank by magnitude - a variable that lowered the risk is as notable as one that
        // raised it. the name comparison break possible ties.
        return [...totals]
            .map(([name, contribution]) => ({ name, contribution }))
            .sort((a, b) =>
                (Math.abs(b.contribution) - Math.abs(a.contribution)) || a.name.localeCompare(b.name));
    }

    /**
     * How one age interaction's effect divides between age and the variable it interacts
     * with. Each side takes its own deviation from the mean against the other side's sum
     * with the mean.
     */
    protected calculateInteractionShares(
        interaction: ModelInteraction,
        patientData: PatientData
    ): { age: number, dependency: number } {
        const beta = interaction.coefficient / interaction.standardDeviation;
        const age = patientData.ageInMonths!;
        const ageMean = this.getVariableMean(AGE_VARIABLE);

        const dependency = this.getDependencyValue(interaction, patientData);
        const dependencyMean = this.getDependencyMean(interaction);

        return {
            age: beta * (age - ageMean) * (dependency + dependencyMean) / 2,
            dependency: beta * (dependency - dependencyMean) * (age + ageMean) / 2,
        };
    }

    /**
     * Training mean of a model variable.
     */
    protected getVariableMean(name: string): number {
        const variable = this.model.variables.find(v => v.name === name);
        if (!variable) throw new Error(`Variable ${name} is not in model ${this.model.modelName}`);
        return variable.mean ?? 0;
    }

    /**
     * Training mean of the variable on the non-age side of an interaction.
     *
     * An interaction pinned to one categorical level (e.g. {lastHospitalized: '1 month to 1
     * year ago'}) is a 0/1 dummy for that level, so its mean is that level's prevalence
     * rather than anything about the parent variable.
     */
    protected getDependencyMean(interaction: ModelInteraction): number {
        const name = this.getDependencyName(interaction);
        const variable = this.model.variables.find(v => v.name === name);
        if (!variable) throw new Error(`Interaction ${interaction.name} depends on ${name}, which is not in model ${this.model.modelName}`);

        if (typeof(interaction.dependency) === 'object') {
            const level = String(Object.values(interaction.dependency)[0]).trim().toLowerCase();
            const option = variable.oneOf?.find(o => String(o.value).trim().toLowerCase() === level);
            // a variable declared boolean carries the pinned level's prevalence as its own mean
            if (option) return option.mean ?? 0;
        }

        return variable.mean ?? 0;
    }

    /**
     * Prints the score's own terms, then the per-variable SHAP contributions.
     * All figures are in log-odds, not percentage points, so they are additive on
     * the raw score but not on the risk percentage. The per-variable SHAP contributions
     * including their portion (50%) of any age interactions.
     *
     * The two sections do not agree term by term, and are not meant to: the score centres an
     * interaction on the mean of the product, while its SHAP shares are measured against the
     * product of the means.
     */
    protected logContributions(breakdown: ScoreBreakdown): void {
        const { patientData, terms, contributions, topPredictors } = breakdown;

        const signed = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(6)}`;
        const reported = new Set(topPredictors.map(p => p.name));

        const lines = [
            `📊 ${this.model.modelName} score breakdown (log-odds)`,
            `   score terms  (interactions centred on the mean of the product):`,
            ...terms.map(term => {
                const involves = term.variables.length > 1 ? `   ${term.variables.join(' x ')}` : '';
                return `     ${term.name.padEnd(34)} ${signed(term.contribution)}${involves}`;
            }),
            `   SHAP contributions (interactions measured againsts the product of the means):`,
            ...contributions.map(predictor => {
                const note = reported.has(predictor.name) ? '  <- shown to user'
                    : !this.wasPredictorRecorded(predictor.name, patientData) ? '  (not recorded for this patient)'
                    : '';
                return `     ${predictor.name.padEnd(34)} ${signed(predictor.contribution)}${note}`;
            }),
        ];

        console.log(lines.join('\n'));
    }

    /**
     * The PatientData key an interaction's non-age half refers to, for either dependency
     * shape - a bare variable name, or a single-entry object pinning one categorical level.
     */
    protected getDependencyName(interaction: ModelInteraction): string {
        const { dependency } = interaction;
        return (typeof(dependency) === 'object') ? Object.keys(dependency)[0] : dependency;
    }

    protected getDependencyValue(interaction: ModelInteraction, patientData: PatientData): number {
        const { dependency, dependencyType } = interaction;

        if (typeof(dependency) === 'object') {
            // Handle object dependencies (e.g., {illnessDuration: '48h-7d'})
            const varName = this.getDependencyName(interaction);
            const requiredValue = Object.values(dependency)[0]; // e.g '48h-7d'
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
     * 
     * @param variable 
     * @param value 
     * @returns total contribution of categorical variables - selected options have value of 1 and nonselected 0
     */
    private calculateCategoricalVariableContribution(variable: ModelVariable, value: any): number {
        let categoricalContribution = 0

        // find contribution of selected option
        const selected = this.getOption(variable, value)
        const selNumeric = (selected.coefficient !== undefined) ? 1 : 0
        const selScaled = this.scaleValue(selNumeric, selected.mean || 0, selected.standardDeviation || 1)
        categoricalContribution += selScaled * (selected.coefficient || 0)

        // find contribution of non-selected options
        const nonselected = variable.oneOf?.filter(
            opt => opt.value.trim().toLowerCase() !== value.trim().toLowerCase())
        
        if (nonselected && nonselected.length > 0) {
            for (const option of nonselected) {
                const numVal = 0 // all unselected options have value of 0
                const scaled = this.scaleValue(numVal, option.mean || 0, option.standardDeviation || 1)
                categoricalContribution += scaled * (option.coefficient || 0)
            }
        }

        return categoricalContribution;
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

    /**
     * 
     * @param val the value of the variable
     * @param mean the mean from the dataset used to build the model
     * @param sd standard deviation from the dataset used to build the model
     * @returns
     */
    protected scaleValue(val: number, mean: number, sd: number): number {
        return (val-mean) / sd
    }
}

/**
 * Factory function to create appropriate model strategy
 */
export function createModelStrategy(model: RiskModel): ModelStrategy {
    switch (model.modelType) {
        case 'logistic_regression':
            return new LogisticRegressionStrategy(model);
        default:
            throw new Error(`Unsupported model type: ${model.modelType}`);
    }
}
