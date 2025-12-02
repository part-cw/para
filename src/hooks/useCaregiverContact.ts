import { useEffect, useState } from "react";
import { confirmPhoneErrorMessage, isValidPhoneNumber, telephoneErrorMessage } from "../utils/inputValidator";


interface UseCaregiverContactProps {
    caregiverName?: string;
    caregiverTel?: string;
    confirmTel?: string;
    sendReminders?: boolean;
    isCaregiversPhone?: boolean;
    onUpdate: (updates: {
        caregiverName?: string;
        caregiverTel?: string;
        confirmTel?: string;
        sendReminders?: boolean;
        isCaregiversPhone?: boolean;
    }) => void;
    mode?: 'admission' | 'edit' | 'discharge';
}

export const useCaregiverContact = ({
    caregiverName,
    caregiverTel,
    confirmTel,
    sendReminders,
    isCaregiversPhone,
    onUpdate,
    mode='admission'
}: UseCaregiverContactProps) => {

    const [ pageErrors, setPageErrors] = useState<string[]>([])

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

        return errors;
    };

    useEffect(() => {
        const errMessages = validateFields()
        setPageErrors(errMessages)
    }, [caregiverName, caregiverTel, confirmTel, mode])

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

    const handleIsCaregiversPhoneToggle = () => {
        onUpdate({ isCaregiversPhone: !isCaregiversPhone });
    };

    const clearSelections = () => {
        onUpdate({
            caregiverName: '',
            caregiverTel: '',
            confirmTel: '',
            sendReminders: false,
            isCaregiversPhone: false
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

        // Handlers
        handleCaregiverNameChange,
        handleCaregiverTelChange,
        handleConfirmTelChange,
        handleSendRemindersToggle,
        handleIsCaregiversPhoneToggle,
        clearSelections,

        // Validation
        validateFields,
        hasErrors: pageErrors.length > 0
    }
}