import { initialPatientData, PatientData } from '../../contexts/PatientData'
import model06 from '../admission/M6PD-C0-6.json'
import model660 from '../admission/M6PD-C6-60.json'
import modelD06 from '../discharge/D0-6C.json'
import { AGE_VARIABLE, LogisticRegressionStrategy, TOP_PREDICTOR_COUNT } from '../ModelStrategy'
import { ModelInteraction, RiskModel, TermContribution, TopPredictor } from '../types'

/**
 * Exposes the protected decomposition so how a score divides between variables can be
 * asserted directly. selectTopPredictors filters and slices, so anything about the
 * decomposition as a whole has to be checked against the unfiltered list.
 */
class TestableStrategy extends LogisticRegressionStrategy {
    public terms(data: PatientData): TermContribution[] {
        return this.calculateTermContributions(data)
    }
    public allContributions(data: PatientData): TopPredictor[] {
        return this.calculateAllPredictorContributions(this.calculateTermContributions(data), data)
    }
    public topPredictors(data: PatientData): TopPredictor[] {
        return this.selectTopPredictors(this.allContributions(data), data)
    }
    public wasRecorded(name: string, data: PatientData): boolean {
        return this.wasPredictorRecorded(name, data)
    }
    public interactions(): ModelInteraction[] {
        return this.model.ageInteractions ?? []
    }
    public varMean(name: string): number {
        return this.getVariableMean(name)
    }
    public depMean(interaction: ModelInteraction): number {
        return this.getDependencyMean(interaction)
    }
    public depValue(interaction: ModelInteraction, data: PatientData): number {
        return this.getDependencyValue(interaction, data)
    }
}

const strategy06 = new TestableStrategy(model06 as RiskModel)
const strategy660 = new TestableStrategy(model660 as RiskModel)
const strategyD06 = new TestableStrategy(modelD06 as RiskModel)

/** A 4-month-old: under six months, so the 0-6 model applies, but not a neonate. */
const infant = (overrides: Partial<PatientData> = {}): PatientData => ({
    ...initialPatientData,
    surname: 'Test',
    firstName: 'Patient',
    isUnderSixMonths: true,
    ageInMonths: 4,
    sex: 'female',
    weight: '5.2',
    waz: -1.4,
    muac: '112',
    spo2_admission: '96',
    illnessDuration: '48 hours to 7 days',
    bulgingFontanelle: 'no',
    feedingWell: 'yes',
    isNeonate: false,
    neonatalJaundice: undefined,   // never asked - the question is gated on isNeonate
    ...overrides
})

const child = (overrides: Partial<PatientData> = {}): PatientData => ({
    ...initialPatientData,
    surname: 'Test',
    firstName: 'Patient',
    isUnderSixMonths: false,
    ageInMonths: 24,
    sex: 'male',
    weight: '9.4',
    waz: -1.1,
    muac: '128',
    spo2_admission: '95',
    temperature: '38.4',
    temperatureSquared: 38.4 * 38.4,
    rrate: '44',
    lastHospitalized: 'never',
    hivStatus: 'negative',
    levelOfConsciousness: 'alert',
    abnormalBCS: false,
    ...overrides
})

const dischargeFields = {
    dischargeStatus: 'Routine discharge',
    spo2_discharge: '97',
    feedingStatus_discharge: 'Feeding well'
}

const find = (predictors: TopPredictor[], name: string) =>
    predictors.find(p => p.name === name)

/** The main-effect term for a variable. */
const variableTerm = (terms: TermContribution[], name: string) =>
    terms.find(t => t.variables.length === 1 && t.variables[0] === name)!.contribution

/** Every age-interaction term whose non-age half is `name`. */
const interactionTerms = (terms: TermContribution[], name: string) =>
    terms.filter(t => t.variables.length === 2 && t.variables[1] === name)

/** Every interaction in a model whose non-age half is `name`. */
const interactionsOn = (strategy: TestableStrategy, name: string) =>
    strategy.interactions().filter(i =>
        (typeof i.dependency === 'object' ? Object.keys(i.dependency)[0] : i.dependency) === name)

/**
 * One side's share of an interaction, computed independently of the implementation:
 *   beta_jk * (x_j - xbar_j) * (x_k + xbar_k) / 2
 * A DIFFERENCE from the mean on its own side, a SUM with the mean on the other side.
 */
const expectedShare = (
    strategy: TestableStrategy,
    interaction: ModelInteraction,
    patient: PatientData,
    self: 'age' | 'dependency'
) => {
    const beta = interaction.coefficient / interaction.standardDeviation
    const age = patient.ageInMonths!
    const ageMean = strategy.varMean(AGE_VARIABLE)
    const dep = strategy.depValue(interaction, patient)
    const depMean = strategy.depMean(interaction)

    return self === 'age'
        ? beta * (age - ageMean) * (dep + depMean) / 2
        : beta * (dep - depMean) * (age + ageMean) / 2
}


