import { Platform, StyleSheet } from 'react-native';
import { AppTheme } from './theme';


export const GlobalStyles = StyleSheet.create({
    container: { flex: 1 },
    
    accordionListWrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: 'white',
        elevation: 2, // TODO - confirm this works for iOS and web
        overflow: 'hidden',
    },

    accordionContentWrapper: { 
        paddingHorizontal: 30, 
        paddingVertical: 8, 
        gap: 8 
    },

    accordionListTitle: {
        fontSize: 18
    },

    accordionTextInput: {
        marginBottom: 8,
    },

     accordionSubheading: {
        fontSize: 16,
        marginTop: 15,
        marginBottom: 8,
    },

    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 8,
    },
    
    label: {
        marginTop: 10,
        marginBottom: 4,
        fontSize: 14,
    },
    
    required: {
        color: 'red',
    },
    
    textInput: {
        marginBottom: 8,
        paddingLeft: 8
    },

    // Checkbox - adapted from RRAte repo: 
    // https://github.com/part-cw/rrate/blob/main/assets/styles.tsx#L248C3-L268C5
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingRight: 30,
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

    nextButtonContainer: {
        position: 'relative',
        right: 16,
        bottom: Platform.OS === 'ios' ? 30 : 16,
        alignSelf: 'flex-end',
    },

    previousButtonContainer: {
        position: 'relative',
        left: 16,
        bottom: Platform.OS === 'ios' ? 30 : 16,
        alignSelf: 'flex-start'
    },

    paginationButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        width: '100%'
    },
})