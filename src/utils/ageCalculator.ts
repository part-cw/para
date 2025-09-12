/**
 * Calculated estimated age from DOB variable OR birth year/month OR approxAge
 *  Not exact age measurements
 */

//  * TODO used for WAZ score calculations -- take floor (use months completed)
//  * TODO for model calculation - round to 1 decimal place

import { MAX_PATIENT_AGE } from "../config";
import { ageRangeErrorMessage, isValidAgeRange } from "./inputValidator";

export class AgeCalculator {

    private static msPerDay = (1000 * 60 * 60 * 24)

    // Returns estimated age in years
    /**
     * 
     * @param dob 
     * @param birthYear 
     * @param birthMonth 
     * @param approxAge 
     * @returns unrounded age in years (e.g. 3.5) based on available input. Throws error if invalid or missing input
     */
    static calculateAgeInYears(
        dob: Date|null, 
        birthYear: string, 
        birthMonth: string, 
        approxAge: string
    ): number {
        if (dob && !birthYear && !birthMonth && !approxAge) {
            const age = this.getAgeInYearsFromDOB(dob)
            if (age < 0) {
                throw new Error("DOB cannot be in the future");
            }
            
            if (age > MAX_PATIENT_AGE) {
                throw new Error(ageRangeErrorMessage)
            }
           
            return age;
        } else if (birthYear && birthMonth && !dob && !approxAge) {
            const newDob = this.createDob(birthYear, birthMonth)
            const age = this.getAgeInYearsFromDOB(newDob)
            if (age < 0) {
                throw new Error("DOB (calculated from birth year/month) cannot be in the future")
            }
            
            if (age > MAX_PATIENT_AGE) {
                throw new Error(ageRangeErrorMessage)
            }
            
            return age;
        } else if (approxAge && !dob && !birthMonth && !birthYear) {
            const age = Number(approxAge.trim())

            if (!age) {
                throw new Error('Approximate age is not a valid number.')
            }

            if(!isValidAgeRange(age)) {
                throw new Error(ageRangeErrorMessage)
            }
            
            const parsed = Number(approxAge);
            return parsed
        } 

        throw new Error("No valid age information provided. Please supply DOB, birth year/month, or approximate age.");
    }

     /**
     * @param dob entered DOB or created from birthYear and birthMonth
     * @returns age in days from DOB and now
     */
    static getAgeInDaysFromDob(dob: Date): number {
        const now = new Date();
        const diffTime = now.getTime() - dob.getTime(); // time is ms
        const diffDays = diffTime / this.msPerDay;
        
        return diffDays;
    }

    /**
     * 
     * @param dob entered from Date Picker
     * @returns age in years (eg. 3.5 years)
     */
    private static getAgeInYearsFromDOB(dob: Date): number {
        const diffDays = this.getAgeInDaysFromDob(dob)

        // Average 365.25 days/year. Source: https://www.grc.nasa.gov/www/k-12/Numbers/Math/Mathematical_Thinking/calendar_calculations.htm
        // TODO - use 31557600 seconds per year instead? -- from old PARA
        const diffYears = diffDays / 365.25
        
        return  diffYears
    }

    /**
     * 
     * @param birthYear entered manually - assume valid input
     * @param birthMonth entered manually - assume valid input
     * @returns creates DOB in Date formate. Assumes birth date is 15th of birth year
     */
    static createDob(birthYear: string, birthMonth: string): Date {
        const birthMonthIndex = this.monthToIndex(birthMonth)
        const dob = new Date(Number(birthYear), birthMonthIndex, 15)
        return dob
    }

    /**
     * 
     * 0-indexed month to num mapping; matches new Date().getMonth indexing
     *
     */
    private static monthToIndex(month: string): number {
        const monthMap: Record<string, number> = {
            January: 0,
            February: 1,
            March: 2,
            April: 3,
            May: 4,
            June: 5,
            July: 6,
            August: 7,
            September: 8,
            October: 9,
            November: 10,
            December: 11,
        };

        return monthMap[month] ?? -1; // -1 if not found
    }

    /**
     * @param age can be age in months or years
     * @returns rounds age to 1 decimal place
     */
    static roundAge(age: number): number {
        return Math.round(age * 10) / 10;
    }

    /**
     * 
     * @param dob entered DOB or created from birthYear and birthMonth; null if unavailabe 
     * @param approxAge raw, unrounded approximate age in years. Used if only have approxAge; null if dob available
     * @param birthYear
     * @param birthMonth 
     * @returns age in months, unrounded. 
     * Assumes of one don OR (birthYearn and birthMonth) OR approx age are available and validated
     */
    static calculateAgeInMonths(dob: Date | null, birthYear: string, birthMonth: string, approxAge: string): number {
        let months: number = 0;

        if (dob && !birthYear && !birthMonth && !approxAge) {
            console.log('!!! age from dob')
            const ageDays = this.getAgeInDaysFromDob(dob)
            months = ageDays / 30.44 // avg days per month = 30.44
        } else if (birthYear && birthMonth && !dob && !approxAge) {
            console.log('!!! age from year/month')
            const newDob = this.createDob(birthYear, birthMonth)
            const ageDays = this.getAgeInDaysFromDob(newDob)
            months = ageDays / 30.44

            // TODO - delete? this calculates months completed - alwayrs returns a round number
            // const now = new Date()
            // let diffMonths = now.getMonth() - this.monthToIndex(birthMonth)
            // let diffYears = now.getFullYear() - Number(birthYear)

            // if (diffMonths < 0) {
            //     diffYears--;
            //     diffMonths+12;
            // }

            // console.log(now.getMonth(), 'this month')
            // console.log(diffMonths, 'diffMonths')
            // console.log(diffYears, 'diffYears')
            // months = diffMonths + (diffYears * 12)
            
        } else if (approxAge && !dob && !birthMonth && !birthYear) {
            console.log('age from approx age')
            const yearsNum = Number(approxAge.trim())
            months = yearsNum * 12 // 12 months in a year
        }
  
        return months;
    }

    /**
     * 
     * @param years from entered DOB OR birth year and birth month
     * @param months from entered DOB OR birth year and birth month
     * @param days from entered DOB
     * @returns age in format 'X years Y months Z days'. If year or month null, not included in string
     */
    private static formatAge(years: number, months: number, days: number|null): string {
        // TODO - refactor so it takes in age in years
        if (years < 1) {
            if (months < 1) {
                return days ? `${days} days` : '0 months'
            }
            return days ? `${months} months ${days} days` :  `${months} months`
        }

        return (
            days 
            ? `${years} years ${months} months ${days} days`
            : `${years} years ${months} months`
        );
    }

    /**
     * 
     * @param age approximate age entered by user
     * @returns age in format 'X years Y months Z days'
     */
    private static formatApproximateAge(age: number): number {
        // TODO - or delete if formatAge takes in age in years
        return 0
    }


    // expose private functions only in test builds
    static __test = {
        monthToIndex: AgeCalculator.monthToIndex,
        createDob: AgeCalculator.createDob,
        getAgeInYearsFromDOB: AgeCalculator.getAgeInYearsFromDOB,
        getAgeInMonths: AgeCalculator.calculateAgeInMonths
    };

}