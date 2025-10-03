/**
 * Singleton Instance of Model Selector
*/


import { ModelSelector } from "./ModelSelector";

let modelSelector: ModelSelector | null = null

export function getModelSelectorInstance() {
    if (!modelSelector) {
        modelSelector = new ModelSelector();
    }

    return modelSelector
}

// called at startup
export async function initializeModels(): Promise<ModelSelector> {
    const selector = getModelSelectorInstance();
    
    if (!selector.isLoaded()) {
        await selector.loadModels()
    }

    return selector
}

// reset for testing only
export function resetModelSelector(): void {
    modelSelector = null;
}