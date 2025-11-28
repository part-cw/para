import { DropdownItem } from '@/src/components/SearchableDropdown';
import { validatePhoneNumber } from '@/src/utils/inputValidator';
import { vhtData as allData } from '@/src/utils/vhtDataLoader';
import {
    filterTelephoneNumbers,
    filterVHTs,
    filterVillages,
    getTelephoneDropdownItems,
    getVhtDropdownItems,
    getVillageDropdownItems
} from '@/src/utils/vhtDataProcessor';
import { useEffect, useState } from 'react';

interface UseVHTReferralProps {
    village?: string;
    subvillage?: string;
    vhtName?: string;
    vhtTelephone?: string;
    onUpdate: (updates: {
        village?: string;
        subvillage?: string;
        vhtName?: string;
        vhtTelephone?: string;
    }) => void;
}

export const useVHTReferral = ({
    village,
    subvillage,
    vhtName,
    vhtTelephone,
    onUpdate
}: UseVHTReferralProps) => {
    const [villages, setVillages] = useState<DropdownItem[]>(() => getVillageDropdownItems(allData));
    const [vhts, setVHTs] = useState<DropdownItem[]>(() => getVhtDropdownItems(allData));
    const [telNumbers, setTelNumbers] = useState<DropdownItem[]>(() => getTelephoneDropdownItems(allData));

    const [addedVillages, setAddedVillages] = useState<DropdownItem[]>([]);
    const [addedVHTs, setAddedVHTs] = useState<DropdownItem[]>([]);
    const [addedNumbers, setAddedNumbers] = useState<DropdownItem[]>([]);

    const allVillages = [...villages, ...addedVillages];
    const allVHTs = [...vhts, ...addedVHTs];
    const allNumbers = [...telNumbers, ...addedNumbers];

    // Handle village selection change
    useEffect(() => {
        const isUserAddedVillage = !!addedVillages.find(v => v.value === village);
        const isUserAddedNumber = !!addedNumbers.find(n => n.value === vhtTelephone);

        const filteredVHTs = (isUserAddedVillage && !vhtTelephone) || (isUserAddedNumber && !village)
            ? getVhtDropdownItems(allData)
            : filterVHTs(allData, village, vhtTelephone);

        setVHTs(filteredVHTs);

        // Auto-select VHT if only one option AND no VHT currently selected
        if (filteredVHTs.length === 1 && !vhtName) {
            onUpdate({ vhtName: filteredVHTs[0].value });
        }
    }, [village, vhtTelephone]);

    // Handle VHT selection change
    useEffect(() => {
        const filteredVillages = filterVillages(allData, vhtName, vhtTelephone);
        setVillages(filteredVillages);

        // Auto-select village if only one option AND no village currently selected
        if (filteredVillages.length === 1 && !village) {
            onUpdate({ village: filteredVillages[0].value });
        }
    }, [vhtName, vhtTelephone]);

    // Handle telephone filtering
    useEffect(() => {
        const isUserAddedVillage = !!addedVillages.find(v => v.value === village);

        const filteredNumbers = (isUserAddedVillage && !vhtTelephone)
            ? getTelephoneDropdownItems(allData)
            : filterTelephoneNumbers(allData, vhtName, village);

        setTelNumbers(filteredNumbers);

        // Auto-populate tel if only option
        if (filteredNumbers.length === 1 && !vhtTelephone) {
            onUpdate({ vhtTelephone: filteredNumbers[0].value });
        }
    }, [village, vhtName]);

    // ========= HANDLERS ==============
    const handleAddVillage = (newVillage: DropdownItem) => {
        setAddedVillages(prev => [...prev, newVillage]);
    };

    const handleAddVHT = (newVHT: DropdownItem) => {
        setAddedVHTs(prev => [...prev, newVHT]);
    };

    const handleAddTel = (newNumber: DropdownItem) => {
        const validation = validatePhoneNumber(newNumber.value);
        if (validation.isValid) {
            const formattedNumber = {
                ...newNumber,
                value: validation.formattedValue || newNumber.value
            };
            setAddedNumbers(prev => [...prev, formattedNumber]);
            console.log('Added valid phone number:', formattedNumber.value);
        } else {
            console.error('Attempted to add invalid phone number:', newNumber.value);
        }
    };

    const handleVillageSelect = (selectedVillage: DropdownItem) => {
        onUpdate({ village: selectedVillage.value || '' });
    };

    const handleVHTSelect = (selectedVHT: DropdownItem) => {
        onUpdate({ vhtName: selectedVHT.value || '' });
    };

    const handleTelSelect = (selectedTel: DropdownItem) => {
        onUpdate({ vhtTelephone: selectedTel.value || '' });
    };

    const handleSubvillageChange = (value: string) => {
        onUpdate({ subvillage: value });
    };

    const handleSubvillageBlur = () => {
        onUpdate({ subvillage: subvillage?.trim() });
    };

    const clearSelections = () => {
        onUpdate({
            village: '',
            subvillage: '',
            vhtName: '',
            vhtTelephone: ''
        });
    };

    // Validation function for discharge
    const validateForDischarge = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!village || village.trim() === '') {
            errors.push('Village is required');
        }

        if (!vhtName || vhtName.trim() === '') {
            errors.push('VHT name is required');
        }

        if (vhtTelephone && vhtTelephone.trim() !== '') {
            const validation = validatePhoneNumber(vhtTelephone);
            if (!validation.isValid) {
                errors.push(validation.errorMessage || 'Invalid phone number');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    };

    return {
        // Data
        allVillages,
        allVHTs,
        allNumbers,
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