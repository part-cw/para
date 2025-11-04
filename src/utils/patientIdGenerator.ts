import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ACTIVE_SITE, DEVICE_ID_KEY } from '../config';

export class PatientIdGenerator {
  private static readonly PATIENT_COUNTER_KEY = 'patient_counter';  
  private static readonly RECYCLED_IDS_KEY = 'recycled_patient_ids';

  private static deviceId: string =  DEVICE_ID_KEY

  // Cached preview ID for the current workflow
  // private static recycledId: string | null = null;


  /**
   * Generate a unique patient ID (format: SITE-DEVICE-####)
   * SITE = Site name (set by admin - in config.ts)
   * DEVICE = Device ID (A to Z, set by admin - in config.ts)
   * #### = Sequential patient number for that device
   */
  static async generatePatientId(): Promise<string> {
    try {
      // check if there are any recycled ids to use
      const recycledId = await this.getRecycledId();
      
      if (recycledId) {
        console.log(`Reusing recycled patient ID: ${recycledId}`);
        return recycledId;
      }

      const site = ACTIVE_SITE
      const patientNumber = await this.getNextPatientNumber();
      
      const patientId = `${site}-${this.deviceId}-${patientNumber.toString().padStart(4, '0')}`;
      console.log(`Generated patient ID: ${patientId}`);

      return patientId;
    } catch (error) {
      console.error('Failed to generate patient ID:', error);
      // Fallback to timestamp-based ID if all else fails
      return this.generateFallbackId();
    }
  } 

  /**
   * Get the next patient number for this device and increment counter
   */
  private static async getNextPatientNumber(): Promise<number> {
    try {
      const storageKey = `${this.PATIENT_COUNTER_KEY}_${this.deviceId}`;
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
   * Add an unsed ID to the pool of recycled ids
   */
  static async recyclePatientId(id: string) {  
    try {
      const storageKey = `${this.RECYCLED_IDS_KEY}_${this.deviceId}`;
      const recycledIds = await this.getAllRecycledIds(storageKey);
      
      // Add to pool if not already there
      if (!recycledIds.includes(id)) {
        recycledIds.push(id);

        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync(storageKey, JSON.stringify(recycledIds));
        } // TODO add web code

        console.log(`Recycled patient ID for reuse: ${id}`);
        console.log(`Total recycled IDs available: ${recycledIds.length}`);
      }

    } catch (error) {
      console.error('Failed to recycle patient ID:', error);
    }
  }

   /**
   * Get a recycled ID from the pool (FIFO - first in, first out)
   */
  private static async getRecycledId(): Promise<string | null> {
    try {
      const storageKey = `${this.RECYCLED_IDS_KEY}_${this.deviceId}`;
      const recycledIds = await this.getAllRecycledIds(storageKey);

      if (recycledIds.length === 0) {
        return null;
      }

      // remove first element from the array of ids and store it in local variable
      const id = recycledIds.shift();

      // update storage -- TODO: implement solution for web
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(storageKey, JSON.stringify(recycledIds))
      }

      return id || null;

    } catch (error) {
      console.error(`Failed to retrieve recycled ids from storage: `, error)
      return null;
    }
  }

   /**
   * Get an array of all recycled IDs
   */
  private static async getAllRecycledIds(key: string): Promise<string[]> {
    try {
      let recycledIds: string[] = [];
        
      // TODO code for web OS
      if (Platform.OS !== 'web') {
        const stored = await SecureStore.getItemAsync(key)
        recycledIds = stored ? JSON.parse(stored) : [];
      } 
      
      console.log('Recycled ids available: ', recycledIds)
      return recycledIds;

    } catch (error) {
      console.error(`Failed to retrieve all recycled ids from storage: `, error)
      return [];
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
   * Generate fallback patient ID when all else fails
   */
  private static generateFallbackId(): string {
    const site = ACTIVE_SITE
    const dateStr = this.getCurrentDateString();
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    
    return `${site}-FALL-${dateStr}-${randomNum.toString().padStart(4, '0')}`;
  }


// UTILITY FUNCTIONS 

// /**
//    * Clear all recycled IDs
//    */
//   static async clearRecycledIds(): Promise<void> {
//     try {
//       const storageKey = `${this.RECYCLED_IDS_KEY}_${this.deviceId}`;
      
//       if (Platform.OS !== 'web') {
//         await SecureStore.deleteItemAsync(storageKey);
//       }
//       console.log('🗑️ Cleared all recycled patient IDs');
//     } catch (error) {
//       console.error('Failed to clear recycled IDs:', error);
//     }
//   }

//   /**
//    * Get count of recycled IDs available
//    */
//   static async getRecycledIdCount(): Promise<number> {
//     try {
//       const storageKey = `${this.RECYCLED_IDS_KEY}_${this.deviceId}`;
      
//       if (Platform.OS !== 'web') {
//         const stored = await SecureStore.getItemAsync(storageKey);
//         const recycledIds = stored ? JSON.parse(stored) : [];
//         return recycledIds.length;
//       } else {
//         return 0 // stub for web - TODO fix implementation
//       }
//     } catch (error) {
//       console.error('Failed to get recycled ID count:', error);
//       return 0;
//     }
//   }

}