import buikweData from '@/src/data/vht_list/buikwe.json';
import testData from '@/src/data/vht_list/test.json';

// Loads the correct VHT data based on district
const vhtDataMap: Record<string, any> = {
  buikwe: buikweData,
  test: testData, // TODO - delete testData
};

export function getVhtDataByDistrict(district: string) {
  return vhtDataMap[district.toLowerCase()] || null;
}