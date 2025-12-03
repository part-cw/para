import { ModelSelector } from "../ModelSelector"
import { getModelSelectorInstance, resetModelSelector } from "../modelSelectorInstance"
import { ModelContext } from "../types"

describe('ModelSelector', () => {
    let selector: ModelSelector

    // make fresh instance of selector before each test case
    beforeEach(() => {
        selector = new ModelSelector()
    })

    describe('loadModels', () => {
        beforeEach(async () => {
            await selector.loadModels()
        })
        
        it('should mark models as loaded', () => {
            expect(selector.isLoaded()).toBe(true)
            expect(selector.getModelCount()).toBeGreaterThan(0)
        } )
        
        it('should load expected number of models from registry', async () => {
            // TODO update exepcted value as we add more models to registry
            expect(selector.getModelCount()).toBe(4);
        });

        it('should create strategies for all loaded models', async () => {
            const modelNames = selector.getModelNames();
            
            for (const modelName of modelNames) {
                const strategy = selector.getStrategy(modelName);
                expect(strategy).not.toBeNull();
            }
        });

        it('should store models with correct keys', async () => {            
            const modelNames = selector.getModelNames();
        
            expect(modelNames).toContain('M6PD-C0-6');
            expect(modelNames).toContain('M6PD-C6-60');
            expect(modelNames).toContain('D0-6C');
            expect(modelNames).toContain('D6-60C');
        });

        it('should handle loading when already loaded', async () => {
            const firstCount = selector.getModelCount();
            
            await selector.loadModels();
            const secondCount = selector.getModelCount();
            
            // Should have the same count (models are replaced, not duplicated)
            expect(secondCount).toBe(firstCount);
        });
    })

    describe('getModel', () => {
        beforeEach(async () => {
            await selector.loadModels();
        });

        it('should return model for under 6 months admission context', () => {
            const context: ModelContext = {
                isUnderSixMonths: true,
                usageTime: 'admission'
            };
            
            const model = selector.getModel(context);
            
            expect(model).not.toBeNull();
            expect(model?.isUnderSixMonths).toBe(true);
            expect(model?.usageTime).toBe('admission');
            expect(model?.modelName).toBe('M6PD-C0-6');
        });

        it('should return model for 6-60 months admission context', () => {
            const context: ModelContext = {
                isUnderSixMonths: false,
                usageTime: 'admission'
            };
            
            const model = selector.getModel(context);
            
            expect(model).not.toBeNull();
            expect(model?.isUnderSixMonths).toBe(false);
            expect(model?.usageTime).toBe('admission');
            expect(model?.modelName).toBe('M6PD-C6-60');
        });

        it('should return model for under six months discharge context', () => {
            const context: ModelContext = {
                isUnderSixMonths: true,
                usageTime: 'discharge'
            };
            
            const model = selector.getModel(context);
            
            expect(model).not.toBeNull();
            expect(model?.isUnderSixMonths).toBe(true);
            expect(model?.usageTime).toBe('discharge');
            expect(model?.modelName).toBe('D0-6C');
        });

        it('should return model for 6-60 months discharge context', () => {
            const context: ModelContext = {
                isUnderSixMonths: false,
                usageTime: 'discharge'
            };
            
            const model = selector.getModel(context);
            
            expect(model).not.toBeNull();
            expect(model?.isUnderSixMonths).toBe(false);
            expect(model?.usageTime).toBe('discharge');
            expect(model?.modelName).toBe('D6-60C');
        });

        it('should return null when no models match context', () => {
            const context: ModelContext = {
                isUnderSixMonths: true,
                usageTime: 'invalid-usage-time' as any
            };
            
            const model = selector.getModel(context);
            
            expect(model).toBeNull();
        });
    });


})

describe('ModelSelector as Singleton', () => {
    afterEach(() => {
        resetModelSelector()
    })

    it('should retrun same instance when create 2 selectors', async () => {
        const selector1 = getModelSelectorInstance()
        const selector2 = getModelSelectorInstance()
        
        expect(selector1).toBe(selector2)
    })
})