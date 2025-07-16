import { MD3DarkTheme as PaperDarkTheme } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

export const theme = {
  ...NavigationDarkTheme,
  ...PaperDarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    ...NavigationDarkTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
  },
  fonts: PaperDarkTheme.fonts,
};
