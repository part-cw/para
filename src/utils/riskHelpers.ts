
/**
 * 
 * @param a date a as string or Date object if it exists
 * @param b date b as string or Date object if it exists
 * @returns the latest date
 */
export function mostRecent(
    a: Date | string | null | undefined,
    b: Date | string | null | undefined
) {
    if (!a) return b ?? null;
    if (!b) return a ?? null;

    const dateA = typeof a === 'string' ? new Date(a) : a;
    const dateB = typeof b === 'string' ? new Date(b) : b;

    return dateA > dateB ? a : b;
}


/**
 * 
 * @param admissionCompletedAt  - datestring of when patient record submitted 
 * @param latestRiskCalculatedAt - most recent admssion risk calcuation date string
 * @returns return true if latest admission risk calculated after admission completion time 
 */
export function computeAdmissionRiskUpdated(
    admissionCompletedAt?: string | null,
    latestRiskCalculatedAt?: string | null
): boolean {
    if (!admissionCompletedAt || !latestRiskCalculatedAt) return false;

    const admissionTime = Date.parse(admissionCompletedAt);
    const riskTime = Date.parse(latestRiskCalculatedAt);

    // If either fails to parse → treat as not updated
    if (Number.isNaN(admissionTime) || Number.isNaN(riskTime)) {
        return false;
    }

    return riskTime > admissionTime;
}