/**
 * Calculated estimated age from DOB variable OR birth year/month OR approxAge
 *  Not exact age measurements
 */

import { DropdownItem } from "../components/SearchableDropdown";

export class AgeCalculator {

    // Returns estimated age in string if age is less than 5.5 years old
    static calculateEstimatedAge(
        dob: Date|null, 
        birthYear: string, 
        birthMonth: DropdownItem|null, 
        approxAge: string
    ): string {
        console.log('calculating est age')
        let estimatedAge = ''

        if (dob && !birthYear && !birthMonth && !approxAge) {
            estimatedAge = `${this.getAgeFromDOB(dob)}`
            console.log('!!!!! estimating age from dob')
            console.log('age calc1', this.getAgeFromDOB(dob))
            // console.log('age calc2', this.getEstimatedAgeFromDOB2(dob))
        } else if (birthYear && birthMonth) {
            console.log('&&&')
            estimatedAge = `${this.getAgeFromYearMonth(birthYear, birthMonth)}`
            console.log('age calc2', this.getAgeFromYearMonth(birthYear, birthMonth))
        } else if (approxAge) {
            estimatedAge = approxAge
        } 

        // return (isValidAge(estimatedAge) ? estimatedAge : '')
        return estimatedAge // TODO - revert to return statement on line above
    }

    /**
     * 
     * @param dob entered from Date Picker
     * @returns age in years (eg. 3.5 years)
     */
    private static getAgeInYearsFromDOB2(dob: Date): number {
        const msPerDay = (1000 * 60 * 60 * 24)
        const now = new Date();
        const diffTime = now.getTime() - dob.getTime();
        const diffDays = Math.floor(diffTime / msPerDay);

        const years = diffDays/ 365.25 // age in years (approx)
        const roundedYears = Math.round(years * 100) / 100

        return roundedYears
        
        // if (diffDays < 30) {
        //     return `${diffDays} days`;
        // } else if (diffDays < 365) {
        //     const months = Math.floor(diffDays / 30.44); // average month length = 30.44
        //     return `${months} months`;
        // } else {
        //     const years = Math.floor(diffDays / 365.25); // approx 365.25 days/year
        //     return `${years} years`;
        // }
    }

    /**
     * 
     * @param dob entered from Date Picker.
     * @returns calculates estimated age from DOB
     */
    private static getAgeFromDOB(dob: Date): number {
        const now = new Date();
        let yearsDiff = now.getFullYear() - dob.getFullYear();
        let monthsDiff = now.getMonth() - dob.getMonth();
        let daysDiff = now.getDate() - dob.getDate();

        // Adjust for negative days differences
        if (daysDiff < 0) {
            monthsDiff--;
            const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            daysDiff += lastMonth.getDate();
        }

        // Adjust for negative months differences
        if (monthsDiff < 0) {
            yearsDiff--;
            monthsDiff += 12;
        }

        // Convert to decimal years
        const monthsAsDecimal = monthsDiff / 12;
        const daysAsDecimal = daysDiff / 365.25; // Account for leap years
        const totalYears = yearsDiff + monthsAsDecimal + daysAsDecimal;

        const roundedYears = Math.round(totalYears * 100) / 100; // round to 2 decimal places
        console.log('totalyears', totalYears)
        console.log('roundedYears', roundedYears)

        return roundedYears //TODO optionally, return formatted age (pass yearsDiff, monthsDiff and daysDiff to formatAge)
    }

    /**
     * 
     * @param birthYear entered manually - assume valid input
     * @param birthMonth entered manually - assume valid input
     * @returns calculates estimated age from entered birth year and month
     */
    private static getAgeFromYearMonth(birthYear: string, birthMonth: DropdownItem): number {
        const now = new Date();
        let yearsDiff = now.getFullYear() - Number(birthYear);
        let monthsDiff = (now.getMonth()) - this.monthToIndex(birthMonth); 
        
        // Adjust for negative months differences
        if (monthsDiff < 0) {
            yearsDiff--;
            monthsDiff += 12;
        }

        // Convert to decimal years
        const monthsAsDecimal = monthsDiff / 12;
        const totalYears = yearsDiff + monthsAsDecimal;

        const roundedYears = Math.round(totalYears * 100) / 100; // round to 2 decimal places
        return roundedYears //TODO optionally, return formatted age (pass yearsDiff and monthsDiff to formatAge)
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
     * 
     * @param years from entered DOB OR birth year and birth month
     * @param months from entered DOB OR birth year and birth month
     * @param days from entered DOB
     * @returns age in format 'X years Y months Z days'. If year or month null, not included in string
     */
    private static formatAge(years: number, months: number, days: number|null): string {
        if (years < 1) {
            if (months < 1) {
                return days ? `${days} days` : '0 months' // TODO double check this
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
        // TODO 
        return 0
    }

    /**
     * 
     * @param estimatedAge 
     * @returns 
     * converts estimated age in years to age in months
     * used for WAZ score calculations
     */
    static convertYearsToMonths(years: number): number {
        // TODO 
        return 0;
    }


    // expose private functions only in test builds
    static __test = {
        monthToIndex: AgeCalculator.monthToIndex,
        formatAge: AgeCalculator.formatAge,
        getAgeFromDOB: AgeCalculator.getAgeFromDOB,
        getAgeFromYearMonth: AgeCalculator.getAgeFromYearMonth,
        getAgeInYearsFromDOB2: AgeCalculator.getAgeInYearsFromDOB2,
    };

}