import { useState } from "react";
import { PatientData } from "../contexts/PatientData";
import { getModelSelectorInstance } from "../models/modelSelectorInstance";
import { RiskPrediction } from "../models/types";


export function useRiskCalculation() {
    const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const calculateRisk = async (
        patientData: PatientData,
        usageTime: 'admission' | 'discharge'
    ): Promise<RiskPrediction | null> => {
        setLoading(true);
        setError(null);
        setPrediction(null);

        try {
            const selector = getModelSelectorInstance();

            const model = selector.getModel({
                isUnderSixMonths: patientData.isUnderSixMonths,
                usageTime
            });

            if (!model) {
                throw new Error('No compatible model found');
            }

            const strategy = selector.getStrategy(model.modelName);
            if (!strategy) {
                throw new Error('Strategy not found');
            }

            const result = strategy.calculateRisk(patientData);
            setPrediction(result);
            return result;

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMsg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        prediction,
        loading,
        error,
        calculateRisk
    };
}


// Example usage in component:

// function MyComponent() {
//     const { prediction, loading, error, calculateRisk } = useRiskCalculation();
//     const [patientData, setPatientData] = useState<PatientData>(/* ... */);

//     const handleCalculate = async () => {
//         await calculateRisk(patientData, 'admission');
//     };

//     return (
//         <View>
//             <Button title="Calculate" onPress={handleCalculate} disabled={loading} />
//             {prediction && <Text>Risk: {prediction.riskScore}%</Text>}
//         </View>
//     );
// }