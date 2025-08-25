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