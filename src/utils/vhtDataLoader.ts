
import testData from '@/src/data/vht_list/usability_vht.json';
import { VhtDataObject } from './vhtDataProcessor';

/**
 * Site -> VHT dataset map
 * Keys should match config.activeSite (case-insensitive)
 */
const vhtDataMap: Record<string, VhtDataObject[]> = {
  test: testData,



};

/**
 * Returns VHT dataset for the selected site/VHT area.
 *
 * Always returns an array (never null/undefined)
 * so downstream processors can safely do .forEach(), .map(), etc.
 */
export function getVhtDatabySite(site: string): VhtDataObject[] {
  if (!site?.trim()) {
    return [];
  }

  const normalizedSite = site.trim().toLowerCase();

  return vhtDataMap[normalizedSite] ?? [];
}