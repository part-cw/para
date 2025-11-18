
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';


type EditFieldProps = {
  fieldLabel: string;
  fieldValue: string;
  editLabel?: string;
  canEdit: boolean;
  onClickEdit?: () => void;
  children: React.ReactNode;
}

type EditBoxProps = {
  label?: string;
  canEdit: boolean;
  children?: React.ReactNode;
};

export function EditFieldGroup({ 
    fieldLabel, 
    fieldValue, 
    editLabel, 
    canEdit = true, 
    onClickEdit, 
    children}: EditFieldProps) {

    const { colors } = useTheme()
    const [showEdit, setShowEdit] = useState(false)

    return (
        <>
            <View style={{flexDirection: 'row', marginBottom: 8, alignItems: 'center'}}>
                <Text style={styles.fieldLabel}>
                    {fieldLabel}
                </Text>
                <Text style={styles.fieldValue}>
                    {fieldValue}
                </Text>
                {canEdit && (
                    <IconButton
                        icon='lead-pencil'
                        iconColor={colors.primary}
                        size={20}
                        onPress={() => setShowEdit(prev => !prev)}
                    />
                )}
            </View>

            { showEdit &&
            <EditBox 
                label= {editLabel}
                canEdit={canEdit} 
            >
                {children}
            </EditBox>
            }
        </>
    )

}


export  function EditBox({ label, canEdit, children}: EditBoxProps) {
    if (!canEdit) return null;

    return (
        <View style={styles.editFieldContainer}>
            <Text style={styles.editLabel}>
                {label}
            </Text>
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
  editFieldContainer: {
    backgroundColor: 'rgb(255, 245, 198)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgb(248, 203, 0)',
  },

  editLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  fieldLabel: {
    fontWeight: 'bold', 
    flex: 1, 
    fontSize: 16
  },
  fieldValue: {
    flex: 2, 
    fontSize: 16, 
    marginLeft: 20
  },
  
});