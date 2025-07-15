import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';

// TODO: modify as needed
// Description of theme properties: https://callstack.github.io/react-native-paper/docs/guides/theming/#adapting-react-navigation-theme
export const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#044BAE',       // Dark blue (brand) #044BAE 
    primaryContainer: '#A6C1E6', // Light blue (secondary brand shade) #A6C1E6
    onPrimary: '#FFFFFF',     // Text on primary buttons #FFFFFF
    onPrimaryContainer: '#000000', // text on primary container
    secondary: '#EFF6FF',     // Background light blue #EFF6FF
    onSecondary: '#044BAE',   // icons on light buttons #044BAE
    tertiary: '#49454F',        // buttons on non-blue or white surfaces #49454F
    surface: '#FFFFFF',       // Default surface // TODO - remove?
    surfaceVariant: '#49454F', // Dark gray (used for dark button backgrounds) #49454F //TODO - remove?
    onSurface: '#000000',     // Text on white surfaces #000000 // TODO - remove?
    outline: '#D0D0D0',       // For borders if needed  #D0D0D0
    background: '#FFFFFF',    // #FFFFFF
    error: '#B00020',          // #B00020. #757575.  #0D6CF0 
  },
  roundness: 8, // for 'square' buttons, cards, and headers 
  fonts: configureFonts({
    config: {
      bodyLarge: {
        fontFamily: 'Inter_400Regular',
        fontWeight: '400',
      },
      titleLarge: {
        fontFamily: 'Inter_700Bold',
        fontWeight: '700',
      },
    },
    isV3: true,
  }),
};