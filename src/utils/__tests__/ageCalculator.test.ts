import { AgeCalculator } from "../ageCalculator";


describe('AgeCalculator', () => {
  const FIXED_DATE = new Date('2025-08-26T00:00:00Z'); // control today's date

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('monthToIndex', () => {
    it('should map month keys to correct indices', () => {
      expect(AgeCalculator.__test.monthToIndex('January')).toBe(0);
      expect(AgeCalculator.__test.monthToIndex('December')).toBe(11);
      expect(AgeCalculator.__test.monthToIndex('Test')).toBe(-1);
    });
  });

  describe('createDob', () => {    
    const expectedDate = new Date(2020, 1, 15)
    it('should create correct Date from year and month', () => {
      const dob = AgeCalculator.__test.createDob('2020', 'February');
      expect(dob.toISOString()).toBe(expectedDate.toISOString());
    });
  });

  describe('calculateAgeInYears', () => {
    const invalidInputError = "No valid age information provided. Please supply DOB, birth year/month, or approximate age."
    const validDob = new Date('2022-08-26')

    it('should calculate from dob only', () => {
      const age = AgeCalculator.calculateAgeInYears(validDob, '', '', '');
      expect(age).toBeCloseTo(3, 1);
    });

    it('should calculate from birthYear and birthMonth', () => {
      const age = AgeCalculator.calculateAgeInYears(
        null,
        '2020',
        'August',
        ''
      );
      expect(age).toBeCloseTo(5, 1);
    });

    it('should calculate from approxAge string', () => {
      const age = AgeCalculator.calculateAgeInYears(null, '', '', '3.7');
      expect(age).toBe(3.7);
    });

    it('should throw an error when only birth year provided', () => {
        try {
            AgeCalculator.calculateAgeInYears(null, '2025', '', '');
            // If no error is thrown, fail the test explicitly
            fail('Expected error to be thrown but none was.');
        } catch (e) {
            const err = e as Error;
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBeDefined();
            expect(err.message).toBe(invalidInputError);
        }
    });

    it('should throw an error when dob and birth year provided', () => {
        try {
            AgeCalculator.calculateAgeInYears(validDob, '2025', '', '');
            // If no error is thrown, fail the test explicitly
            fail('Expected error to be thrown but none was.');
        } catch (e) {
            const err = e as Error;
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBeDefined();
            expect(err.message).toBe(invalidInputError);
        }
    });

    it('should throw an error when birth year and approx age provided', () => {
        try {
            AgeCalculator.calculateAgeInYears(null, '2025', '', '3.5');
            // If no error is thrown, fail the test explicitly
            fail('Expected error to be thrown but none was.');
        } catch (e) {
            const err = e as Error;
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBeDefined();
            expect(err.message).toBe(invalidInputError);
        }
    });

    it('should throw an error when all inputs are empty or invalid', () => {
        try {
            AgeCalculator.calculateAgeInYears(null, '', '', '');
            // If no error is thrown, fail the test explicitly
            fail('Expected error to be thrown but none was.');
        } catch (e) {
            const err = e as Error;
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBeDefined();
            expect(err.message).toBe(invalidInputError);
        }
    });

    it('should throw an error when invalid approx age entered', () => {
        try {
            AgeCalculator.calculateAgeInYears(null, '', '', '3.7a');
            // If no error is thrown, fail the test explicitly
            fail('Expected error to be thrown but none was.');
        } catch (e) {
            const err = e as Error;
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBeDefined();
            expect(err.message).toBe("Approximate age is not a valid number.");
        }
    });

    it('should throw an error when future DOB from datepicker', () => {
        const dob = new Date('2025-08-27T00:00:00Z')
        try {
            AgeCalculator.calculateAgeInYears(dob, '', '', '');
            // If no error is thrown, fail the test explicitly
            fail('Expected error to be thrown but none was.');
        } catch (e) {
            const err = e as Error;
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBeDefined();
            expect(err.message).toBe("DOB cannot be in the future");
        }
    });

    it('should throw an error when future DOB from birth year and month', () => {
        const year = '2025'
        const month = 'September'
        try {
            AgeCalculator.calculateAgeInYears(null, year, month, '');
            // If no error is thrown, fail the test explicitly
            fail('Expected error to be thrown but none was.');
        } catch (e) {
            const err = e as Error;
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBeDefined();
            expect(err.message).toBe("DOB (calculated from birth year/month) cannot be in the future");
        }
    });
  });

  describe('getAgeInMonths', () => {
    it('should calculate age in months from dob', () => {
      const dob = new Date('2023-08-26');
      const months = AgeCalculator.getAgeInMonths(dob, null);
      expect(months).toBeCloseTo(24, 1); // ~24 months
    });

    it('should calculate age in months from years', () => {
      const months = AgeCalculator.getAgeInMonths(null, 3);
      expect(months).toBeCloseTo(0.25, 1); // 3 / 12 = 0.25
    });
  });

});

