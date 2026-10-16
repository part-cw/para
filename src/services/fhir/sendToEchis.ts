import { getFHIRInstance } from './FHIRInstance';
import { buildPatientBundle } from './fhirMapper';

export async function sendToEchis(
    id: string,
    storage: any,
    config: any
): Promise<{ sent: boolean; message?: string }> {
    const patient = await storage.getPatient(id);
    if (!patient) return { sent: false, message: 'Could not load patient record.' };

    if (patient.isSentToEchis) {
        return { sent: true, message: 'Patient data has already been sent to eCHIS.' }; // never send twice
    }

    const medicalConditions = await storage.getCategorizedMedicalConditions(id);
    const { assessment } = await storage.getRiskAssessment(id);
    const bundle = buildPatientBundle(patient, medicalConditions, assessment, config.activeSite, config.deviceIdKey);

    const result = await getFHIRInstance().sendBundle(bundle, {
        serverUrl: process.env.EXPO_PUBLIC_ECHIS_SERVER_URL,
        authToken: config.echisAuthToken,
        apiKey: process.env.EXPO_PUBLIC_ECHIS_API_KEY,
    });

    console.log('[FHIR] sendBundle result:', JSON.stringify(result, null, 2));

    const sent = result.ok && !result.dryRun;

    let message: string | undefined;
    // If body includes 'error' field, use that as the message; otherwise, use the raw body text if it's just a string
    if (!result.ok) message = typeof result.body === 'string' ? result.body : result.body?.error;
    else if (result.dryRun) message = 'No eCHIS server is configured.';
    console.log(`sendToEchis: sent=${sent}, message=${message ?? 'Successful send'}`);

    if (sent) await storage.updatePatient(id, { isSentToEchis: true }); // only flip the flag on success

    return { sent, message };
}