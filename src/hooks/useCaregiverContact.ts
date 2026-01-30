import { useEffect, useState } from "react";
import { confirmPhoneErrorMessage, isValidPhoneNumber, telephoneErrorMessage } from "../utils/inputValidator";


interface UseCaregiverContactProps {
    caregiverName?: string;
    caregiverTel?: string;
    confirmTel?: string;
    sendReminders?: boolean;
    isCaregiversPhone?: boolean | null;
    phoneOwner?: string;
    onUpdate: (updates: {
        caregiverName?: string;
        caregiverTel?: string;
        confirmTel?: string;
        sendReminders?: boolean;
        isCaregiversPhone?: boolean | null;
        phoneOwner?: string;
    }) => void;
    mode?: 'admission' | 'edit' | 'discharge';
}

export const useCaregiverContact = ({
    caregiverName,
    caregiverTel,
    confirmTel,
    sendReminders,
    isCaregiversPhone,
    phoneOwner,
    onUpdate,
    mode='admission'
}: UseCaregiverContactProps) => {

    const [ pageErrors, setPageErrors] = useState<string[]>([])
    const [ previousTel, setPreviousTel ] = useState(caregiverTel);

    // Reset phone ownership when tel is first entered
    useEffect(() => {
        if (!previousTel && caregiverTel && caregiverTel.trim()) {
            // Phone was just entered for the first time
            onUpdate({ isCaregiversPhone: null });
        }
        setPreviousTel(caregiverTel);
    }, [caregiverTel]);


    const isSameTelephone = caregiverTel === confirmTel;

    const validateFields = () => {
        const errors: string[] = [];

        // Name validation required for discharge only
        if (mode === 'discharge') {
            if (!caregiverName || caregiverName.trim() === '') {
                errors.push('Caregiver name is required');
            }
        }

        // Phone validation
        if (caregiverTel && caregiverTel.trim() !== '') {
            if (!isValidPhoneNumber(caregiverTel)) {
                errors.push(telephoneErrorMessage);
            }

            // Confirm phone validation
            if (!isSameTelephone) {
                errors.push(confirmPhoneErrorMessage);
            }
        } 

        // Require phone ownership selection if phone is entered
        if (caregiverTel && caregiverTel.trim() !== '' && typeof(isCaregiversPhone) !== 'boolean') {
            errors.push('Please confirm whether this phone belongs to the caregiver');
        }

        // Require phone owner if "No" is selected ???
        // if (isCaregiversPhone === false && !phoneOwner) {
        //     errors.push('Please specify who owns this phone number');
        // }

        return errors;
    };

    useEffect(() => {
        const errMessages = validateFields()
        setPageErrors(errMessages)
    }, [caregiverName, caregiverTel, confirmTel, mode, isCaregiversPhone, phoneOwner])

    // Clear errors when component unmounts or navigates away
    useEffect(() => {
        return () => {
            // Only clear if no errors exist
            if (validateFields().length === 0) {
                setPageErrors([]);
            }
        };
    }, []);

    // HANDLERS
    const handleCaregiverNameChange = (value: string) => {
        onUpdate({ caregiverName: value });
    };

    const handleCaregiverTelChange = (value: string) => {
        onUpdate({ caregiverTel: value });
    };

    const handleConfirmTelChange = (value: string) => {
        onUpdate({ confirmTel: value });
    };

    const handleSendRemindersToggle = () => {
        onUpdate({ sendReminders: !sendReminders });
    };

    const handleIsCaregiversPhoneToggle = (value: string) => {
        const boolValue = value === 'yes' ? true : value === 'no' ? false : null;
        onUpdate({ isCaregiversPhone: boolValue });
    };

    const handlePhoneOwnerChange = (value: string) => {
        onUpdate({phoneOwner: value})
    }

    const clearSelections = () => {
        onUpdate({
            caregiverName: '',
            caregiverTel: '',
            confirmTel: '',
            sendReminders: false,
            isCaregiversPhone: null,
            phoneOwner: ''
        });
    };

    // HELPERS
    const getPageErrors = () => {
        const errors: string[] = [];
        
        if (caregiverTel && !isValidPhoneNumber(caregiverTel)) {
            errors.push(telephoneErrorMessage)
        }

        if (!isSameTelephone) {
            errors.push(confirmPhoneErrorMessage)
        }

        return errors;
    }

    return {
        // state
        caregiverName,
        caregiverTel,
        confirmTel,
        isCaregiversPhone,
        sendReminders,
        pageErrors,
        isSameTelephone,
        phoneOwner,

        // Handlers
        handleCaregiverNameChange,
        handleCaregiverTelChange,
        handleConfirmTelChange,
        handleSendRemindersToggle,
        handleIsCaregiversPhoneToggle,
        handlePhoneOwnerChange,
        clearSelections,

        // Validation
        validateFields,
        hasErrors: pageErrors.length > 0
    }
}