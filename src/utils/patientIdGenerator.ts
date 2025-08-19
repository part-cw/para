import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ACTIVE_SITE, DEVICE_ID_KEY } from '../config';

export class PatientIdGenerator {
  private static readonly PATIENT_COUNTER_KEY = 'patient_counter';
  private static readonly LAST_DATE_KEY = 'last_patient_date';
  
  private static deviceId: string | null = null;
  private static dailyCounter: number = 0;
  private static lastDate: string = '';

  /**
   * Generates a unique patient ID format: SITE-A-00001
   * SITE = Site name (set by admin - in config.ts)
   * A = Device ID (A to Z, set by admin - in config.ts)
   * 00001 = Sequential patient number for that device on that date
   */
  static async generatePatientId(): Promise<string> {
    try {
      const site = ACTIVE_SITE
      const deviceId = DEVICE_ID_KEY
      const dateStr = this.getCurrentDateString();
      const patientNumber = await this.getNextPatientNumber(dateStr);

      const patientId = `${site}-${deviceId}-${patientNumber.toString().padStart(4, '0')}`;
      
      console.log(`Generated patient ID: ${patientId}`);
      return patientId;
    } catch (error) {
      console.error('Failed to generate patient ID:', error);
      // Fallback to timestamp-based ID if all else fails
      return this.generateFallbackId();
    }
  }
  

  /**
   * Get current date string in YYYYMMDD format
   */
  private static getCurrentDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Get the next patient number for the current date
   */
  private static async getNextPatientNumber(dateStr: string): Promise<number> {
    try {
      const storageKey = `${this.PATIENT_COUNTER_KEY}_${dateStr}`;
      let counter: number;

      if (Platform.OS === 'web') {
        const stored = localStorage.getItem(storageKey);
        counter = stored ? parseInt(stored, 10) : 0;
      } else {
        const stored = await SecureStore.getItemAsync(storageKey);
        counter = stored ? parseInt(stored, 10) : 0;
      }

      // Increment counter
      counter += 1;

      // Store updated counter
      if (Platform.OS === 'web') {
        localStorage.setItem(storageKey, counter.toString());
      } else {
        await SecureStore.setItemAsync(storageKey, counter.toString());
      }

      return counter;
    } catch (error) {
      console.error('Failed to get patient number:', error);
      // Fallback to timestamp-based number
      return Math.floor(Date.now() % 10000);
    }
  }


  /**
   * Generate fallback patient ID when all else fails
   */
  private static generateFallbackId(): string {
    const site = ACTIVE_SITE
    const dateStr = this.getCurrentDateString();
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    
    return `${site}-FALL-${dateStr}-${randomNum.toString().padStart(4, '0')}`;
  }


  /**
   * Reset patient counter (for testing or new day)
   */
  static async resetPatientCounter(date?: string): Promise<void> {
    try {
      const dateStr = date || this.getCurrentDateString();
      const storageKey = `${this.PATIENT_COUNTER_KEY}_${dateStr}`;

      if (Platform.OS === 'web') {
        localStorage.removeItem(storageKey);
      } else {
        await SecureStore.deleteItemAsync(storageKey);
      }

      console.log(`Reset patient counter for ${dateStr}`);
    } catch (error) {
      console.error('Failed to reset patient counter:', error);
    }
  }
}

    /**
   * Parse patient ID to extract components
   */
//   static parsePatientId(patientId: string): {
//     district: string;
//     deviceId: string;
//     date: string;
//     patientNumber: number;
//     isValid: boolean;
//   } {
//     const regex = /^([A-Z]{3})-([D]\d{3})-(\d{8})-(\d{4})$/;
//     const match = patientId.match(regex);

//     if (match) {
//       return {
//         district: match[1],
//         deviceId: match[2],
//         date: match[3],
//         patientNumber: parseInt(match[4], 10),
//         isValid: true
//       };
//     }

//     return {
//       district: '',
//       deviceId: '',
//       date: '',
//       patientNumber: 0,
//       isValid: false
//     };
//   }

//   /**
//    * Validate a patient ID format
//    */
//   static validatePatientId(patientId: string): boolean {
//     const parsed = this.parsePatientId(patientId);
//     return parsed.isValid;
//   }

//   /**
//    * Get district from patient ID
//    */
//   static getDistrictFromPatientId(patientId: string): string {
//     const parsed = this.parsePatientId(patientId);
//     return parsed.isValid ? parsed.district : '';
//   }

//   /**
//    * Check if patient ID belongs to current district
//    */
//   static isFromCurrentDistrict(patientId: string): boolean {
//     const expectedDistrictCode = DISTRICT_CODES[ACTIVE_DISTRICT] || ACTIVE_DISTRICT.toUpperCase().slice(0, 3);
//     const patientDistrictCode = this.getDistrictFromPatientId(patientId);
//     return patientDistrictCode === expectedDistrictCode;
//   }




// hooks/usePatientId.ts
// import { useState, useCallback, useEffect } from 'react';

// export const usePatientId = () => {
//   const [currentPatientId, setCurrentPatientId] = useState<string>('');
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [stats, setStats] = useState<any>(null);

//   // Generate new patient ID
//   const generateNewPatientId = useCallback(async (): Promise<string> => {
//     setIsGenerating(true);
//     try {
//       const newId = await PatientIdGenerator.generatePatientId();
//       setCurrentPatientId(newId);
//       return newId;
//     } catch (error) {
//       console.error('Failed to generate patient ID:', error);
//       throw error;
//     } finally {
//       setIsGenerating(false);
//     }
//   }, []);

//   // Load stats
//   const loadStats = useCallback(async () => {
//     try {
//       const currentStats = await PatientIdGenerator.getPatientIdStats();
//       setStats(currentStats);
//     } catch (error) {
//       console.error('Failed to load patient ID stats:', error);
//     }
//   }, []);

//   // Load stats on mount
//   useEffect(() => {
//     loadStats();
//   }, [loadStats]);

//   return {
//     currentPatientId,
//     generateNewPatientId,
//     isGenerating,
//     stats,
//     loadStats,
//     validatePatientId: PatientIdGenerator.validatePatientId,
//     parsePatientId: PatientIdGenerator.parsePatientId,
//     isFromCurrentDistrict: PatientIdGenerator.isFromCurrentDistrict
//   };
// };
