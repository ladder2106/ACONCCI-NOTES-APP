import { Platform } from 'react-native';

// ACONCCI Brand Colors - Modern Minimalist
export const Brand = {
  primary: '#2563EB',    // Modern Blue
  secondary: '#64748B',  // Slate Gray
};

export const Colors = {
  light: {
    text: '#1E293B',
    background: '#FFFFFF',
    tint: Brand.primary,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: Brand.primary,
    card: '#F8FAFC',
    cardForeground: '#1E293B',
    primary: Brand.primary,
    primaryForeground: '#FFFFFF',
    secondary: Brand.secondary,
    secondaryForeground: '#FFFFFF',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
    accent: '#EFF6FF',
    accentForeground: '#1E293B',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#E2E8F0',
    inputBackground: '#FFFFFF',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0A0A0A', // Neutral Black
    tint: Brand.primary,
    icon: '#A0A0A0', // Neutral Gray
    tabIconDefault: '#707070',
    tabIconSelected: Brand.primary,
    card: '#121212', // Dark Gray
    cardForeground: '#F8FAFC',
    primary: Brand.primary,
    primaryForeground: '#FFFFFF',
    secondary: Brand.secondary,
    secondaryForeground: '#FFFFFF',
    muted: '#1E1E1E', // Neutral Muted
    mutedForeground: '#A0A0A0',
    accent: '#1A1A1A', // Neutral Accent
    accentForeground: '#F8FAFC',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#2A2A2A', // Neutral Border
    inputBackground: '#121212',
  },
};

export const Fonts = {
  sans: Platform.select({ ios: 'System', default: 'sans-serif' }),
  serif: 'serif',
  mono: 'monospace',
};
