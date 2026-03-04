export type ThemeName = 'light' | 'dark';

export type Palette = {
  main: string;
  light: string;
  background: string;
  text: string;
  textLight: string;
  accent: string;
};

// name and the colors
export type AppTheme = {
  name: ThemeName;
  main: string;
  light: string;
  background: string;
  text: string;
  textLight: string;
  accent: string;
};

//map consiting of appTheme object types
export const palettes: Record<ThemeName, AppTheme> = {
  light: {
    name: 'light',
      main: '#0088ca',
      light: '#2e6db4ff',
      background: '#FFFFFF',
      text: '#000000ff',
      textLight: '#3e4550ff',
      accent: '#00ff80ff',
  },
  dark: {
    name: 'dark',
      main: 'rgba(212, 199, 75, 1)',
      light: '#2e6db4ff',
      background: '#FFFFFF',
      text: '#000000ff',
      textLight: '#3e4550ff',
      accent: '#00ff80ff',
  },
};