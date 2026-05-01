import buikweData from '@/src/data/vht_list/buikwe.json';
import testData from '@/src/data/vht_list/test.json';
import { VhtDataObject } from './vhtDataProcessor';

/**
 * District/County -> VHT dataset map
 * Keys should match config.activeDistrict (case-insensitive)
 */
const vhtDataMap: Record<string, any> = {
  buikwe: buikweData,
  test: testData, // TODO - delete testData
};

/**
 * Returns VHT dataset for the selected district.
 *
 * Always returns an array (never null/undefined)
 * so downstream processors can safely do .forEach(), .map(), etc.
 */
export function getVhtDataByDistrict(district: string): VhtDataObject[] {
  if (!district?.trim()) {
    return [];
  }

  const normalizedDistrict = district.trim().toLowerCase();

  return vhtDataMap[normalizedDistrict] ?? [];
}