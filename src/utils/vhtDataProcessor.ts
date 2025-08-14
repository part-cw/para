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

    return villageDropdownItems;
}

// Returns a list of VHT names in alphabetical order as DropdownItem from vht data JSON 
export function getVhtDropdownItems(data: VhtDataObject[]): DropdownItem[] {
    const vhtSet = new Set<string>();

    // for each data item, store unique vht name and sort alphabetically
    data.forEach(obj => vhtSet.add(obj.NAME.trim()))
    const sortedVHTs = Array.from(vhtSet).sort();

    const vhtDropdownItems = sortedVHTs.map((name, index) => ({
        key: `${index}`,
        value: name
    }))

    return vhtDropdownItems
}

// Returns phone numbers as DropdownItems from vht data JSON
export function getTelephoneDropdownItems(data: VhtDataObject[]): DropdownItem[] {
    const telSet = new Set<string>();
    data.forEach(obj => telSet.add(obj["TELEPHONE NUMBER"].toString()))

    const telDropdownItems = Array.from(telSet).map((tel, index) => (
        {key: `${index}`, value: tel}
    ))
    
    return telDropdownItems;
}


export function filterVHTs(
    data: VhtDataObject[], 
    selectedVillage: string | undefined, 
    selectedTelephone: string | undefined
): DropdownItem[] {
    const normalize = (val: string) => val.trim().toUpperCase();
    
    const village = selectedVillage ? normalize(selectedVillage) : undefined;
    const telephone = selectedTelephone ? selectedTelephone.trim() : undefined;

    const filteredVhts = new Set<string>()

    data.forEach(obj => {
        const matchesVillage = !village || normalize(obj.VILLAGE) === village;
        const matchesTelephone = !telephone || obj["TELEPHONE NUMBER"].toString() === telephone;

        if (matchesVillage && matchesTelephone) {
        filteredVhts.add(normalize(obj.NAME));
        }
    });

    return (
        Array.from(filteredVhts).map((name, index) => ({
            key: `${index}`,
            value: name,
        }))
    );
}

export function filterVillages(
    data: VhtDataObject[], 
    selectedVht: string | undefined, 
    selectedTelephone: string | undefined
): DropdownItem[] {
    const normalize = (val: string) => val.trim().toUpperCase();
    
    const vht = selectedVht ? normalize(selectedVht) : undefined;
    const telephone = selectedTelephone ? selectedTelephone.trim() : undefined;

    const filteredVillages = new Set<string>()

    data.forEach(obj => {
        const matchesVht = !vht || normalize(obj.NAME) === vht;
        const matchesTelephone = !telephone || obj["TELEPHONE NUMBER"].toString() === telephone;

        if (matchesVht && matchesTelephone) {
        filteredVillages.add(normalize(obj.VILLAGE));
        }
    });

    return (
        Array.from(filteredVillages).map((village, index) => ({
            key: `${index}`,
            value: village,
        }))
    );
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


