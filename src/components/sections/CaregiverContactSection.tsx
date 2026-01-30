import Checkbox from '@/src/components/Checkbox';
import ValidatedTextInput, { INPUT_TYPES } from '@/src/components/ValidatedTextInput';
import { useCaregiverContact } from '@/src/hooks/useCaregiverContact';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { confirmPhoneErrorMessage, isValidPhoneNumber, telephoneErrorMessage } from '@/src/utils/inputValidator';
import { convertToYesNo, normalizeBoolean } from '@/src/utils/normalizer';
import React from 'react';
import { Alert, Platform, View } from 'react-native';
import { Button, Card, IconButton, Text } from 'react-native-paper';
import RadioButtonGroup from '../RadioButtonGroup';
import SearchableDropdown from '../SearchableDropdown';

export const phoneOwnerOptions = [
        { value: 'Other relative of the patient', key: 'other-relative'},
        { value: 'Friend or neighbour', key: 'friend/neighbour'},
    ];

// Convert key to value for display
export const getPhoneOwnerValue = (key: string | undefined) => {
    if (!key) return '';
    return phoneOwnerOptions.find(opt => opt.key === key)?.value || '';
};

interface CaregiverContactSectionProps {
    caregiverName?: string;
    caregiverTel?: string;
    confirmTel?: string;
    sendReminders?: boolean;
    isCaregiversPhone?: boolean | null;
    phoneOwner?: string,
    onUpdate: (updates: {
        caregiverName?: string;
        caregiverTel?: string;
        confirmTel?: string;
        sendReminders?: boolean;
        isCaregiversPhone?: boolean | null;
        phoneOwner?: string;
    }) => void;
    colors: any;
    mode?: 'admission' | 'edit' | 'discharge';
    showHeader?: boolean;
    showClearButton?: boolean;
    onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export const CaregiverContactSection: React.FC<CaregiverContactSectionProps> = ({
    caregiverName,
    caregiverTel,
    confirmTel,
    sendReminders,
    isCaregiversPhone,
    phoneOwner,
    onUpdate,
    colors,
    mode = 'admission',
    showHeader = true,
    showClearButton = false,
    onValidationChange
}) => {
    const {
        pageErrors,
        isSameTelephone,
        handleCaregiverNameChange,
        handleCaregiverTelChange,
        handleConfirmTelChange,
        handleSendRemindersToggle,
        handleIsCaregiversPhoneToggle,
        handlePhoneOwnerChange,
        clearSelections,
        hasErrors
    } = useCaregiverContact({
        caregiverName,
        caregiverTel,
        confirmTel,
        sendReminders,
        isCaregiversPhone,
        phoneOwner,
        onUpdate,
        mode
    });

    // Notify parent of validation changes
    React.useEffect(() => {
        if (onValidationChange) {
            onValidationChange(!hasErrors, pageErrors);
        }
    }, [hasErrors, pageErrors, onValidationChange]);


    const telephoneOwnerQuestion = "Does this phone number belong to the patient's caregiver?"
    const telephoneInfo = "If the patient's caregiver does not have a phone, enter the number of a relative or friend who lives nearby";
    const telephoneCheckboxInfo = "Confirm whether the entered phone number belongs to the child's caregiver with whom he/she lives.";
    
    const receiveReminderInfo = "If selected, the caregiver will receive reminders for scheduled post-discharge follow-ups."
    const reminderQuestion = "Do you consent to receive reminders?"

    const confirmClear = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to clear all caregiver contact information?")) {
                clearSelections();
            }
        } else {
            Alert.alert(
                "Confirm Clear",
                "Are you sure you want to clear all caregiver contact information?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "OK", onPress: clearSelections }
                ]
            );
        }
    };

    return (
        <>
            {showHeader && (
                <Card style={Styles.cardWrapper}>
                    <Card.Content>
                        <Text variant="bodyLarge">
                            The following information will be sent to the VHT so
                            they can connect with the patient and their caregiver.
                        </Text>
                        <Text variant="bodyLarge" style={{ marginTop: 10 }}>
                            Enter the contact information of the
                            <Text style={{ fontWeight: 'bold' }}> patient's parent or guardian</Text>.
                            This may be different from the person who brought in the patient.
                        </Text>
                    </Card.Content>
                </Card>
            )}

            <ValidatedTextInput
                label={mode === 'discharge' ? "Name of Head of Family (required)" : "Name of Head of Family"}
                placeholder="Enter name of the patient's primary caregiver"
                value={caregiverName || ''}
                onChangeText={handleCaregiverNameChange}
                inputType={INPUT_TYPES.TEXT}
                isRequired={mode === 'discharge'}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ValidatedTextInput
                    label={mode === 'discharge' ? "Telephone (required)" : "Telephone"}
                    placeholder="Enter phone number"
                    value={caregiverTel || ''}
                    onChangeText={handleCaregiverTelChange}
                    inputType={INPUT_TYPES.PHONE}
                    customValidator={() => isValidPhoneNumber(caregiverTel || '')}
                    customErrorMessage={telephoneErrorMessage}
                    isRequired={mode === 'discharge'}
                    style={{ flex: 1 }}
                    showErrorOnTyping={true}
                />
                <IconButton
                    icon="help-circle-outline"
                    size={20}
                    iconColor={colors.primary}
                    onPress={() => { alert(telephoneInfo) }}
                />
            </View>

            <ValidatedTextInput
                label="Confirm Telephone (required)"
                placeholder="Re-enter phone number"
                inputType='phone'
                value={confirmTel || ''}
                onChangeText={handleConfirmTelChange}
                customValidator={() => isSameTelephone && isValidPhoneNumber(caregiverTel || '')}
                customErrorMessage={confirmPhoneErrorMessage}
                isRequired={caregiverTel ? true : false}
                style={{ flex: 1 }}
            />

            { caregiverTel?.trim() &&
                <View style={{ marginLeft: 8, marginRight: 8 }}>
                    <Text style={Styles.sectionHeader}>Additional Information</Text>
                    <View>
                        <View style={{flexDirection:'row', alignItems: 'center'}}>
                            <Text style={[Styles.accordionSubheading, {fontWeight: 'bold', flex: 1}]}>{telephoneOwnerQuestion} <Text style={Styles.required}>*</Text></Text>
                            <IconButton
                                icon="help-circle-outline"
                                size={20}
                                iconColor={colors.primary}
                                onPress={() => {
                                    Platform.OS !== 'web' ? Alert.alert('Confirm telephone owner', telephoneCheckboxInfo) : alert(telephoneCheckboxInfo)
                                }}
                            />
                        </View>
                        <RadioButtonGroup 
                            options={[
                                { label: 'Yes', value: 'yes'},
                                { label: 'No', value: 'no'},
                            ]} 
                            selected={isCaregiversPhone === null ? null : convertToYesNo(normalizeBoolean(isCaregiversPhone as boolean))} 
                            onSelect={(value) => {
                                handleIsCaregiversPhoneToggle(value)
                            }}
                        />
                        {normalizeBoolean(isCaregiversPhone as boolean) === false &&
                            <SearchableDropdown 
                                data={phoneOwnerOptions} 
                                label={'Select telephone owner'}
                                search={false} 
                                value={getPhoneOwnerValue(phoneOwner)}
                                onSelect={(selected) => {
                                    handlePhoneOwnerChange(selected.key)}
                                }  
                                style={{paddingTop: 10}}                          
                            />
                        }
                    </View>
                    
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[Styles.accordionSubheading, {fontWeight: 'bold', flex: 1}]}>{reminderQuestion}</Text>
                            <IconButton
                                icon="help-circle-outline"
                                size={20}
                                iconColor={colors.primary}
                                onPress={() => { alert(receiveReminderInfo) }}
                            />
                        </View>
                        <Checkbox
                            label={"Yes, receive reminders by text message"}
                            checked={sendReminders || false}
                            onChange={handleSendRemindersToggle}
                        />
                    </View>
                    
                    
                </View>
            }

            {showClearButton && (
                <Button
                    style={{ alignSelf: 'center', marginTop: 16 }}
                    mode="elevated"
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    onPress={confirmClear}
                >
                    Clear All Contact Info
                </Button>
            )}
        </>
    );
};