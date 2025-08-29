/**
 * Calculated estimated age from DOB variable OR birth year/month OR approxAge
 *  Not exact age measurements
 */

//  * TODO used for WAZ score calculations -- take floor (use months completed)
//  * TODO for model calculation - round to 1 decimal place

import { DropdownItem } from "../components/SearchableDropdown";

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
        birthMonth: DropdownItem|null, 
        approxAge: string
    ): number {

        if (dob && !birthYear && !birthMonth && !approxAge) {
            const age = this.getAgeInYearsFromDOB(dob)
            if (age < 0) {
                throw new Error("DOB cannot be in the future");
            }
            return age;
        } else if (birthYear && birthMonth && !dob && !approxAge) {
            const newDob = this.createDob(birthYear, birthMonth)
            const age = this.getAgeInYearsFromDOB(newDob)
            if (age < 0) {
                throw new Error("DOB (calculated from birth year/month) cannot be in the future")
            }
            return age;
        } else if (approxAge && !dob && !birthMonth && !birthYear) {
            const parsed = Number(approxAge);
            
            if (isNaN(parsed)) {
                throw new Error("Approximate age is not a valid number.");
            }
            return parsed
        } 

        // TODO handle if 'now' is same year/month as entered, but now.date is before dob.date, which is autoset to 15
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
    private static createDob(birthYear: string, birthMonth: DropdownItem): Date {
        console.log('making new dob...')
        const birthMonthIndex = this.monthToIndex(birthMonth)
        const dob = new Date(Number(birthYear), birthMonthIndex, 15) // TODO - what if curr date before the 15th:??
        return dob
    }

    private static monthToIndex(month: DropdownItem): number {
        const monthMap: Record<string, number> = {
            Jan: 0,
            Feb: 1,
            Mar: 2,
            Apr: 3,
            May: 4,
            Jun: 5,
            Jul: 6,
            Aug: 7,
            Sep: 8,
            Oct: 9,
            Nov: 10,
            Dec: 11,
        };

        return monthMap[month.key] ?? -1; // -1 if not found
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
     * @param years raw, unrounded approximate age in years. Used if only have approxAge; null if dob available
     * @returns converts DOB or age in years into age in months, unrounded. 
     * Assume params are never both null - either dob or years must be defined
     */
    static getAgeInMonths(dob: Date | null, years?: number | null): number {
        let months: number = 0;

        if (dob) {
            const ageDays = this.getAgeInDaysFromDob(dob)
            months = ageDays / 30.44 // days per month = 30.44
        } else if (years) {
            months = years / 12 // 12 months in a year
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
        getAgeInMonths: AgeCalculator.getAgeInMonths
    };

}