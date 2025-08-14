// parses VHT JSON files based on district

import { DropdownItem } from "../components/SearchableDropdown";

export interface VhtDataObject {
  DISTRICT: string;
  COUNTY?: string;
  SUBCOUNTY?: string;
  PARISH?: string;
  VILLAGE: string;
  FACILITY?: string;
  NAME: string;
  "TELEPHONE NUMBER": number;
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

// Returns phone numbers as DropdownItems from vht data JSON
export function getTelephoneDropdownItems(data: VhtDataObject[]): DropdownItem[] {
   // TODO delete console logs (here for testing)
    // const telArray = new Array<string>()
    // data.forEach(obj => telArray.push(obj["TELEPHONE NUMBER"].toString()))
    // const duplicates = telArray.filter((item, index, arr) => arr.indexOf(item) !== index);
    // console.log('Duplicates:', duplicates);
    // console.log(`Duplicate count: ${duplicates.length}`);

    const telSet = new Set<string>();
    data.forEach(obj => telSet.add(obj["TELEPHONE NUMBER"].toString()))

    const telDropdownItems = Array.from(telSet).map((tel, index) => (
        {
            key: `${index}`,
            value: tel
        }
    ))
    
    return telDropdownItems;
}

// TODO - filter by tel
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

// TODO filter by tel
// Filters village dropdown options based on selected vht name
export function filterVillagesbyVht(data: VhtDataObject[], vhtName: string): DropdownItem[] {
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

// Filters telephone numbers based on selected vht and/or village
export function filterTelephoneNumbers(
    data: VhtDataObject[], 
    selectedVht: string | undefined, 
    selectedVillage: string | undefined
): DropdownItem[] {
    const normalize = (val: string) => val.trim().toUpperCase();
    
    const vht = selectedVht ? normalize(selectedVht) : undefined;
    const village = selectedVillage ? normalize(selectedVillage) : undefined;

    const filteredNumberSet = new Set<string>()

    data.forEach(obj => {
        const matchesVht = !vht || normalize(obj.NAME) === vht;
        const matchesVillage = !village || normalize(obj.VILLAGE) === village;

        if (matchesVht && matchesVillage) {
        filteredNumberSet.add(obj['TELEPHONE NUMBER'].toString());
        }
    });

    return (
        Array.from(filteredNumberSet).map((tel, index) => ({
            key: `${index}`,
            value: tel,
        }))
    );
}


// TODO - write unit tests
// testing scenarios
// same vht name,diff telephone multiple villages eg. Wasswa Joseph 
// same village, multiple vhts
// edge cases - uppercase, lowercase, extra spaces before/after/in-between, off by 1 letter
// diff vhts same tel e.g. Nabaweesi  Margret,750950818... Katusabe  Janet,750950818
// same vht nam, same village, same coordinar, diff coo num e.g. Nankya Rose M,751436017

// const testDataset: VhtDataObject[] = [
//     {
//         DISTRICT: 'test',
//         VILLAGE: 'Whoville',
//         NAME: 'Cindy Lou Who',
//         "TELEPHONE NUMBER": 123456789
//     },
//     {
//         DISTRICT: 'test',
//         VILLAGE: 'Townsville',
//         NAME: 'Cindy Lou Who',
//         "TELEPHONE NUMBER": 987654321
//     },
//     {
//         DISTRICT: 'test',
//         VILLAGE: 'Whoville',
//         NAME: 'The Grinch',
//         "TELEPHONE NUMBER": 741852963
//     },
//     {
//         DISTRICT: 'test',
//         VILLAGE: 'Townsville',
//         NAME: 'Bubbles',
//         "TELEPHONE NUMBER": 1112223333
//     },
//     {
//         DISTRICT: 'test',
//         VILLAGE: 'Townsville',
//         NAME: 'Blossom',
//         "TELEPHONE NUMBER": 4445556666
//     },
//     {
//         DISTRICT: 'test',
//         VILLAGE: 'Townsville',
//         NAME: 'Buttercup',
//         "TELEPHONE NUMBER": 7778889999
//     },
//     {
//         DISTRICT: 'test',
//         VILLAGE: 'Townsville',
//         NAME: 'ButterCup ',
//         "TELEPHONE NUMBER": 7778889999
//     },
// ]


