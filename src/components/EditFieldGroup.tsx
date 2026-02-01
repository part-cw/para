
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';


type EditGroupProps = {
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

export function EditGroup({ 
    fieldLabel, 
    fieldValue, 
    editLabel, 
    canEdit = true, 
    onClickEdit, 
    children}: EditGroupProps) {

    const { colors } = useTheme()
    const [showEdit, setShowEdit] = useState(false)

    return (
        <>
            <View style={{flexDirection: 'row', marginBottom: 8, alignItems: 'center'}}>
                <Text style={[styles.fieldLabel, {flex: 1}]}>
                    {fieldLabel}
                </Text>
                <Text style={[styles.fieldValue, {marginLeft: 10}]}>
                    {fieldValue}
                </Text>

                <View style={{ width: 32, alignItems: 'center' }}>
                  {canEdit === true && (
                      <IconButton
                          icon='lead-pencil'
                          iconColor={colors.primary}
                          size={20}
                          onPress={() => setShowEdit(prev => !prev)}
                          style={{ margin: 0 }}
                      />
                  )}
                </View>
            </View>

            { showEdit === true &&
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
    // marginLeft: 5
  },
  
});