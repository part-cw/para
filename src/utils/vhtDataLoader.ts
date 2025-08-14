import buikweData from '@/src/data/vht_list/buikwe.json';
import testData from '@/src/data/vht_list/test.json';

import { ACTIVE_DISTRICT } from '../config';

// Loads the correct VHT data based on district
// TODO district selected by admin and stored in ASYNC storage?? 
// currently  or stored in env_flag in config file

const vhtDataMap: Record<string, any> = {
  buikwe: buikweData,
  test: testData, // TODO - delete testData
};

export const vhtData = vhtDataMap[ACTIVE_DISTRICT];

// export function getVhtData(districtName: string) {
//   return vhtDataMap[districtName.toLowerCase()] || null;
// }