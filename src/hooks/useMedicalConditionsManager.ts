import { PatientData } from '@/src/contexts/PatientData';
import { getOtherChronicIllnessList } from '@/src/utils/formatUtils';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { displayNames } from '../forms/displayNames';
import { IStorageService } from '../services/StorageService';

interface UseMedicalConditionsManagerProps {
    patientId: string;
    patientData: PatientData;
    storage: IStorageService;
    onRefresh: () => Promise<void>;
}

export const useMedicalConditionsManager = ({
    patientId,
    patientData,
    storage,
    onRefresh
}: UseMedicalConditionsManagerProps) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const [editedPneumonia, setEditedPneumonia] = useState<string>('');
    const [editedSevereAnaemia, setEditedSevereAnaemia] = useState<string>('');
    const [editedDiarrhea, setEditedDiarrhea] = useState<string>('');
    const [editedMalaria, setEditedMalaria] = useState<string>('');
    const [editedSepsis, setEditedSepsis] = useState<string>('');
    const [editedMeningitis, setEditedMeningitis] = useState<string>('');
    
    const [editedChronicIllness, setEditedChronicIllness] = useState<string[]>(patientData.chronicIllnesses || []);
    const [editedOtherChronicIllness, setEditedOtherChronicIllness] = useState<string>('');
    const [showOtherChronicIllnessModal, setShowOtherChronicIllnessModal] = useState(false);

    // Sync with patientData changes
    useEffect(() => {
        if (patientData?.chronicIllnesses) {
            setEditedChronicIllness(patientData.chronicIllnesses);
        }
    }, [patientData?.chronicIllnesses]);


    // ========= HELPER FUNCTIONS  ================
    const canEditCondition = (currentValue: string | undefined, condition?: string): boolean => {
        if (!currentValue) return true;
        if (condition === 'diarrhea') return true;

        const normalizedValue = currentValue.toLowerCase();
        return normalizedValue === 'unsure' || normalizedValue === 'suspected';
    };

    const getAllowedOptions = (currentValue: string | undefined, condition?: string) => {
        if (!currentValue) return [];
        
        const normalizedValue = currentValue.toLowerCase();
        
        if (normalizedValue === 'unsure') {
            return [
                { label: 'Yes - positive diagnosis', value: 'Yes' }, // use just pos or just neg instead? -- TODO
                { label: 'No - negative diagnosis', value: 'No' },
                { label: 'Suspected', value: 'Suspected' }
            ];
        }
        
        if (normalizedValue === 'suspected') {
            return [
                { label: 'Yes - positive diagnosis', value: 'Yes' },
                { label: 'No - negative diagnosis', value: 'No' }
            ];
        }

        if (condition === 'diarrhea') {
            return [
                { label: 'Acute', value: 'Acute' },
                { label: 'Persistent', value: 'Persistent' },
                { label: 'Neither acute nor persistent', value: 'Neither' },
            ];
        }

        return [];
    };

    // ========= SINGLE CONDITION HANDLER  ================
    const handleUpdateMedicalCondition = async (
        fieldName: string, 
        newValue: string, 
        previousValue: string,
        setEditValue: (val: string) => void
    ) => {
        const confirmUpdate = async () => {
            try {
                setIsUpdating(true);
                
                await storage.updatePatient(patientId, { [fieldName]: newValue });
                await storage.logChanges(patientId, 'UPDATE', fieldName, previousValue, newValue);
                
                setIsUpdating(false);
                setEditValue(''); // Clear edit state
                
                await onRefresh();
                // Alert.alert('Success', 'Medical condition updated successfully');
            } catch (error) {
                console.error('Error updating medical condition:', error);
                Alert.alert('Error', 'Failed to update medical condition');
                setIsUpdating(false);
            }
        };

        if (Platform.OS !== 'web') {
            Alert.alert(
                'Confirm Update',
                `Update ${displayNames[fieldName] || fieldName} from "${previousValue}" to "${newValue}"?\n\nChanges may affect careplan recommendations.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'OK', onPress: () => confirmUpdate() }
                ]
            );
        } else {
            // TODO - add alert for web
            confirmUpdate();
        }
    };

    // ========= CHRONIC ILLNESS HANDLERS ================
    const handleChronicIllnessChange = (selected: string[]) => {
        const wasAdded = selected.filter(item => !editedChronicIllness.includes(item));
        const wasRemoved = editedChronicIllness.filter(item => !selected.includes(item));

        // Handle "none" selection
        if (wasAdded.includes('none')) {
            setEditedChronicIllness(['none']);
            return;
        }

        if (wasRemoved.includes('none')) {
            setEditedChronicIllness([]);
            return;
        }

        // TODO delete this - should never reach this case
        // Handle "other" being added while "none" exists 
        // if (selected.includes('none') && selected.length > 1) {
        //     const withoutNone = selected.filter(item => item !== 'none');
        //     setEditedChronicIllness(withoutNone);
            
        //     if (wasAdded.includes('other')) {
        //         Alert.alert(
        //             'Other Chronic Condition',
        //             'Enter one or multiple conditions, if known, or click cancel',
        //             [
        //                 {
        //                     text: 'Cancel',
        //                     style: 'cancel',
        //                     onPress: () => {
        //                         // remove 'other' if user cancels
        //                         setEditedChronicIllness(withoutNone.filter(item => item !== 'other'));
        //                     }
        //                 },
        //                 { text: 'Add Condition', onPress: () => setShowOtherChronicIllnessModal(true) }
        //             ]
        //         );
        //     }
        //     return;
        // }

        // Normal selection - update state
        setEditedChronicIllness(selected);

        // Show modal only if "other" was JUST ADDED
        if (wasAdded.includes('other')) {
            Alert.alert(
                'Other Chronic Condition',
                'Enter one or multiple conditions, if known, or click cancel',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            setEditedChronicIllness(selected.filter(item => item !== 'other'));
                        }
                    },
                    { text: 'Add Condition', onPress: () => setShowOtherChronicIllnessModal(true) }
                ]
            );
        }
    };

    const handleUpdateChronicIllness = async () => {
        if (!editedChronicIllness || editedChronicIllness.length === 0) {
            Alert.alert('Required', 'Please select at least one chronic condition');
            return;
        }

        const confirmUpdate = async () => {
            try {
                setIsUpdating(true);

                const previousConditions = patientData?.chronicIllnesses || [];
                const updates: Partial<PatientData> = { chronicIllnesses: editedChronicIllness };
                const previous: Partial<PatientData> = { chronicIllnesses: previousConditions };

                // If 'none' is selected, clear otherChronicIllness
                if (editedChronicIllness.includes('none')) {
                    updates.otherChronicIllness = '';
                    updates.chronicIllnesses = ['none'];

                    if (patientData?.otherChronicIllness) {
                        previous.otherChronicIllness = patientData.otherChronicIllness;
                    }
                } else if (!editedChronicIllness.includes('other') && patientData?.otherChronicIllness) {
                    // If 'other' was removed, clear otherChronicIllness
                    updates.otherChronicIllness = '';
                    previous.otherChronicIllness = patientData.otherChronicIllness;
                }

                await storage.doBulkUpdate(patientId, updates, previous);

                setIsUpdating(false);
                await onRefresh();
                // Alert.alert('Success', 'Chronic conditions updated successfully');
            } catch (error) {
                console.error('Error updating chronic illnesses:', error);
                Alert.alert('Error', 'Failed to update chronic conditions');
                setIsUpdating(false);
            }
        };

        if (Platform.OS !== 'web') {
            Alert.alert('Confirm Update', 'Update chronic conditions?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: () => confirmUpdate() }
            ]);
        } else {
            confirmUpdate();
        }
    };

    const handleUpdateOtherChronicIllness = async () => {
        if (!editedOtherChronicIllness.trim()) {
            Alert.alert('Required', 'Please enter a chronic illness description');
            return;
        }

        const confirmUpdate = async () => {
            try {
                setIsUpdating(true);

                const currentIllnesses = getOtherChronicIllnessList(patientData?.otherChronicIllness);
                
                // Parse the input - could be single illness or comma-separated list
                const newIllnesses = editedOtherChronicIllness
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean);

                // Check for duplicates
                const duplicates: string[] = [];
                const toAdd: string[] = [];

                newIllnesses.forEach(newIllness => {
                    if (currentIllnesses.some(existing =>
                        existing.toLowerCase() === newIllness.toLowerCase()
                    )) {
                        duplicates.push(newIllness);
                    } else {
                        toAdd.push(newIllness);
                    }
                });

                // Warn about duplicates but continue with non-duplicates
                if (duplicates.length > 0 && toAdd.length === 0) {
                    Alert.alert('Duplicate', 'All entered illnesses are already in the list');
                    setIsUpdating(false);
                    return;
                }

                // Combine current and new illnesses
                const updatedIllnesses = [...currentIllnesses, ...toAdd];
                const updatedValue = updatedIllnesses.join(', ');

                // Use editedChronicIllness if it has changes, otherwise use current
                const currentChronicIllnesses = editedChronicIllness.length > 0
                    ? editedChronicIllness
                    : (patientData?.chronicIllnesses || []);

                // Add 'other' to chronicIllnesses if not already present
                // Remove 'none' if present (shouldn't be there with 'other') 
                const updatedChronicIllnesses = currentChronicIllnesses
                    .filter(item => item !== 'none')
                    .concat(currentChronicIllnesses.includes('other') ? [] : ['other']);

                // update storage 
                const storageUpdates = {
                    otherChronicIllness: updatedValue,
                    chronicIllnesses: updatedChronicIllnesses
                };

                const previousStorageValues = {
                    otherChronicIllness: patientData?.otherChronicIllness || '',
                    chronicIllnesses: patientData?.chronicIllnesses || []
                };

                await storage.doBulkUpdate(patientId, storageUpdates, previousStorageValues);

                setIsUpdating(false);
                setEditedOtherChronicIllness('');
                setShowOtherChronicIllnessModal(false);

                await onRefresh();

                // Show appropriate success message
                const addedCount = toAdd.length;
                const message = addedCount === 1
                    ? `Added "${toAdd[0]}" to other chronic illnesses`
                    : `Added ${addedCount} illnesses to other chronic illnesses`;

                if (duplicates.length > 0) {
                    Alert.alert(
                        'Partially Added',
                        `${message}\n\nSkipped duplicates: ${duplicates.join(', ')}`
                    );
                } else {
                    Alert.alert('Success', message);
                }
            } catch (error) {
                console.error('Error updating other chronic illness:', error);
                Alert.alert('Error', 'Failed to update other chronic illness');
                setIsUpdating(false);
            }
        };

        const illnessCount = editedOtherChronicIllness.split(',').filter(s => s.trim()).length;
        const confirmMessage = illnessCount > 1
            ? `Add ${illnessCount} chronic illnesses?`
            : `Add "${editedOtherChronicIllness.trim()}" to other chronic illnesses?`;

        if (Platform.OS !== 'web') {
            Alert.alert('Confirm Update', confirmMessage, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Add', onPress: () => confirmUpdate() }
            ]);
        } else {
            confirmUpdate();
        }
    };

    // remove an illness from the 'other chronic illness' list
    const handleRemoveOtherChronicIllness = async (illnessToRemove: string) => {
        const confirmRemove = async () => {
            try {
                setIsUpdating(true);

                const currentIllnesses = getOtherChronicIllnessList(patientData?.otherChronicIllness);
                const updatedIllnesses = currentIllnesses.filter(
                    illness => illness.toLowerCase() !== illnessToRemove.toLowerCase()
                );

                const updatedValue = updatedIllnesses.length > 0 ? updatedIllnesses.join(', ') : '';

                // If no more other illnesses, remove 'other' from chronicIllnesses
                const updates: any = { otherChronicIllness: updatedValue };
                if (updatedIllnesses.length === 0) {
                    const updatedChronicIllnesses = (patientData?.chronicIllnesses || []).filter(
                        (item: string) => item !== 'other'
                    );
                    updates.chronicIllnesses = updatedChronicIllnesses;
                }

                // update storage
                await storage.updatePatient(patientId, updates);
                await storage.logChanges(
                    patientId,
                    'UPDATE',
                    'otherChronicIllness',
                    patientData?.otherChronicIllness || '',
                    updatedValue
                );

                setIsUpdating(false);

                await onRefresh();
                Alert.alert('Success', `Removed "${illnessToRemove}" from other chronic illnesses`);
            } catch (error) {
                console.error('Error removing other chronic illness:', error);
                Alert.alert('Error', 'Failed to remove other chronic illness');
                setIsUpdating(false);
            }
        };

        if (Platform.OS !== 'web') {
            Alert.alert(
                'Confirm Removal',
                `Remove "${illnessToRemove}" from other chronic illnesses?\n\nChanges may affect careplan recommendations.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => confirmRemove() }
                ]
            );
        } else {
            confirmRemove();
        }
    };

    return {
        // State
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
        
        // Setters
        setEditedPneumonia,
        setEditedSevereAnaemia,
        setEditedDiarrhea,
        setEditedMalaria,
        setEditedMeningitis,
        setEditedSepsis,
        setEditedChronicIllness,
        setEditedOtherChronicIllness,
        setShowOtherChronicIllnessModal,
        
        // Handlers
        handleUpdateMedicalCondition,
        handleChronicIllnessChange,
        handleUpdateChronicIllness,
        handleUpdateOtherChronicIllness,
        handleRemoveOtherChronicIllness,

        // Helpers
        canEditCondition,
        getAllowedOptions
    };
};