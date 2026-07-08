import { useState } from 'react';
import { Modal, View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import { GlobalStyles as Styles } from '../themes/styles';
import Checkbox from './Checkbox';

type RiskLevelInterpretationModalProps = {
    showModal: boolean;
    onRequestClose: () => void;
    onElevate: () => void;
    onUndo: () => void;
    riskCategory?: string;
    isElevated?: boolean;
    originalRiskCategory?: string;
};

export default function RiskLevelInterpretationModal({
    showModal = false,
    onRequestClose,
    onElevate,
    onUndo,
    riskCategory,
    isElevated = false,
    originalRiskCategory,
}: RiskLevelInterpretationModalProps) {
    const { colors } = useTheme();

    const [ackRecommendations, setAckRecommendations] = useState<boolean>(false);
    const [ackValidated, setAckValidated] = useState<boolean>(false);

    const bothAcknowledged = ackRecommendations && ackValidated;

    // Once a prediction is elevated it can only be undone (not elevated again).
    // Otherwise, risk can't be elevated further once it's already at the highest level.
    const canElevate = !isElevated && riskCategory !== 'Very High';

    const handleClose = () => {
        setAckRecommendations(false);
        setAckValidated(false);
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                            Risk Level Interpretation
                        </Text>
                        <IconButton icon="close" size={24} onPress={handleClose} />
                    </View>

                    <Text style={[Styles.modalText, { color: colors.onSurface }]}>
                        The listed &lsquo;top predictors&rsquo; most influenced the model&rsquo;s risk level
                        prediction, but are not necessarily direct causes of death.
                    </Text>

                    {isElevated && (
                        <Text style={[Styles.modalText, { color: colors.onSurface }]}>
                            This risk level was manually elevated from{' '}
                            <Text style={{ fontWeight: 'bold' }}>{originalRiskCategory}</Text>. You can undo
                            the elevation to restore the model&rsquo;s calculated risk level.
                        </Text>
                    )}

                    {canElevate && (
                        <>
                            <Text style={[Styles.modalText, { color: colors.onSurface }]}>
                                If clinically justified, the risk level may be manually elevated. However, before
                                doing so, it is important to understand that:
                            </Text>

                            <View style={{ marginBottom: 20, gap: 12 }}>
                                <Checkbox
                                    label="Changing the risk level will affect care plan recommendations and follow-up schedules."
                                    checked={ackRecommendations}
                                    onChange={() => setAckRecommendations(prev => !prev)}
                                />
                                <Checkbox
                                    label="Our models are continuously validated and enhanced by our researchers."
                                    checked={ackValidated}
                                    onChange={() => setAckValidated(prev => !prev)}
                                />
                            </View>
                        </>
                    )}

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        {isElevated ? (
                            <>
                                <Button
                                    mode="contained"
                                    onPress={onUndo}
                                    buttonColor={colors.error}
                                    textColor={colors.onError}
                                    style={{ flex: 1 }}
                                >
                                    Undo Elevation
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={handleClose}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : canElevate ? (
                            <>
                                <Button
                                    mode="contained"
                                    onPress={onElevate}
                                    buttonColor={colors.error}
                                    textColor={colors.onError}
                                    style={{ flex: 1 }}
                                    disabled={!bothAcknowledged}
                                >
                                    Elevate Risk Level
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={handleClose}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                mode="contained"
                                onPress={handleClose}
                                buttonColor={colors.primary}
                                textColor={colors.onPrimary}
                                style={{ flex: 1 }}
                            >
                                OK
                            </Button>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}
