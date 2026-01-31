import SearchableDropdown from '@/src/components/SearchableDropdown';
import { useVHTReferral } from '@/src/hooks/useVHTReferral';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { formatPhoneNumber, validatePhoneNumber } from '@/src/utils/inputValidator';
import React, { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { Button, Card, List, Text, TextInput } from 'react-native-paper';

interface VHTReferralSectionProps {
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
    colors: any;
    mode?: 'admission' | 'edit' | 'discharge';
    showClearButton?: boolean;
    showHeader?: boolean;
    onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export const VHTReferralSection: React.FC<VHTReferralSectionProps> = ({
    village,
    subvillage,
    vhtName,
    vhtTelephone,
    onUpdate,
    colors,
    mode = 'admission',
    showClearButton = true,
    showHeader = true,
    onValidationChange
}) => {
    const {
        allVillages,
        allVHTs,
        allNumbers,
        handleAddVillage,
        handleAddVHT,
        handleAddTel,
        handleVillageSelect,
        handleVHTSelect,
        handleTelSelect,
        handleSubvillageChange,
        handleSubvillageBlur,
        clearSelections,
        validateForDischarge
    } = useVHTReferral({
        village,
        subvillage,
        vhtName,
        vhtTelephone,
        onUpdate
    });

    const [openDropdown, setOpenDropdown] = useState<string>('');

    // Trigger validation for discharge mode
    React.useEffect(() => {
        if (mode === 'discharge' && onValidationChange) {
            const validation = validateForDischarge();
            onValidationChange(validation.isValid, validation.errors);
        }
    }, [village, vhtName, vhtTelephone, mode, onValidationChange]);

    const confirmClear = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to clear selections? All entered data will be wiped.")) {
                clearSelections();
            }
        } else {
            Alert.alert(
                "Confirm Clear",
                "Are you sure you want to clear selections? All entered data will be wiped.",
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
                            To connect the patient to a Community Health Worker (CHW) who can follow
                            up with them, enter the closest village to where they will stay one
                            week after discharge and their CHW's contact information.
                        </Text>
                    </Card.Content> 
                </Card>
            )}

            {/* Location Section */}
            <View style={Styles.accordionListWrapper}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                    <List.Icon icon="map-marker" color={colors.primary} />
                    <Text style={Styles.cardTitle}>Patient Address</Text>
                </View>
                <View style={Styles.accordionContentWrapper}>
                    <SearchableDropdown
                        data={allVillages}
                        label={mode === 'discharge' ? "Village (required)" : "Village"}
                        placeholder='Search or enter village name'
                        onSelect={handleVillageSelect}
                        onAddItem={handleAddVillage}
                        value={village || ''}
                        // isOpen={openDropdown === 'village'}
                        // onToggle={(open: boolean) => setOpenDropdown(open ? 'village' : '')}
                    />
                    <TextInput
                        label="Subvillage"
                        placeholder="Enter subvillage name"
                        mode="outlined"
                        style={Styles.textInput}
                        value={subvillage || ''}
                        onChangeText={handleSubvillageChange}
                        onBlur={handleSubvillageBlur}
                    />
                </View>
            </View>

            {/* VHT Contact Info Section */}
            <View style={Styles.accordionListWrapper}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                    <List.Icon icon="doctor" color={colors.primary} />
                    <Text style={Styles.cardTitle}>CHW Contact Information</Text>
                </View>
                <View style={Styles.accordionContentWrapper}>
                    <SearchableDropdown
                        data={allVHTs}
                        label={mode === 'discharge' ? "Name (required)" : "Name"}
                        placeholder='Search or enter CHW name'
                        onSelect={handleVHTSelect}
                        onAddItem={handleAddVHT}
                        value={vhtName || ''}
                        // isOpen={openDropdown === 'vhtName'}
                        // onToggle={(open: boolean) => setOpenDropdown(open ? 'vhtName' : '')}
                    />
                    <SearchableDropdown
                        data={allNumbers}
                        label="Telephone"
                        placeholder='Search or enter CHW telephone number'
                        onSelect={handleTelSelect}
                        onAddItem={handleAddTel}
                        value={vhtTelephone || ''}
                        validator={validatePhoneNumber}
                        formatter={(value) => formatPhoneNumber(value)}
                        showError={true}
                        keyboard='phone-pad'
                        // isOpen={openDropdown === 'vhtTel'}
                        // onToggle={(open: boolean) => setOpenDropdown(open ? 'vhtTel' : '')}
                    />
                </View>
            </View>

            {showClearButton && (
                <Button
                    style={{ alignSelf: 'center', marginTop: 5, marginBottom:20 }}
                    mode="elevated"
                    buttonColor={colors.secondary}
                    textColor={colors.onSecondary}
                    onPress={confirmClear}
                >
                    Clear All Referral Data
                </Button>
            )}
        </>
    );
};