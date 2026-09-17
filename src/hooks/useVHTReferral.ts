import { DropdownItem } from '@/src/components/SearchableDropdown';
import { formatPhoneNumber, validatePhoneNumber } from '@/src/utils/inputValidator';
import {
    filterTelephoneNumbers,
    filterVHTs,
    filterVillages,
    getTelephoneDropdownItems,
    getVhtDropdownItems,
    getVillageDropdownItems
} from '@/src/utils/vhtDataProcessor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { getVhtDataByDistrict } from '../utils/vhtDataLoader';

interface UseVHTReferralProps {
    village?: string;
    subvillage?: string;
    vhtName?: string;
    vhtTelephone?: string;
    vhtUuid?: string;
    onUpdate: (updates: {
        village?: string;
        subvillage?: string;
        vhtName?: string;
        vhtTelephone?: string;
        vhtUuid?: string;
    }) => void;
}
export const useVHTReferral = ({
    village,
    subvillage,
    vhtName,
    vhtTelephone,
    onUpdate
}: UseVHTReferralProps) => {

    const { config } = useConfig();

   const allData = useMemo(() => 
        getVhtDataByDistrict(config.activeSite),
        [config.activeSite]
    );

    const isResettingRef = useRef(false);
    const [localCleared, setLocalCleared] = useState(false);


    // ====== User-added values =======
    const [addedVillages, setAddedVillages] = useState<DropdownItem[]>([]);
    const [addedVHTs, setAddedVHTs] = useState<DropdownItem[]>([]);
    const [addedNumbers, setAddedNumbers] = useState<DropdownItem[]>([]);

    // Reset on district change
    // Skip the initial mount so we don't wipe already-loaded patient data
    const isFirstDistrictRender = useRef(true);
    useEffect(() => {
        if (isFirstDistrictRender.current) {
            isFirstDistrictRender.current = false;
            return;
        }
        clearSelections();
    }, [config.activeSite]);

    // ======= Base dropdowns (unfiltered) ========
    const baseVHTs = useMemo(
        () => getVhtDropdownItems(allData),
        [allData]
    );

    const baseNumbers = useMemo(
        () => getTelephoneDropdownItems(allData),
        [allData]
    );

    const baseVillages = useMemo(
        () => getVillageDropdownItems(allData),
        [allData]
    );


    // ======= Flags for custom values =======
    const isCustomVillage = useMemo(
        () => addedVillages.some(v => v.value === village),
        [addedVillages, village]
    );

    const isCustomNumber = useMemo(
        () => addedNumbers.some(n => n.value === vhtTelephone),
        [addedNumbers, vhtTelephone]
    );

    // ======= Filtered lists (bidrectional logic) =======
    const villages = useMemo(() => {
        if (localCleared || (!vhtName && !vhtTelephone)) {
            return [...baseVillages, ...addedVillages];
        }

        const filtered = filterVillages(allData, vhtName, vhtTelephone);
        return [...filtered, ...addedVillages];
    }, [allData, vhtName, vhtTelephone, addedVillages, baseVillages,localCleared]);

    const vhts = useMemo(() => {
        if (localCleared || (!village && !vhtTelephone)) {
            return [...baseVHTs, ...addedVHTs];
        }

        const filtered =
            (isCustomVillage && !vhtTelephone) ||
            (isCustomNumber && !village)
                ? baseVHTs
                : filterVHTs(allData, village, vhtTelephone);

        return [...filtered, ...addedVHTs];
    }, [
        allData,
        village,
        vhtTelephone,
        addedVHTs,
        baseVHTs,
        isCustomVillage,
        isCustomNumber,
        localCleared
    ]);

    const telNumbers = useMemo(() => {
        if (localCleared || (!village && !vhtName)) {
            return [...baseNumbers, ...addedNumbers];
        }

        const filtered =
            isCustomVillage && !vhtTelephone
                ? baseNumbers
                : filterTelephoneNumbers(allData, vhtName, village);

        return [...filtered, ...addedNumbers];
    }, [
        allData,
        village,
        vhtName,
        vhtTelephone,
        addedNumbers,
        baseNumbers,
        isCustomVillage,
        localCleared
    ]);

       // ========= HELPER FUNCTION FOR UUID LOOKUP ==============
    const findVhtUuid = useCallback(
    (name: string, village?: string, telephone?: string): string => {
        const normalize = (val: string) => val.trim().toUpperCase();
        const nameNorm = normalize(name);

        const candidates = allData.filter(obj => normalize(obj.NAME) === nameNorm);

        if (candidates.length === 0) {
            return '';
        }

        if (candidates.length > 1) {
            const narrowed = candidates.filter(obj =>
                (!village || normalize(obj.VILLAGE) === normalize(village)) &&
                (!telephone || formatPhoneNumber(obj["TELEPHONE NUMBER"].toString()) === telephone)
            );

            if (narrowed.length > 0) {
                const uuid = narrowed[0]["MEDIC UUID"]?.trim() || '';
                return uuid;
            }
        }

        const uuid = candidates[0]["MEDIC UUID"]?.trim() || '';
        return uuid;
    },
    [allData]
    );

    // Clear localCleared once props have caught up
    useEffect(() => {
        if (localCleared && !village && !vhtName && !vhtTelephone) {
            setLocalCleared(false);
        }
    }, [localCleared, village, vhtName, vhtTelephone]);

    // ======= Auto-select logic ======= 
    useEffect(() => {
        if (isResettingRef.current) return;
        if (villages.length === 1 && !village) {
            onUpdate({ village: villages[0].value });
        }
    }, [villages, village, onUpdate]);

    useEffect(() => {
        if (isResettingRef.current) return;
        if (vhts.length === 1 && !vhtName) {
            onUpdate({ 
                vhtName: vhts[0].value, 
                vhtUuid: findVhtUuid(vhts[0].value, village, vhtTelephone)
            });
        }
    }, [vhts, vhtName, onUpdate, findVhtUuid, village, vhtTelephone]);

    useEffect(() => {
        if (isResettingRef.current) return;
        if (telNumbers.length === 1 && !vhtTelephone) {
            onUpdate({ vhtTelephone: telNumbers[0].value });
        }
    }, [telNumbers, vhtTelephone, onUpdate]);


    // Lower the auto-select guard once a clear has fully settled (declared after
    // the auto-select effects so they stay suppressed during the settling commit)
    useEffect(() => {
        if (!localCleared) {
            isResettingRef.current = false;
        }
    }, [localCleared]);


    // ========= ADD HANDLERS (with dedup + formatting) ============
    const handleAddVillage = useCallback((item: DropdownItem) => {
        setAddedVillages(prev =>
        prev.some(v => v.value === item.value)
            ? prev
            : [...prev, item]
        );
    }, []);

    const handleAddVHT = useCallback((item: DropdownItem) => {
        setAddedVHTs(prev =>
        prev.some(v => v.value === item.value)
            ? prev
            : [...prev, item]
        );
    }, []);

    const handleAddTel = useCallback((item: DropdownItem) => {
        const validation = validatePhoneNumber(item.value);

        if (!validation.isValid) return;

        const formatted = {
        ...item,
        value: validation.formattedValue || item.value,
        };

        setAddedNumbers(prev =>
        prev.some(n => n.value === formatted.value)
            ? prev
            : [...prev, formatted]
        );
    }, []);

    // ========= SELECT HANDLERS ==============
    const handleVillageSelect = useCallback(
        (item: DropdownItem) => {
        onUpdate({ village: item.value || '' });
        },
        [onUpdate]
    );

    const handleVHTSelect = useCallback(
        (item: DropdownItem) => {
        onUpdate({ 
            vhtName: item.value || '', 
            vhtUuid: findVhtUuid(item.value, village, vhtTelephone)
            });
        },
        [onUpdate, findVhtUuid, village, vhtTelephone]
    );

    const handleTelSelect = useCallback(
        (item: DropdownItem) => {
        onUpdate({ vhtTelephone: item.value || '' });
        },
        [onUpdate]
    );

    const handleSubvillageChange = useCallback(
        (value: string) => {
        onUpdate({ subvillage: value });
        },
        [onUpdate]
    );

    const handleSubvillageBlur = useCallback(() => {
        onUpdate({ subvillage: subvillage?.trim() });
    }, [subvillage, onUpdate]);

    const clearSelections = useCallback(() => {
        isResettingRef.current = true;
        setLocalCleared(true);
        setAddedVillages([]);
        setAddedVHTs([]);
        setAddedNumbers([]);

        onUpdate({
            village: '',
            subvillage: '',
            vhtName: '',
            vhtTelephone: '',
            vhtUuid: ''
        });
    }, [onUpdate]);

    // ========== Validation for discharge =============
    const validateForDischarge = useCallback(() => {
        const errors: string[] = [];

        if (!village?.trim()) {
            errors.push('Village is required');
        }

        if (!vhtName?.trim()) {
            errors.push('VHT name is required');
        }

        if (vhtTelephone?.trim()) {
            const validation = validatePhoneNumber(vhtTelephone);
            if (!validation.isValid) {
                errors.push(
                validation.errorMessage || 'Invalid phone number'
                );
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }, [village, vhtName, vhtTelephone]);

    return {
        // Data
        allVillages: villages,
        allVHTs: vhts,
        allNumbers: telNumbers,
        village,
        subvillage,
        vhtName,
        vhtTelephone,

        // Handlers
        handleAddVillage,
        handleAddVHT,
        handleAddTel,
        handleVillageSelect,
        handleVHTSelect,
        handleTelSelect,
        handleSubvillageChange,
        handleSubvillageBlur,
        clearSelections,

        // Validation
        validateForDischarge
    };
};