describe('interaction attribution follows the Shapley product-term formula', () => {
    const patient = child()
    const terms = strategy660.terms(patient)
    const contributions = strategy660.allContributions(patient)

    const share = (interaction: ModelInteraction, self: 'age' | 'dependency') =>
        expectedShare(strategy660, interaction, patient, self)

    it('gives the dependency variable its main effect plus its interaction share', () => {
        const ageRrate = interactionsOn(strategy660, 'rrate')
        expect(ageRrate).toHaveLength(1)

        expect(find(contributions, 'rrate')!.contribution).toBeCloseTo(
            variableTerm(terms, 'rrate') + share(ageRrate[0], 'dependency'), 12)
    })

    it('gives age its main effect plus a share of every interaction', () => {
        expect(strategy660.interactions()).toHaveLength(9)   // M6PD-C6-60 has 9 age interactions

        const expected = variableTerm(terms, AGE_VARIABLE)
            + strategy660.interactions().reduce((total, i) => total + share(i, 'age'), 0)

        expect(find(contributions, AGE_VARIABLE)!.contribution).toBeCloseTo(expected, 12)
    })

    it('is NOT simply half the centred interaction term', () => {
        // the earlier, incorrect approach. it differs by the covariance between the two
        // variables, so this guards against reverting to it.
        const ageRrate = interactionsOn(strategy660, 'rrate')[0]
        const halfCentredTerm = 0.5 * interactionTerms(terms, 'rrate')[0].contribution

        expect(share(ageRrate, 'dependency')).not.toBeCloseTo(halfCentredTerm, 6)
    })

    it('has both shares of one interaction total beta*(x_j*x_k - xbar_j*xbar_k)', () => {
        const interaction = interactionsOn(strategy660, 'rrate')[0]
        const beta = interaction.coefficient / interaction.standardDeviation
        const age = patient.ageInMonths!
        const dep = strategy660.depValue(interaction, patient)

        const bothShares = share(interaction, 'age') + share(interaction, 'dependency')
        const expected = beta * (age * dep - strategy660.varMean(AGE_VARIABLE) * strategy660.depMean(interaction))

        expect(bothShares).toBeCloseTo(expected, 12)
    })

    it('aggregates several interactions onto one categorical variable', () => {
        // lastHospitalized has one interaction per non-reference level, each pinned to that
        // level, so each uses that level's own prevalence as xbar_k
        const hospitalized = interactionsOn(strategy660, 'lastHospitalized')
        expect(hospitalized).toHaveLength(4)

        const expected = variableTerm(terms, 'lastHospitalized')
            + hospitalized.reduce((total, i) => total + share(i, 'dependency'), 0)

        expect(find(contributions, 'lastHospitalized')!.contribution).toBeCloseTo(expected, 12)
    })

    it('uses the pinned level prevalence as xbar_k, not the parent variable mean', () => {
        const oneMonthToYear = strategy660.interactions()
            .find(i => i.name === 'ageHospitalizedOneMonthToOneYear')!

        // from M6PD-C6-60.json, lastHospitalized "1 month to 1 year ago" has mean 0.2447
        expect(strategy660.depMean(oneMonthToYear)).toBeCloseTo(0.2447, 4)
    })

    it('attributes an object dependency to its variable, not a stringified object', () => {
        // ageHivPositive is declared as {hivStatus: 'Positive'}
        expect(interactionTerms(terms, 'hivStatus')).toHaveLength(1)
        expect(find(contributions, 'hivStatus')).toBeDefined()
        expect(contributions.map(c => c.name).join(',')).not.toContain('object')
    })
})


describe('derived variables are merged into the concept they belong to', () => {
    const patient = child({
        temperature: '34.5',
        temperatureSquared: 34.5 * 34.5,
        spo2_admission: '84',
        muac: '100',
        ageInMonths: 50
    })
    const terms = strategy660.terms(patient)
    const contributions = strategy660.allContributions(patient)

    it('never reports temperatureSquared or abnormalBCS on their own', () => {
        const names = contributions.map(c => c.name)
        expect(names).not.toContain('temperatureSquared')
        expect(names).not.toContain('abnormalBCS')
    })

    it('folds temperatureSquared into temperature', () => {
        expect(find(contributions, 'temperature')!.contribution).toBeCloseTo(
            variableTerm(terms, 'temperature') + variableTerm(terms, 'temperatureSquared'), 12)
    })

    it('folds abnormalBCS into the recorded level of consciousness', () => {
        const expected = variableTerm(terms, 'abnormalBCS')
            + interactionsOn(strategy660, 'abnormalBCS')
                .reduce((total, i) => total + expectedShare(strategy660, i, patient, 'dependency'), 0)

        expect(find(contributions, 'levelOfConsciousness')!.contribution).toBeCloseTo(expected, 12)
    })

    it('would otherwise let temperature occupy two of three slots', () => {
        // the reason the merge exists: both raw terms outrank most other variables here
        const top = strategy660.topPredictors(patient).map(p => p.name)
        expect(top).toContain('temperature')
        expect(top).toHaveLength(TOP_PREDICTOR_COUNT)
        expect(new Set(top).size).toBe(top.length)   // no concept listed twice
    })
})


