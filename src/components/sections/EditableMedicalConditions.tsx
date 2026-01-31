import { Modal, TouchableOpacity, View } from "react-native";
import { Button, Text, TextInput } from 'react-native-paper';
import { PatientData } from "../../contexts/PatientData";
import { useMedicalConditionsManager } from "../../hooks/useMedicalConditionsManager";
import { IStorageService } from "../../services/StorageService";
import { GlobalStyles as Styles } from "../../themes/styles";
import { capitalizeFirstLetter, formatChronicIllness, getOtherChronicIllnessList } from "../../utils/formatUtils";
import CheckboxGroup from "../CheckboxGroup";
import { EditGroup } from "../EditFieldGroup";
import RadioButtonGroup from "../RadioButtonGroup";

interface MedicalConditionsSectionProps {
    patientId: string;
    patientData: PatientData;
    storage: IStorageService;
    onRefresh: () => Promise<void>;
    colors: any;
    canEdit?: boolean;
}

export const MedicalConditionsSection: React.FC<MedicalConditionsSectionProps>  = ({
    patientId,
    patientData,
    storage,
    onRefresh,
    colors,
    canEdit = true
}) => {

    const {
        isUpdating,
        editedPneumonia,
        editedSevereAnaemia,
        editedDiarrhea,
        editedMalaria,
        editedSepsis,
        editedMeningitis,
        editedChronicIllness,
        editedOtherChronicIllness,
        showOtherChronicIllnessModal,
        setEditedPneumonia,
        setEditedSevereAnaemia,
        setEditedDiarrhea,
        setEditedMalaria,
        setEditedSepsis,
        setEditedMeningitis,
        setEditedOtherChronicIllness,
        setShowOtherChronicIllnessModal,
        handleUpdateMedicalCondition,
        handleChronicIllnessChange,
        handleUpdateChronicIllness,
        handleUpdateOtherChronicIllness,
        handleRemoveOtherChronicIllness,
        canEditCondition,
        getAllowedOptions
    } = useMedicalConditionsManager({
        patientId,
        patientData,
        storage,
        onRefresh
    });

    const otherChronicIllnessSelected = patientData.chronicIllnesses?.includes('other');

    return (
        <>
            {/* Chronic Illness modal */}
            <Modal
                visible={showOtherChronicIllnessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowOtherChronicIllnessModal(false)}
            >
                <View style={Styles.modalOverlay}>
                    <View style={Styles.modalContentWrapper}>
                        <Text style={[Styles.modalHeader, {color: colors.primary}]}>
                            Add Chronic Conditions
                        </Text>

                        <Text style={[Styles.modalText]}>
                            Enter one or multiple conditions separated by commas, then click 'update'. 
                        </Text>

                        <TextInput
                            label="Enter chronic conditions"
                            mode="outlined"
                            value={editedOtherChronicIllness}
                            onChangeText={setEditedOtherChronicIllness}
                            style={[Styles.textInput, { marginTop: 10 }]}
                            multiline
                            numberOfLines={2}
                        />
                        <View style={{
                            flexDirection: 'row',
                            gap: 10,
                            marginTop: 20
                        }}>
                            <Button
                                mode="contained"
                                onPress={handleUpdateOtherChronicIllness}
                                buttonColor={colors.primary}
                                textColor={colors.onPrimary}
                                style={{ flex: 1,  }}
                                loading={isUpdating}
                                disabled={!editedOtherChronicIllness?.trim() || isUpdating}
                            >
                                Update
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
            
            <EditGroup 
                fieldLabel={"Malnutrition Status"} 
                fieldValue={capitalizeFirstLetter(patientData.malnutritionStatus as string) || 'Not provided'} 
                canEdit={false}     
                children={undefined}       
            />

            <EditGroup 
                fieldLabel={"Sick Young Infant"} 
                fieldValue={patientData.sickYoungInfant ? 'Yes' : 'No'} 
                canEdit={false}     
                children={undefined}       
            />

            {/* Pneumonia */}
            <EditGroup
                fieldLabel="Pneumonia"
                fieldValue={patientData.pneumonia || 'Not provided'}
                editLabel="Update Pneumonia Status:"
                canEdit={!patientData.isDischarged && canEditCondition(patientData.pneumonia)}
            >
                <RadioButtonGroup
                    options={getAllowedOptions(patientData.pneumonia)}
                    selected={editedPneumonia}
                    onSelect={setEditedPneumonia}
                />
                <Button
                    style={{ alignSelf: 'center' }}
                    icon='content-save-check'
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    mode='elevated'
                    onPress={() => handleUpdateMedicalCondition(
                        'pneumonia',
                        editedPneumonia,
                        patientData.pneumonia || '',
                        setEditedPneumonia
                    )}
                    loading={isUpdating}
                    disabled={!editedPneumonia}
                >
                    Update
                </Button>
            </EditGroup>

            {/* Severe Anaemia */}
            <EditGroup
                fieldLabel="Severe anaemia"
                fieldValue={patientData.severeAnaemia || 'Not provided'}
                editLabel="Update Severe Anaemia Status:"
                canEdit={!patientData.isDischarged && canEditCondition(patientData.severeAnaemia)}
            >
                <RadioButtonGroup
                    options={getAllowedOptions(patientData.severeAnaemia)}
                    selected={editedSevereAnaemia}
                    onSelect={setEditedSevereAnaemia}
                />
                <Button
                    style={{ alignSelf: 'center' }}
                    icon='content-save-check'
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    mode='elevated'
                    onPress={() => handleUpdateMedicalCondition(
                        'severeAnaemia',
                        editedSevereAnaemia,
                        patientData.severeAnaemia || '',
                        setEditedSevereAnaemia
                    )}
                    loading={isUpdating}
                    disabled={!editedSevereAnaemia}
                >
                    Update
                </Button>
            </EditGroup>

            {/* Diarrhea */}
            <EditGroup
                fieldLabel="Diarrhea"
                fieldValue={patientData.diarrhea || 'Not provided'}
                editLabel="Update Diarrhea Status:"
                canEdit={!patientData.isDischarged && canEditCondition(patientData.diarrhea, 'diarrhea')}
            >
                <RadioButtonGroup
                    options={getAllowedOptions(patientData.diarrhea, 'diarrhea')}
                    selected={editedDiarrhea}
                    onSelect={setEditedDiarrhea}
                />
                <Button
                    style={{ alignSelf: 'center' }}
                    icon='content-save-check'
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    mode='elevated'
                    onPress={() => handleUpdateMedicalCondition(
                        'diarrhea',
                        editedDiarrhea,
                        patientData.diarrhea || '',
                        setEditedDiarrhea
                    )}
                    loading={isUpdating}
                    disabled={!editedDiarrhea}
                >
                    Update
                </Button>
            </EditGroup>

            {/* Malaria */}
            <EditGroup
                fieldLabel="Malaria"
                fieldValue={patientData.malaria || 'Not provided'}
                editLabel="Update Malaria Status:"
                canEdit={!patientData.isDischarged && canEditCondition(patientData.malaria)}
            >
                <RadioButtonGroup
                    options={getAllowedOptions(patientData.malaria)}
                    selected={editedMalaria}
                    onSelect={setEditedMalaria}
                />
                <Button
                    style={{ alignSelf: 'center' }}
                    icon='content-save-check'
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    mode='elevated'
                    onPress={() => handleUpdateMedicalCondition(
                        'malaria',
                        editedMalaria,
                        patientData.malaria || '',
                        setEditedMalaria
                    )}
                    loading={isUpdating}
                    disabled={!editedMalaria}
                >
                    Update
                </Button>
            </EditGroup>

            {/* Sepsis */}
            <EditGroup
                fieldLabel="Sepsis"
                fieldValue={patientData.sepsis || 'Not provided'}
                editLabel="Update Sepsis Status:"
                canEdit={!patientData.isDischarged && canEditCondition(patientData.sepsis)}
            >
                <RadioButtonGroup
                    options={getAllowedOptions(patientData.sepsis)}
                    selected={editedSepsis}
                    onSelect={setEditedSepsis}
                />
                <Button
                    style={{ alignSelf: 'center' }}
                    icon='content-save-check'
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    mode='elevated'
                    onPress={() => handleUpdateMedicalCondition(
                        'sepsis',
                        editedSepsis,
                        patientData.sepsis || '',
                        setEditedSepsis
                    )}
                    loading={isUpdating}
                    disabled={!editedSepsis}
                >
                    Update
                </Button>
            </EditGroup>

            {/* Meningitis/Encephalitis */}
            <EditGroup
                fieldLabel="Meningitis/Encephalitis"
                fieldValue={patientData.meningitis_encephalitis || 'Not provided'}
                editLabel="Update Meningitis/Encephalitis Status:"
                canEdit={!patientData.isDischarged && canEditCondition(patientData.meningitis_encephalitis)}
            >
                <RadioButtonGroup
                    options={getAllowedOptions(patientData.meningitis_encephalitis)}
                    selected={editedMeningitis}
                    onSelect={setEditedMeningitis}
                />
                <Button
                    style={{ alignSelf: 'center' }}
                    icon='content-save-check'
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    mode='elevated'
                    onPress={() => handleUpdateMedicalCondition(
                        'meningitis_encephalitis',
                        editedMeningitis,
                        patientData.meningitis_encephalitis || '',
                        setEditedMeningitis
                    )}
                    loading={isUpdating}
                    disabled={!editedMeningitis}
                >
                    Update
                </Button>
            </EditGroup>

            {/* Chronic Conditions */}
            <EditGroup
                fieldLabel="Chronic Conditions"
                fieldValue={formatChronicIllness(patientData.chronicIllnesses) || 'Not provided'}
                editLabel="Update Chronic Conditions Status:"
                canEdit={!patientData.isDischarged}
            >
                <CheckboxGroup 
                    options={[
                        {label: 'HIV', value: 'HIV'},
                        {label: 'Tuberculosis', value: 'Tuberculosis'},
                        {label: 'Sickle cell anaemia', value: 'sickle cell anaemia'},
                        {label: 'Social vulnerability/Extreme poverty', value: 'extreme poverty'},
                        {label: 'Unsure', value: 'unsure'},
                        {label: 'None', value: 'none'},
                        {label: 'Other', value: 'other'}
                    ]} 
                    selected={editedChronicIllness}
                    onSelectionChange={handleChronicIllnessChange}
                />
                <Button
                    style={{ alignSelf: 'center' }}
                    icon='content-save-check'
                    buttonColor={colors.primary}
                    textColor={colors.onPrimary}
                    mode='elevated'
                    onPress={handleUpdateChronicIllness}
                    loading={isUpdating}
                    disabled={editedChronicIllness.length === 0}
                >
                    Update
                </Button>
            </EditGroup>

            {/* Other Chronic Illness - Show if 'other' is selected OR already has value */}
            {(editedChronicIllness.includes('other') || otherChronicIllnessSelected) && (
                <View style={{ marginTop: 10 }}>

                        {/* Add new illness form */}
                    {!patientData.isDischarged && (
                        <EditGroup
                            fieldLabel="Other Conditions"
                            fieldValue=""
                            editLabel="Enter one or multiple conditions (separate with commas):"
                            canEdit={true}
                        >
                            <TextInput
                                label="Other chronic condition(s)"
                                placeholder="Enter condition"
                                mode="outlined"
                                value={editedOtherChronicIllness}
                                onChangeText={setEditedOtherChronicIllness}
                                style={[Styles.textInput, { marginTop: 10 }]}
                                multiline
                                numberOfLines={2}
                            />
                            <Button
                                style={{ alignSelf: 'center', marginTop: 10 }}
                                icon='plus'
                                buttonColor={colors.primary}
                                textColor={colors.onPrimary}
                                mode='elevated'
                                onPress={handleUpdateOtherChronicIllness}
                                loading={isUpdating}
                                disabled={!editedOtherChronicIllness?.trim()}
                            >
                                Add Condition
                            </Button>
                        </EditGroup>
                    )}
                    
                    {/* Display list of other chronic illnesses */}
                    {getOtherChronicIllnessList(patientData.otherChronicIllness).length > 0 ? (
                        <View style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: 12, 
                            borderRadius: 8,
                            marginBottom: 12 
                        }}>
                            {getOtherChronicIllnessList(patientData.otherChronicIllness).map((illness, index) => (
                                <View 
                                    key={index} 
                                    style={{ 
                                        flexDirection: 'row', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        paddingVertical: 6,
                                        borderBottomWidth: index < getOtherChronicIllnessList(patientData.otherChronicIllness).length - 1 ? 1 : 0,
                                        borderBottomColor: '#e0e0e0'
                                    }}
                                >
                                    <Text style={{ flex: 1, fontSize: 15 }}>• {illness}</Text>
                                    {!patientData.isDischarged && (
                                        <TouchableOpacity
                                            onPress={() => handleRemoveOtherChronicIllness(illness)}
                                            style={{ 
                                                padding: 4,
                                                marginLeft: 8
                                            }}
                                        >
                                            <Text style={{ color: '#f44336', fontSize: 18 }}>✕</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={{ 
                            fontSize: 14, 
                            color: '#666', 
                            fontStyle: 'italic',
                            marginBottom: 12 
                        }}>
                            No other chronic illnesses recorded
                        </Text>
                    )}
                </View>
            )}
        </>
    )
}