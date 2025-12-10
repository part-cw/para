import { Modal, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { GlobalStyles as Styles } from "../themes/styles";
import RadioButtonGroup from "./RadioButtonGroup";

type NeonatalJaundiceProps = {
    showModal: boolean;
    onRequestClose: () => void;
    selected: string;
    onSelect: (value: string) => void;
    onSave: () => void;
    isSaving?: boolean;
    saveDisabled?: boolean;
}

export default function NeonatalJaundiceModal({
    showModal = false,
    onRequestClose,
    selected,
    onSelect: onSelect,
    onSave,
    isSaving = false,
    saveDisabled = false
}: NeonatalJaundiceProps) {
    const { colors } = useTheme(); 

    return (
        <Modal
            visible={showModal}
            transparent={true}
            animationType="fade"
            onRequestClose={onRequestClose}
        >
            <View style={Styles.modalOverlay}>
                <View style={Styles.modalContentWrapper}>
                    <Text style={[Styles.modalHeader, {color: colors.primary}]}>
                        Neonatal Jaundice Required
                    </Text>
                    
                    <Text style={Styles.modalText}>
                        The patient is now classified as a neonate. Please provide neonatal jaundice status before you proceed.
                    </Text>

                    <Text style={[Styles.modalSubheader, {color: colors.primary}]}>
                        Does the patient have neonatal jaundice?
                    </Text>

                    <RadioButtonGroup
                        options={[
                            { label: 'Yes', value: 'yes' },
                            { label: 'No', value: 'no' }
                        ]}
                        selected={selected}
                        onSelect={onSelect}
                    />

                    <View style={{
                        flexDirection: 'row',
                        gap: 10,
                        marginTop: 20
                    }}>
                        <Button
                            mode="contained"
                            onPress={onSave}
                            buttonColor={colors.primary}
                            textColor={colors.onPrimary}
                            style={{ flex: 1 }}
                            loading={isSaving}
                            disabled={saveDisabled}
                        >
                            Save & Continue
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    )
}