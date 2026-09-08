import M6PDC06 from './admission/M6PD-C0-6.json';
import M6PDC660 from './admission/M6PD-C6-60.json';
import D06C from './discharge/D0-6C.json';
import D660C from './discharge/D6-60C.json';
import { createModelStrategy, ModelStrategy } from './ModelStrategy';
import { ModelContext, RiskLevel, RiskModel } from './types';


/**
 * Registry of all available models
 */
const MODEL_REGISTRY = {
    admission: {
        under6months: [
            M6PDC06,
        ],
        over6months: [
            M6PDC660
        ]
    },
    discharge: {
        under6months: [
            D06C
        ],
        over6months: [
            D660C
        ]
    }
};

/**
 * Manages loading and selection of risk models
 */
export class ModelSelector {
    private models: Map<string, RiskModel> = new Map();
    private strategies: Map<string, ModelStrategy> = new Map();

    /**
     * Load all models from the models directory
     */
     async loadModels(): Promise<void> {
        try {
            // Load from registry -- TODO load from file system to allow dynamic model import
            const allModels = [
                ...MODEL_REGISTRY.admission.under6months,
                ...MODEL_REGISTRY.admission.over6months,
                ...MODEL_REGISTRY.discharge.under6months,
                ...MODEL_REGISTRY.discharge.over6months
            ];

            // Store models and create strategies
            for (const model of allModels) {
                const typedModel = model as RiskModel;
                this.models.set(typedModel.modelName, typedModel);
                this.strategies.set(typedModel.modelName, createModelStrategy(typedModel));
            }

            console.log(`Loaded ${allModels.length} models`);
        } catch (error) {
            const err = error as Error;
            throw new Error(`Failed to load models: ${err.message}`);
        }
    }


    /**
     * Get appropriate model based on context
     */
    getModel(context: ModelContext): RiskModel | null {
        const compatibleModels = this.getModels(context);

        // Return the first compatible model
        // TODO implement more sophisticated selection logic
        return compatibleModels.length > 0 ? compatibleModels[0] : null;
    }

    /**
     * Get model strategy by model name
     */
    getStrategy(modelName: string): ModelStrategy | null {
        return this.strategies.get(modelName) || null;
    }

    /**
     * Get a model by the name stored alongside a prediction, so a saved prediction can be
     * read back against the model that produced it.
     */
    private getModelByName(modelName: string): RiskModel | null {
        return this.models.get(modelName) || null;
    }

    /**
     * The risk level a model reports under a given display label. A prediction stores its category
     * as the label, so this is how a saved prediction is read back into a level.
     */
    getRiskLevel(modelName: string, label: string): RiskLevel | null {
        const model = this.getModelByName(modelName);
        if (!model) return null;

        const wanted = label.trim().toLowerCase();
        const match = Object.values(model.riskLevels)
            .find(level => level?.label.trim().toLowerCase() === wanted);

        return match ?? null;
    }

    /**
     * A model's levels ranked above a given one, lowest first - the levels a patient in that level
     * could be elevated to. Empty when the model is unknown or the patient is already at its top
     * level.
     */
    getRiskLevelsAbove(modelName: string, current: RiskLevel): RiskLevel[] {
        const model = this.getModelByName(modelName);
        if (!model) return [];

        return Object.values(model.riskLevels)
            .filter((level): level is RiskLevel => level != null && level.threshold > current.threshold)
            .sort((a, b) => a.threshold - b.threshold);
    }

    /**
     * Get all models matching criteria
     */
    getModels(filter?: Partial<ModelContext>): RiskModel[] {
        if (!filter) return Array.from(this.models.values());

        // filter models based on context
        return Array.from(this.models.values()).filter(model => {
            if (filter.isUnderSixMonths !== undefined && model.isUnderSixMonths !== filter.isUnderSixMonths) {
                return false;
            }
            if (filter.usageTime !== undefined && model.usageTime !== filter.usageTime) {
                return false;
            }
            return true;
        });
    }

     /**
     * Get all available model names
     */
    getModelNames(): string[] {
        return Array.from(this.models.keys());
    }

    /**
     * Check if models are loaded
     */
    isLoaded(): boolean {
        return this.models.size > 0;
    }

    /**
     * Get count of loaded models
     */
    getModelCount(): number {
        return this.models.size;
    }
}
