import { initialPatientData, PatientData } from '../../contexts/PatientData'
import { calculateWAZ } from '../../utils/clinicalVariableCalculator'
import model from '../admission/M6PD-C0-6.json'
import { LogisticRegressionStrategy } from '../ModelStrategy'
import { RiskModel } from '../types'
import testCases from './model0-6C_testCases.json'
// import testCases from './single-test.json'


describe('LogisticRegressionStrategy', () => {
    // using 0-6 clinical admission model
    const strategy = new LogisticRegressionStrategy(model as RiskModel)

    const createPatientDataFromTestCase = (testCase: any): PatientData => {
        // Calculate WAZ using existing util
        const waz = calculateWAZ(testCase.ageInMonths, testCase.sex, testCase.weight)
        console.log('age', testCase.ageInMonths)
        console.log('age floor', Math.floor(testCase.ageInMonths))
        console.log('sex', testCase.sex)
        console.log('weight', testCase.weight)
        console.log('waz', waz)

        return {
            ...initialPatientData,
            
            // basic patient information
            admissionStartedAt: '2024-01-01T00:00:00Z',
            surname: 'Test',
            firstName: 'Patient',
            isUnderSixMonths: true,
            
            // Map test case fields to PatientData
            ageInMonths: testCase.ageInMonths,
            muac: testCase.muac.toString(),
            spo2: testCase.spo2.toString(),
            weight: testCase.weight.toString(),
            sex: testCase.sex.toLowerCase(),
            illnessDuration: testCase.illnessDuration,
            bulgingFontanelle: testCase.bulgingFontanelle,
            isNeonate: testCase.isNeonate,
            neonatalJaundice: testCase.neonatalJaundice ?? false,
            feedingWell: testCase.feedingWell,
            
            // Calculated WAZ
            waz: waz
        }
    }

     describe('Reference Test Cases - Model Validation', () => {
        testCases.forEach((testCaseArray, index) => {
            const [inputData, expectedOutput] = testCaseArray
            
            it(`should match reference case ${index + 1}: ${expectedOutput.riskCategory} risk`, () => {
                const patientData = createPatientDataFromTestCase(inputData)
                const result = strategy.calculateRisk(patientData)
                
                // Test risk score within reasonable tolerance (±0.5%)
                expect(result.riskScore).toBeCloseTo(expectedOutput.riskScore as number, 1)
                
                // Test risk category matches
                expect(result.riskCategory).toBe(expectedOutput.riskCategory)
                
                // Log for manual verification
                console.log(`Test Case ${index + 1}:`)
                console.log(`  Input: Age ${inputData.ageInMonths}mo, MUAC ${inputData.muac}mm, SpO2 ${inputData.spo2}%, WAZ ${patientData.waz?.toFixed(2)}`)
                console.log(`  Expected: ${expectedOutput.riskScore}% (${expectedOutput.riskCategory})`)
                console.log(`  Actual: ${result.riskScore}% (${result.riskCategory})`)
                console.log('---')
            })
        })

    });
})