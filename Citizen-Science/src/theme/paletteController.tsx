import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { useColorScheme } from 'react-native';
import { palettes, ThemeName, AppTheme } from './palettes'; 

type ThemeContextValue = {
  theme: AppTheme;
  preference: ThemeName;      
  switchTheme: () => void;    
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const PaletteProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme(); 
  const initial = (systemScheme === 'dark' ? 'dark' : 'light') as ThemeName;

  const [themeName, setThemeName] = useState<ThemeName>(initial);

  const theme = useMemo(() => palettes[themeName], [themeName]);

  const switchTheme = useCallback(() => {
    setThemeName(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);


  const value = useMemo(
    () => ({ theme, preference: themeName, switchTheme }),
    [theme, themeName, switchTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function usePalette() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('usePalette must be used inside PaletteProvider');
  return ctx;
}
