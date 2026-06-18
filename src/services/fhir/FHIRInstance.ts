import { FHIRService } from './FHIRService';

let fhirService: FHIRService | null = null;

/**
 * Singleon instance to ensure consistent use of FHIR
 */
export function getFHIRInstance(): FHIRService {
  if (!fhirService) {
    fhirService = new FHIRService();
  }
  return fhirService;
}
