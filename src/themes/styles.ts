import { Platform, StyleSheet } from 'react-native';
import { AppTheme } from './theme';

// TODO - delete unused styles

export const GlobalStyles = StyleSheet.create({
    container: { flex: 1 },
    
    accordionListWrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 12,
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
        fontSize: 18,
    },

    cardTitle: {
        fontSize: 18,
        marginLeft: 10,
        color: AppTheme.colors.primary
    },

    accordionTextInput: {
        marginBottom: 8,
    },

     accordionSubheading: {
        fontSize: 16,
        marginTop: 15,
        marginBottom: 8,
    },

    cardWrapper: {
        backgroundColor: AppTheme.colors.secondary,
        marginBottom: 16,
    },

    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 8,
    },

    label: {
        fontSize: 16,
        fontWeight: 'bold',
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

    errorText: {
        color: '#d32f2f',
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 12,
        lineHeight: 16,
    },

    warningText: {
        color: '#e65100',
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 12,
        lineHeight: 16,
    },

    pageHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, // original height 1
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4, //origiall 3

        // new stuff
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: 'white',
        marginBottom: 0,
        marginHorizontal: 0,
        marginTop: 0,

    },
    pageHeaderWrapper: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    pageHeaderTitle: {
        // original 
        flex: 1,
        textAlign: 'center',
        
        // new:
        fontSize: 20,
        fontWeight: '600',
        // textAlign: 'left',
        color: '#000',
    },
    editFieldContainer: {
        backgroundColor: 'rgb(255, 245, 198)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgb(248, 203, 0)'
    },
    modalContentWrapper: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16
    },
    modalSubheader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },

    modalText: {
        fontSize: 16,
        marginBottom: 20,
        color: '#666'
    }
})