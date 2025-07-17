import { StyleSheet } from 'react-native';
import { AppTheme } from './theme';


export const GlobalStyles = StyleSheet.create({


    // Checkbox - adapted from RRAte repo: 
    // https://github.com/part-cw/rrate/blob/main/assets/styles.tsx#L248C3-L268C5
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingRight: 30
    },
    checkbox: {
        height: 22,
        width: 22,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#666',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checked: {
        backgroundColor: AppTheme.colors.primary,
        borderColor: '#2e86de',
    },
    
})