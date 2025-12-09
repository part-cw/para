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

  // describe('calculateAgeInYears', () => {
  //   const invalidInputError = "No valid age information provided. Please supply DOB, birth year/month, or approximate age."
  //   const validDob = new Date('2022-08-26')

  //   it('should calculate from dob only', () => {
  //     const age = AgeCalculator.calculateAgeInYears(validDob, '', '', '');
  //     expect(age).toBeCloseTo(3, 1);
  //   });

  //   it('should calculate from birthYear and birthMonth', () => {
  //     const age = AgeCalculator.calculateAgeInYears(
  //       null,
  //       '2020',
  //       'August',
  //       ''
  //     );
  //     expect(age).toBeCloseTo(5, 1);
  //   });

  //   it('should calculate from approxAge string', () => {
  //     const age = AgeCalculator.calculateAgeInYears(null, '', '', '3.7');
  //     expect(age).toBe(3.7);
  //   });

  //   it('should throw an error when only birth year provided', () => {
  //       try {
  //           AgeCalculator.calculateAgeInYears(null, '2025', '', '');
  //           // If no error is thrown, fail the test explicitly
  //           fail('Expected error to be thrown but none was.');
  //       } catch (e) {
  //           const err = e as Error;
  //           expect(err).toBeInstanceOf(Error);
  //           expect(err.message).toBeDefined();
  //           expect(err.message).toBe(invalidInputError);
  //       }
  //   });

  //   it('should throw an error when dob and birth year provided', () => {
  //       try {
  //           AgeCalculator.calculateAgeInYears(validDob, '2025', '', '');
  //           // If no error is thrown, fail the test explicitly
  //           fail('Expected error to be thrown but none was.');
  //       } catch (e) {
  //           const err = e as Error;
  //           expect(err).toBeInstanceOf(Error);
  //           expect(err.message).toBeDefined();
  //           expect(err.message).toBe(invalidInputError);
  //       }
  //   });

  //   it('should throw an error when birth year and approx age provided', () => {
  //       try {
  //           AgeCalculator.calculateAgeInYears(null, '2025', '', '3.5');
  //           // If no error is thrown, fail the test explicitly
  //           fail('Expected error to be thrown but none was.');
  //       } catch (e) {
  //           const err = e as Error;
  //           expect(err).toBeInstanceOf(Error);
  //           expect(err.message).toBeDefined();
  //           expect(err.message).toBe(invalidInputError);
  //       }
  //   });

  //   it('should throw an error when all inputs are empty or invalid', () => {
  //       try {
  //           AgeCalculator.calculateAgeInYears(null, '', '', '');
  //           // If no error is thrown, fail the test explicitly
  //           fail('Expected error to be thrown but none was.');
  //       } catch (e) {
  //           const err = e as Error;
  //           expect(err).toBeInstanceOf(Error);
  //           expect(err.message).toBeDefined();
  //           expect(err.message).toBe(invalidInputError);
  //       }
  //   });

  //   it('should throw an error when invalid approx age entered', () => {
  //       try {
  //           AgeCalculator.calculateAgeInYears(null, '', '', '3.7a');
  //           // If no error is thrown, fail the test explicitly
  //           fail('Expected error to be thrown but none was.');
  //       } catch (e) {
  //           const err = e as Error;
  //           expect(err).toBeInstanceOf(Error);
  //           expect(err.message).toBeDefined();
  //           expect(err.message).toBe("Approximate age is not a valid number.");
  //       }
  //   });

  //   it('should throw an error when future DOB from datepicker', () => {
  //       const dob = new Date('2025-08-27T00:00:00Z')
  //       try {
  //           AgeCalculator.calculateAgeInYears(dob, '', '', '');
  //           // If no error is thrown, fail the test explicitly
  //           fail('Expected error to be thrown but none was.');
  //       } catch (e) {
  //           const err = e as Error;
  //           expect(err).toBeInstanceOf(Error);
  //           expect(err.message).toBeDefined();
  //           expect(err.message).toBe("DOB cannot be in the future");
  //       }
  //   });

  //   it('should throw an error when future DOB from birth year and month', () => {
  //       const year = '2025'
  //       const month = 'September'
  //       try {
  //           AgeCalculator.calculateAgeInYears(null, year, month, '');
  //           // If no error is thrown, fail the test explicitly
  //           fail('Expected error to be thrown but none was.');
  //       } catch (e) {
  //           const err = e as Error;
  //           expect(err).toBeInstanceOf(Error);
  //           expect(err.message).toBeDefined();
  //           expect(err.message).toBe("DOB (calculated from birth year/month) cannot be in the future");
  //       }
  //   });
  // });

  describe('getAgeInMonths', () => {
    it('should calculate age in months from dob', () => {
      const dob = new Date('2023-08-26');
      const months = AgeCalculator.calculateAgeInMonths(dob, '', '', '');
      expect(months).toBeCloseTo(24, 1); // ~24 months
    });

    it('should calculate age in months from years', () => {
      const months = AgeCalculator.calculateAgeInMonths(null, '', '', '3');
      const expected = 3*12
      expect(months).toBe(expected);
    });

    it('should calculate approx age in months from yob and mob', () => {
      // current date set to Aug 26 2025
      const months = AgeCalculator.calculateAgeInMonths(null, '2025', 'July', '');
      expect(months).toBeGreaterThan(1)
      expect(months).toBeLessThan(2);
    });

    it('should be close to whole number if current date is 15th', () => {
      const newDate = new Date('2025-08-15T00:00:00Z')
      jest.setSystemTime(newDate);

      const months = AgeCalculator.calculateAgeInMonths(null, '2025', 'July', '');
      expect(months).toBeCloseTo(1, 1)
    });
  });

  describe("calculateAgeInMonthsAtAdmission", () => {
    test("calculates correct age in months for exact year difference", () => {
      const dob = new Date("2020-01-01");
      const admission = new Date("2021-01-01");

      const months = AgeCalculator.calculateAgeInMonthsAtAdmission(dob, admission);

      expect(months).toBeCloseTo(12.0247, 4);
    });

    test("calculates fractional months correctly", () => {
      const dob = new Date("2020-01-01");
      const admission = new Date("2020-04-15"); // ~3.5 months

      const months = AgeCalculator.calculateAgeInMonthsAtAdmission(dob, admission);

      expect(months).toBeCloseTo(3.4497, 4);
    });

    test("returns 0 when dob and admission are same day", () => {
      const dob = new Date("2024-06-10");
      const admission = new Date("2024-06-10");

      const months = AgeCalculator.calculateAgeInMonthsAtAdmission(dob, admission);

      expect(months).toBe(0);
    });

    test("handles leap years correctly", () => {
      const dob = new Date("2020-02-29");
      const admission = new Date("2021-02-28");

      const months = AgeCalculator.calculateAgeInMonthsAtAdmission(dob, admission);

      expect(months).toBeCloseTo(11.9919, 4);
    });
  });

  describe("getAgeInDaysAtAdmission", () => {
    test("calculates correct number of days", () => {
      const dob = new Date("2024-01-01");
      const admission = new Date("2024-01-11");

      const days = AgeCalculator.getAgeInDaysAtAdmission(dob, admission);

      expect(days).toBeCloseTo(10);
    });

    test("handles large differences", () => {
      const dob = new Date("2010-01-01");
      const admission = new Date("2020-01-01");

      const days = AgeCalculator.getAgeInDaysAtAdmission(dob, admission);

      expect(days).toBeCloseTo(3652, 0);
    });

    test("returns 0 for same date", () => {
      const dob = new Date("2023-05-05");
      const admission = new Date("2023-05-05");

      const days = AgeCalculator.getAgeInDaysAtAdmission(dob, admission);

      expect(days).toBe(0);
    });
  });

});