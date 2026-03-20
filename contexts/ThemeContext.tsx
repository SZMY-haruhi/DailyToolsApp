import { Colors } from '@/constants/theme';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

type Scheme = 'light' | 'dark' | 'system';
type ResolvedScheme = 'light' | 'dark';

interface ThemeContextType {
  scheme: Scheme;
  resolvedScheme: ResolvedScheme;
  theme: typeof Colors.light;
  setScheme: (scheme: Scheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_preference';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme() ?? 'dark';
  const [scheme, setSchemeState] = useState<Scheme>('system');

  const resolvedScheme: ResolvedScheme = scheme === 'system' ? systemColorScheme : scheme;
  const theme = Colors[resolvedScheme];

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const savedScheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedScheme && ['light', 'dark', 'system'].includes(savedScheme)) {
          setSchemeState(savedScheme as Scheme);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      }
    };
    loadTheme();
  }, []);

  const setScheme = async (newScheme: Scheme) => {
    setSchemeState(newScheme);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newScheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ scheme, resolvedScheme, theme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeContext };
