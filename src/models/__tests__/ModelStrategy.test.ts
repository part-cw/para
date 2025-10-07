import { initialPatientData, PatientData } from '../../contexts/PatientData'
import { calculateBcsScore, calculateWAZ, getTempSquared } from '../../utils/clinicalVariableCalculator'
import model06 from '../admission/M6PD-C0-6.json'
import model660 from '../admission/M6PD-C6-60.json'
import { LogisticRegressionStrategy } from '../ModelStrategy'
import { RiskModel } from '../types'
import testCases_06 from './test_cases/model0-6C_testCases.json'
import testCases_660 from './test_cases/model6-60_testCases.json'


describe('LogisticRegressionStrategy: 0-6C Model', () => {
    // using 0-6 clinical admission model
    const strategy = new LogisticRegressionStrategy(model06 as RiskModel)

    const createPatientDataFromTestCase = (testCase: any): PatientData => {
        // Calculate WAZ using existing util
        const waz = calculateWAZ(testCase.ageInMonths, testCase.sex, testCase.weight)

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
        testCases_06.forEach((testCaseArray, index) => {
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

describe('LogisticRegressionStrategy: 6-60C Model', () => {
    // using 0-6 clinical admission model
    const strategy = new LogisticRegressionStrategy(model660 as RiskModel)

    // options copied from admissionClinicalData.tsx
    const eyeMovementOptions = [
        {value: 'Watches or follows', key: '1'},
        {value: 'Fails to watch or follow', key: '0'}
    ]

    const motorResponseOptions = [
        {value: 'Normal behaviour observed', key: '2.0'},
        {value: 'Localizes painful stimulus', key: "2"},
        {value: 'Withdraws limb from painful stimulus', key: '1'},
        {value: 'No response/inappropriate response', key: '0'}
    ]

    const verbalResponseOptions = [
        {value: 'Normal behaviour observed', key: '2.0'},
        {value: 'Cries appropriately with pain (or speaks if verbal)', key: '2'},
        {value: 'Moan or abnormal cry with pain', key: '1'},
        {value: 'No vocal response to pain', key: '0'}
    ]

    const createPatientDataFromTestCase = (testCase: any): PatientData => {
        // set up: calculate WAZ and BCS score using existing util
        const eyeScore = eyeMovementOptions.find(opt => 
            opt.value.toLowerCase().includes(testCase.eyeMovement.toLowerCase()))?.key || '0'

        const motorScore = motorResponseOptions.find(opt => 
            opt.value.toLowerCase().includes(testCase.motorResponse.toLowerCase()))?.key || '0'

        const verbalScore = verbalResponseOptions.find(opt => 
            opt.value.toLowerCase().includes(testCase.verbalResponse.toLowerCase()))?.key || '0'
        
        const bcsScore = calculateBcsScore(parseFloat(eyeScore), parseFloat(motorScore), parseFloat(verbalScore))
        console.log('bcsscore', bcsScore)
        
        const waz = calculateWAZ(testCase.ageInMonths, testCase.sex, testCase.weight)
        const tempSquared = getTempSquared(testCase.temperature)

        return {
            ...initialPatientData,
            
            // basic patient information
            admissionStartedAt: '2024-01-01T00:00:00Z',
            surname: 'Test',
            firstName: 'Patient',
            isUnderSixMonths: false,
            
            // Map test case fields to PatientData
            ageInMonths: testCase.ageInMonths,
            muac: testCase.muac.toString(),
            spo2: testCase.spo2.toString(),
            weight: testCase.weight.toString(),
            sex: testCase.sex.toLowerCase(),
            lastHospitalized: testCase.lastHospitalized.toLowerCase(),
            hivStatus: testCase.hivStatus.toLowerCase(),
            rrate: testCase.rrate.toString(),
            temperature: testCase.temperature.toString(), 
              
            // Calculated variables
            waz: waz,
            bcsScore: bcsScore,
            abnormalBCS: bcsScore < 5,
            temperatureSquared: tempSquared
        }
    }

    describe('Reference Test Cases - Model Validation', () => {
        testCases_660.forEach((testCaseArray, index) => {
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