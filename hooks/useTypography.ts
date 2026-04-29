import { Platform } from 'react-native';

export const typography = {
  // Typography scale using default system font
  h1: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.25,
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.25,
    lineHeight: 26,
  },
  h4: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
} as const;

export function useTypography() {
  // System fonts are always available, so we don't need to load anything
  return {
    fontsLoaded: true,
    typography,
  };
}
