import { useState } from 'react';
import { Modal, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { GlobalStyles as Styles } from '../themes/styles';
import RadioButtonGroup from './RadioButtonGroup';

type ChangeRiskLevelProps = {
    showModal: boolean;
    onRequestClose: () => void;
    onSave: (newLevel: string | null) => void;
    currentRiskCategory?: string;
    /**
     * Labels of the levels this patient can be elevated to, lowest first. Only the levels above
     * the patient's current level can be selected (risk may be manually elevated, not lowered).
     */
    options: string[];
};

export default function ChangeRiskLevelModal({
    showModal = false,
    onRequestClose,
    onSave,
    currentRiskCategory,
    options,
}: ChangeRiskLevelProps) {
    const { colors } = useTheme();

    const [selected, setSelected] = useState<string | null>(null);

    const radioOptions = options.map((level) => ({ label: level, value: level }));

    const handleClose = () => {
        setSelected(null);
        onRequestClose();
    };

    return (
        <Modal
            visible={showModal}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={Styles.modalOverlay}>
                <View style={Styles.modalContentWrapper}>
                    <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 16 }}>
                        Change Risk Level
                    </Text>

                    <Text style={[Styles.modalText, { color: colors.onSurface }]}>
                        The current risk level is <Text style={{ fontWeight: 'bold' }}>{currentRiskCategory}</Text>.
                        Please select a new risk level to elevate to, if clinically justified.
                    </Text>

                    <View style={{ marginBottom: 20 }}>
                        <RadioButtonGroup
                            options={radioOptions}
                            selected={selected}
                            onSelect={(value) => setSelected(value)}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        <Button
                            mode="contained"
                            onPress={() => onSave(selected)}
                            buttonColor={colors.error}
                            textColor={colors.onError}
                            style={{ flex: 1 }}
                            disabled={selected == null}
                        >
                            Save
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={handleClose}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
