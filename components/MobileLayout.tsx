import { PlatformOpt, Spacing, Touch } from '@/utils/mobile';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface MobileLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function MobileLayout({ children, style }: MobileLayoutProps) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

// Responsive container component
export function ResponsiveContainer({ 
  children, 
  maxWidth, 
  centerContent = true 
}: { 
  children: React.ReactNode; 
  maxWidth?: number;
  centerContent?: boolean;
}) {
  const containerStyle: ViewStyle[] = [
    styles.responsiveContainer,
  ];
  
  if (maxWidth) {
    containerStyle.push({ maxWidth });
  }
  
  if (centerContent) {
    containerStyle.push(styles.centerContent);
  }

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
}

// Safe area wrapper for mobile
export function SafeAreaWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.safeArea}>
      {children}
    </View>
  );
}

// Touch-friendly button wrapper
export function TouchableWrapper({ 
  children, 
  onPress, 
  style,
  minSize = true 
}: { 
  children: React.ReactNode; 
  onPress: () => void;
  style?: ViewStyle;
  minSize?: boolean;
}) {
  return (
    <View 
      style={[
        styles.touchable,
        minSize && { minHeight: Touch.buttonHeight },
        style
      ]}
      onTouchEnd={onPress}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100%',
  },
  responsiveContainer: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.responsive(3),
  },
  centerContent: {
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    paddingTop: PlatformOpt.needsSafeArea ? PlatformOpt.statusBarHeight : 0,
  },
  touchable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
