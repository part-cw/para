// parses VHT JSON files based on district

// Import the correct JSON based on the selected district.
// Use Papa Parse to turn it into objects.
// Map them into {key, val} arrays for SearchableDropdown.
// Set up the village <-> VHT filtering logic here ??

import { DropdownItem } from "../components/SearchableDropdown";

export interface VhtDataObject {
  DISTRICT: string;
  COUNTY?: string;
  SUBCOUNTY?: string;
  PARISH?: string;
  VILLAGE: string;
  FACILITY?: string;
  NAME: string;
  "TELEPHONE NUMBER": number | string;
  GENDER?: string;
  "MEDIC UUID"?: string;
  "HEALTH FACILITY IN CHARGE"?: string;
  "IN CHARGE'S CONTACTS"?: number | string;
  "VHT COORDINATOR'S NAME"?: string;
  "VHT COORDINATOR'S CONTACT"?: number | string;
}

// Returns a list of villages in alphabetical order as DropdownItem from vht data JSON 
export function getVillageDropdownItems(data: VhtDataObject[]): DropdownItem[] {
    const villageSet = new Set<string>();

    // for each data item, store unique village name and sort alphabetically
    data.forEach(obj => villageSet.add(obj.VILLAGE.trim().toUpperCase()))
    const sortedVillages = Array.from(villageSet).sort();

    const villageDropdownItems = sortedVillages.map((village, index) => ({
        key: `${index}`,
        value: village
    }))

    // console.log(villageDropdownItems, villageDropdownItems.length, typeof(villageDropdownItems[0]))

    return villageDropdownItems;
}

// Returns a list of VHT names in alphabetical order as DropdownItem from vht data JSON 
export function getVhtDropdownItems(data: VhtDataObject[]): DropdownItem[] {
    const vhtSet = new Set<string>();
    
    // const vhtNames = new Array<string>()
    // data.forEach(row => vhtNames.push(row.NAME))
    // console.log(vhtNames.sort(), vhtNames.length)

    // for each data item, store unique vht name and sort alphabetically
    data.forEach(obj => vhtSet.add(obj.NAME.trim()))
    const sortedVHTs = Array.from(vhtSet).sort();
    // console.log(sortedVHTs, sortedVHTs.length)

    const vhtDropdownItems = sortedVHTs.map((name, index) => ({
        key: `${index}`,
        value: name
    }))

    return vhtDropdownItems
}

// Filters vht dropdown options based on selected village
export function filterVhtsByVillage(data: VhtDataObject[], village: string): DropdownItem[] {
    const filteredVhtSet = new Set<string>();

    data.forEach(obj => {
        if (obj.VILLAGE.trim().toUpperCase() === village.trim().toUpperCase()) {
            filteredVhtSet.add(obj.NAME.trim());
        }
    });

    // sort filtered vht names alphabetically
    const filteredVhtArray = Array.from(filteredVhtSet).sort()
    console.log('filteredVhts', filteredVhtArray)

    return filteredVhtArray.map((vhtName, index) => ({
        key: `${index}`,
        value: vhtName,
    }));
}

// Filters village dropdown options based on selected vht name
export function filterVillagesbyVht(data: VhtDataObject[], vhtName: string) {
    const filteredVillageSet = new Set<string>();

    data.forEach(obj => {
        if (obj.NAME.trim().toUpperCase() === vhtName.trim().toUpperCase()) {
            filteredVillageSet.add(obj.VILLAGE.trim());
        }
    });

    // sort filtered villages alphabetically
    const filteredVillageArray = Array.from(filteredVillageSet).sort()
    // console.log('filteredVillages', filteredVillageArray)

    return filteredVillageArray.map((village, index) => ({
        key: `${index}`,
        value: village,
    }));
}


// testing scenarios
// same vht name,diff telephone multiple villages eg. Wasswa Joseph 
// same village, multiple vhts
// edge cases - uppercase, lowercase, extra spaces before/after/in-between, off by 1 letter

const testDataset: VhtDataObject[] = [
    {
        DISTRICT: 'test',
        VILLAGE: 'Whoville',
        NAME: 'Cindy Lou Who',
        "TELEPHONE NUMBER": 123456789
    },
    {
        DISTRICT: 'test',
        VILLAGE: 'Townsville',
        NAME: 'Cindy Lou Who',
        "TELEPHONE NUMBER": 987654321
    },
    {
        DISTRICT: 'test',
        VILLAGE: 'Whoville',
        NAME: 'The Grinch',
        "TELEPHONE NUMBER": 741852963
    },
    {
        DISTRICT: 'test',
        VILLAGE: 'Townsville',
        NAME: 'Bubbles',
        "TELEPHONE NUMBER": 1112223333
    },
    {
        DISTRICT: 'test',
        VILLAGE: 'Townsville',
        NAME: 'Blossom',
        "TELEPHONE NUMBER": 4445556666
    },
    {
        DISTRICT: 'test',
        VILLAGE: 'Townsville',
        NAME: 'Buttercup',
        "TELEPHONE NUMBER": 7778889999
    },
    {
        DISTRICT: 'test',
        VILLAGE: 'Townsville',
        NAME: 'ButterCup ',
        "TELEPHONE NUMBER": 7778889999
    },
]


