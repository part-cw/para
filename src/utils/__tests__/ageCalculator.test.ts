import { DropdownItem } from "@/src/components/SearchableDropdown";
import { AgeCalculator } from "../ageCalculator";


describe('monthToIndex', () => {
    const jan: DropdownItem = {key: "Jan", value: "January"}
    const dec: DropdownItem = {key: "Dec", value: "December"}
    const emptyKey = {key: "", value: ""}

    it('returns 0 for January', () => {
        expect(AgeCalculator.__test.monthToIndex(jan)).toBe(0);
    });

    it('returns 11 for December', () => {
        expect(AgeCalculator.__test.monthToIndex(dec)).toBe(11);
    });

    it('returns -1 if key not in month list', () => {
        expect(AgeCalculator.__test.monthToIndex(emptyKey)).toBe(-1);
    });

});

describe('getAgeFromDOB', () => {
    // Mock the current date for consistent testing
    const mockCurrentDate = new Date('2024-06-15T10:00:00Z'); // June 15, 2024
    
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(mockCurrentDate);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    describe('exact age calculations', () => {
        it('should calculate exact whole years', () => {
            const dob = new Date('2020-06-15'); // Exactly 4 years ago
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBe(4.0);
        });

        it('should calculate age with half year (6 months)', () => {
            const dob = new Date('2020-12-15'); // 3.5 years ago
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBe(3.5);
        });

        it('should calculate age with quarter year (3 months)', () => {
            const dob = new Date('2021-03-15'); // 3.25 years ago
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBe(3.25);
        });
    });

    describe('complex date calculations', () => {
        it('should handle birthday that has not occurred this year', () => {
            const dob = new Date('2020-08-15'); // Birthday in August, current date June
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBeCloseTo(3.84, 2); // Approximately 3 years 10 months
        });

        it('should handle birthday that already occurred this year', () => {
            const dob = new Date('2020-03-15'); // Birthday in March, current date June
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBeCloseTo(4.25, 2); // Approximately 4 years 3 months
        });

        it('should handle month boundary with negative days', () => {
            const dob = new Date('2020-05-30'); // May 30
            // Current: June 15, so 1 year, 0 months, 16 days
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBeCloseTo(4.04, 1); // Should be close to 4 years
        });
    });

    describe('edge cases', () => {
        it('should handle leap year births', () => {
            const dob = new Date('2020-02-29'); // Leap year birthday
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBeCloseTo(4.29, 1); // About 4 years 3.5 months
        });

        it('should handle very young children (under 1 year)', () => {
            const dob = new Date('2024-01-15'); // About 5 months ago
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBeCloseTo(0.42, 2); // About 5 months = 0.42 years
        });

        it('should handle newborns (under 1 month)', () => {
            const dob = new Date('2024-06-01'); // 14 days ago
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBeCloseTo(0.04, 2); // About 14 days
        });

        it('should handle same day birth (0 age)', () => {
            const dob = new Date('2024-06-15'); // Today
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBe(0);
        });
    });

    describe.only('month boundary edge cases', () => {
        it('should handle end of month births', () => {
            const dob = new Date('2020-01-31'); // January 31
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBeCloseTo(4.37, 1); // Should handle month with 31 days
        });

        it.only('should handle February to March transition', () => {
            // Set current date to March 15 for this test
            jest.setSystemTime(new Date('2024-03-15T10:00:00Z'));
            
            const dob = new Date('2020-02-15'); // February 15
            const age = AgeCalculator.__test.getAgeInYearsFromDOB2(dob); // TODO fiugre out which function to use
            expect(age).toBe(4.08); // 4 years + 1 month
            
            // Reset to original mock date
            jest.setSystemTime(mockCurrentDate);
        });
    });

    describe('precision and rounding', () => {
        it('should round to 2 decimal places', () => {
            const dob = new Date('2020-04-01'); // Creates a non-round number
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            
            // Check that result has at most 2 decimal places
            const decimalPlaces = (age.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(2);
        });
    });

    describe('future dates (edge case)', () => {
        it('should handle future birth dates', () => {
            const dob = new Date('2025-01-01'); // Future date
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBeLessThan(0); // Should be negative
        });
    });

    describe('historical dates', () => {
        it('should handle very old dates', () => {
            const dob = new Date('1950-06-15'); // 74 years ago
            const age = AgeCalculator.__test.getAgeFromDOB(dob);
            expect(age).toBe(74.0);
        });
    });
});