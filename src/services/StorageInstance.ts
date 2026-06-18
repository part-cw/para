import { getStorageService, IStorageService } from "./StorageService";

/**
 * Singleon instance to ensure consistent storage
 */
let storageInstance: IStorageService | null = null

export function getStorageInstance(): IStorageService {
    if (!storageInstance) {
        storageInstance = getStorageService();
    }

    return storageInstance;
}