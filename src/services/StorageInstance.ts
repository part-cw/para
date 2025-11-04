import { getStorageService, IStorageService } from "./StorageService";

/**
 * Singleon intance to ensure consistent storage
 */
let storageInstance: IStorageService | null = null

export function getStorageInstance(): IStorageService {
    if (!storageInstance) {
        storageInstance = getStorageService();
    }

    return storageInstance;
}