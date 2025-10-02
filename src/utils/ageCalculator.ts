/**
 * Calculated estimated age from DOB variable OR birth year/month OR approxAge
 * 
 */

import { MAX_PATIENT_AGE } from "../config";
import { ageRangeErrorMessage, isValidAgeRange } from "./inputValidator";

export class AgeCalculator {

    private static msPerDay = (1000 * 60 * 60 * 24)
    private static daysPerYear = 365.2475 // accounts for leap year

    /**
     * 
     * @param years age in years, calculated from one of: DOB, (MOB and YOB), or approx age
     * @returns age in months, unrounded
     */
    static calculateAgeInMonths(
        dob: Date|null, 
        yob: string, 
        mob: string, 
        approxAge: string): number {

        const months = 12 * this.calculateAgeInYears(dob, yob, mob, approxAge)
        return months
    }

    /**
     * 
     * @param dob 
     * @param birthYear 
     * @param birthMonth 
     * @param approxAge 
     * @returns unrounded age in years (e.g. 3.5) based on available input. Throws error if invalid or missing input
     */
    private static calculateAgeInYears(
        dob: Date|null, 
        birthYear: string, 
        birthMonth: string, 
        approxAge: string
    ): number {
        if (dob && !birthYear && !birthMonth && !approxAge) {
            const age = this.getAgeInYearsFromDOB(dob)
            
            if (age < 0) throw new Error("DOB cannot be in the future");
            if (age > MAX_PATIENT_AGE) throw new Error(ageRangeErrorMessage)
            
            return age;

        } else if (birthYear && birthMonth && !dob && !approxAge) {
            const newDob = this.createDob(birthYear, birthMonth)
            const age = this.getAgeInYearsFromDOB(newDob)

            if (age < 0) throw new Error("DOB (calculated from birth year/month) cannot be in the future")            
            if (age > MAX_PATIENT_AGE) throw new Error(ageRangeErrorMessage)
            
            return age;

        } else if (approxAge && !dob && !birthMonth && !birthYear) {
            const age = Number(approxAge.trim())

            if (!age) throw new Error('Approximate age is not a valid number.')
            if(!isValidAgeRange(age)) throw new Error(ageRangeErrorMessage)
            
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
        let now = new Date(); 
        
        // set times to midnight
        now.setHours(0,0,0,0)
        dob.setHours(0,0,0,0)
    
        const diffTime = now.getTime() - dob.getTime(); // get time is ms
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
        const diffYears = diffDays / this.daysPerYear
        
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
     * @param months age in months
     * @returns age in format 'X years' or 'Y months' or 'Z days'.
     */
    static formatAge(months: number): string {
        if (months < 6) {
            if (months < 1) {
                return `${Math.round(months * 30)} days`
            }
            return `${this.roundAge(months)} months`
        }

        return `${this.roundAge(months / 12)} years`
    }

    // expose private functions only in test builds
    static __test = {
        monthToIndex: AgeCalculator.monthToIndex,
        createDob: AgeCalculator.createDob,
        getAgeInYearsFromDOB: AgeCalculator.getAgeInYearsFromDOB,
    };

}