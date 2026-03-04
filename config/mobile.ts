// Mobile optimization configuration
export const MobileConfig = {
  // Touch targets
  touchTargets: {
    minSize: 44, // Apple HIG minimum
    buttonHeight: 48,
    iconButtonSize: 44,
    cardMinHeight: 60,
  },
  
  // Responsive breakpoints
  breakpoints: {
    small: 375,   // iPhone SE
    medium: 414,  // iPhone 12/13/14
    large: 768,   // iPad mini
    xlarge: 1024, // iPad Pro
  },
  
  // Typography scales
  typography: {
    scales: {
      small: { base: 14, h1: 24, h2: 20, h3: 18 },
      medium: { base: 15, h1: 26, h2: 22, h3: 19 },
      large: { base: 16, h1: 28, h2: 24, h3: 20 },
    },
  },
  
  // Spacing scales
  spacing: {
    scales: {
      small: { xs: 2, sm: 4, md: 8, lg: 12, xl: 16 },
      medium: { xs: 3, sm: 6, md: 10, lg: 14, xl: 18 },
      large: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
    },
  },
  
  // Animation durations
  animations: {
    fast: 200,
    normal: 300,
    slow: 400,
  },
  
  // Platform-specific settings
  platform: {
    ios: {
      statusBarHeight: 44,
      tabBarHeight: 83,
      safeArea: true,
    },
    android: {
      statusBarHeight: 24,
      tabBarHeight: 56,
      safeArea: false,
    },
    web: {
      statusBarHeight: 0,
      tabBarHeight: 60,
      safeArea: false,
    },
  },
};
