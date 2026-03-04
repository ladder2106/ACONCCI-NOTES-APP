import { Dimensions, Platform } from 'react-native';

// Get device dimensions
const { width, height } = Dimensions.get('window');

// Breakpoint definitions for responsive design
export const Breakpoints = {
  small: 375,    // iPhone SE, small phones
  medium: 414,   // iPhone 12, medium phones
  large: 768,     // Tablets
  desktop: 1024,  // Desktop
};

// Device type detection
export const Device = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',
  isTablet: width >= Breakpoints.large,
  isPhone: width < Breakpoints.large,
  isSmallPhone: width <= Breakpoints.small,
};

// Screen dimensions
export const Screen = {
  width,
  height,
  aspectRatio: width / height,
};

// Responsive utility functions
export const Responsive = {
  // Returns true if screen width is <= breakpoint
  isMaxWidth: (breakpoint: number) => width <= breakpoint,
  
  // Returns true if screen width is >= breakpoint  
  isMinWidth: (breakpoint: number) => width >= breakpoint,
  
  // Returns true if screen width is between min and max
  isBetween: (min: number, max: number) => width >= min && width <= max,
  
  // Get responsive value based on screen size
  value: <T>(values: {
    small?: T;
    medium?: T;
    large?: T;
    desktop?: T;
  }): T => {
    if (width <= Breakpoints.small && values.small !== undefined) return values.small;
    if (width <= Breakpoints.medium && values.medium !== undefined) return values.medium;
    if (width <= Breakpoints.large && values.large !== undefined) return values.large;
    return values.desktop || values.large || values.medium || values.small!;
  },
};

// Touch-friendly sizing
export const Touch = {
  // Minimum touch target size (44pt Apple recommendation)
  minTouchSize: 44,
  
  // Button sizing for different screen sizes
  buttonHeight: Responsive.value({
    small: 44,
    medium: 48,
    large: 52,
  }),
  
  buttonPadding: Responsive.value({
    small: 12,
    medium: 16,
    large: 20,
  }),
  
  // Icon sizing
  iconSize: Responsive.value({
    small: 18,
    medium: 20,
    large: 24,
  }),
};

// Typography scaling
export const Typography = {
  // Responsive font sizes
  fontSize: Responsive.value({
    small: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
    },
    medium: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 19,
      '2xl': 22,
      '3xl': 26,
    },
    large: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
    },
  }),
  
  // Line heights for readability
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Spacing that scales with screen size
export const Spacing = {
  // Base spacing unit (4pt on small, 6pt on larger screens)
  base: Responsive.value({
    small: 4,
    medium: 6,
    large: 8,
  }),
  
  // Common spacing values
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  
  // Responsive spacing
  responsive: (multiplier: number): number => Math.round(Spacing.base * multiplier),
};

// Animation durations optimized for mobile
export const Animation = {
  // Faster animations on mobile for better perceived performance
  duration: Responsive.value({
    small: 200,
    medium: 250,
    large: 300,
  }),
  
  // Spring configurations
  spring: {
    damping: Responsive.value({
      small: 20,
      medium: 15,
      large: 12,
    }),
    stiffness: Responsive.value({
      small: 500,
      medium: 400,
      large: 300,
    }),
  },
};

// Platform-specific optimizations
export const PlatformOpt = {
  // Safe area insets handling
  needsSafeArea: Device.isIOS || (Device.isAndroid && (Platform.Version as number) >= 28),
  
  // Status bar height
  statusBarHeight: Device.isIOS ? 44 : 24,
  
  // Bottom navigation height
  tabBarHeight: Device.isIOS ? 83 : 56,
  
  // Keyboard behavior
  keyboardBehavior: Device.isIOS ? 'padding' as const : 'height' as const,
};
