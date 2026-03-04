import { Platform } from 'react-native';

// ACONCCI Brand Colors
export const Brand = {
  primary: '#3EACC6',    // Cyan
  secondary: '#ED9097',  // Coral
};

export const Colors = {
  light: {
    text: '#1a1a1a',
    background: '#fafafa',
    tint: Brand.primary,
    icon: '#6b6b6b',
    tabIconDefault: '#6b6b6b',
    tabIconSelected: Brand.primary,
    card: '#ffffff',
    cardForeground: '#1a1a1a',
    primary: Brand.primary,
    primaryForeground: '#ffffff',
    secondary: Brand.secondary,
    secondaryForeground: '#ffffff',
    muted: '#f5f5f5',
    mutedForeground: '#6b6b6b',
    accent: '#f0f9fb',
    accentForeground: '#1a1a1a',
    destructive: '#d4183d',
    destructiveForeground: '#ffffff',
    border: '#e5e5e5',
    inputBackground: '#ffffff',
  },
  dark: {
    text: '#fafafa',
    background: '#1a1a1a',
    tint: Brand.primary,
    icon: '#a1a1a1',
    tabIconDefault: '#a1a1a1',
    tabIconSelected: Brand.primary,
    card: '#1a1a1a',
    cardForeground: '#fafafa',
    primary: Brand.primary,
    primaryForeground: '#ffffff',
    secondary: Brand.secondary,
    secondaryForeground: '#ffffff',
    muted: '#2a2a2a',
    mutedForeground: '#a1a1a1',
    accent: '#2a2a2a',
    accentForeground: '#fafafa',
    destructive: '#d4183d',
    destructiveForeground: '#ffffff',
    border: '#333333',
    inputBackground: '#2a2a2a',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
