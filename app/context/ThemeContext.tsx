import React, { createContext, useContext, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  accent: string;
  success: string;
  danger: string;
  warning: string;
  inputBg: string;
  inputBorder: string;
  tabBar: string;
  tabBarBorder: string;
  modalBg: string;
  overlay: string;
  chatBubbleSent: string;
  chatBubbleReceived: string;
  divider: string;
  statusBar: 'light-content' | 'dark-content';
}

const lightColors: ThemeColors = {
  background: '#FAF8F0',
  card: '#FFFFFF',
  cardBorder: '#E8E0C8',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  primary: '#C5A000',
  primaryDark: '#A08200',
  accent: '#C5A000',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  inputBg: '#FFF9E6',
  inputBorder: '#E8D88C',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8E0C8',
  modalBg: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',
  chatBubbleSent: '#C5A000',
  chatBubbleReceived: '#F0EBD8',
  divider: '#E8E0C8',
  statusBar: 'dark-content',
};

const darkColors: ThemeColors = {
  background: '#0A0A0A',
  card: '#1A1A1A',
  cardBorder: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#666666',
  primary: '#C5A000',
  primaryDark: '#A08200',
  accent: '#C5A000',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  inputBg: '#1A1A1A',
  inputBorder: '#3A3A2A',
  tabBar: '#111111',
  tabBarBorder: '#222222',
  modalBg: '#1A1A1A',
  overlay: 'rgba(0,0,0,0.7)',
  chatBubbleSent: '#C5A000',
  chatBubbleReceived: '#2A2A2A',
  divider: '#2A2A2A',
  statusBar: 'light-content',
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  const toggleTheme = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