describe('variables that were never measured', () => {
    it('are dropped from the reported predictors', () => {
        // A 4-month-old is scored by the 0-6 model but is not a neonate, so the jaundice
        // question is never asked and must not be reported as a driver.
        const patient = infant()
        expect(patient.neonatalJaundice).toBeUndefined()

        const reported = strategy06.topPredictors(patient).map(p => p.name)
        expect(reported).not.toContain('neonatalJaundice')
    })

    it('still carry their interaction share internally, so conservation holds', () => {
        const patient = infant()
        const jaundice = find(strategy06.allContributions(patient), 'neonatalJaundice')

        // its own coefficient is 0 in M6PD-C0-6, but ageJaundice still reads the missing
        // dependency as 0, which sits off the training mean
        expect(jaundice).toBeDefined()
        expect(jaundice!.contribution).not.toBe(0)
    })

    it('does NOT drop a recorded false - that is a real finding', () => {
        // A neonate who was asked and answered "no" stores '0', which parseVariableValue
        // reads back as boolean false. false is falsy but not null/undefined/'', so it is a
        // measurement and must keep contributing. A truthiness check would silently drop it.
        const patient = infant({
            ...dischargeFields,
            ageInMonths: 0.5,
            isNeonate: true,
            neonatalJaundice: false as unknown as string
        })

        expect(strategyD06.wasRecorded('neonatalJaundice', patient)).toBe(true)
        expect(Boolean(patient.neonatalJaundice)).toBe(false)   // a truthiness check WOULD drop it

        // "not jaundiced" genuinely differs from a cohort where 7.9% were jaundiced
        expect(variableTerm(strategyD06.terms(patient), 'neonatalJaundice')).toBeCloseTo(0.013429, 6)
    })
})


describe('ranking', () => {
    it('reports at most TOP_PREDICTOR_COUNT, ordered by descending magnitude', () => {
        const reported = strategy660.topPredictors(child())

        expect(reported.length).toBeLessThanOrEqual(TOP_PREDICTOR_COUNT)
        for (let i = 1; i < reported.length; i++) {
            expect(Math.abs(reported[i - 1].contribution))
                .toBeGreaterThanOrEqual(Math.abs(reported[i].contribution))
        }
    })

    it('ranks a protective variable above a weaker harmful one', () => {
        // a well-nourished child: MUAC pulls risk down hard, and should still rank
        const reported = strategy660.topPredictors(child({ muac: '175', waz: 2.5 }))
        const negatives = reported.filter(p => p.contribution < 0)
        expect(negatives.length).toBeGreaterThan(0)
    })

    it('breaks ties deterministically by name', () => {
        // two variables engineered to equal magnitude, opposite sign
        const synthetic = {
            modelName: 'SYNTH', humanReadableName: 'Synthetic', description: '',
            usageTime: 'admission', isUnderSixMonths: false,
            modelType: 'logistic_regression', inputType: 'clinical',
            riskThresholds: { low: 0, moderate: 2, high: 5, veryHigh: 10 },
            rawScoreOffset: 0,
            variables: [
                { name: 'weight', displayName: 'W', description: '', type: 'number', units: null, required: false, coefficient: 2, mean: 0, standardDeviation: 1 },
                { name: 'muac', displayName: 'M', description: '', type: 'number', units: null, required: false, coefficient: -2, mean: 0, standardDeviation: 1 },
            ]
        } as RiskModel

        const strategy = new TestableStrategy(synthetic)
        const patient = { ...initialPatientData, weight: '1', muac: '1' }

        const first = strategy.allContributions(patient)
        expect(Math.abs(first[0].contribution)).toBe(Math.abs(first[1].contribution))
        expect(first.map(p => p.name)).toEqual(['muac', 'weight'])
        expect(strategy.allContributions(patient).map(p => p.name)).toEqual(first.map(p => p.name))
    })
})


describe('calculateRisk output', () => {
    it('carries top predictors alongside the score', () => {
        const result = strategy660.calculateRisk(child())

        expect(result.topPredictors).toBeDefined()
        expect(result.topPredictors!.length).toBeGreaterThan(0)
        expect(result.topPredictors!.length).toBeLessThanOrEqual(TOP_PREDICTOR_COUNT)

        for (const predictor of result.topPredictors!) {
            expect(typeof predictor.name).toBe('string')
            expect(Number.isFinite(predictor.contribution)).toBe(true)
        }
    })
})
