import React, { useEffect, useMemo, useRef } from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import LottieView from "lottie-react-native";

interface AnimatedLottieIconProps extends Omit<PressableProps, "style"> {
  source: any;
  size?: number;
  color?: string;
  loop?: boolean;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

function hexToNormalizedRgba(color: string) {
  const sanitized = color.replace("#", "");
  const hex =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized.padEnd(6, "0").slice(0, 6);

  const red = parseInt(hex.slice(0, 2), 16) / 255;
  const green = parseInt(hex.slice(2, 4), 16) / 255;
  const blue = parseInt(hex.slice(4, 6), 16) / 255;

  return [red, green, blue, 1];
}

function tintAnimationColors<T>(source: T, color: string): T {
  const replacement = hexToNormalizedRgba(color);

  const walk = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map(walk);
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    const next: Record<string, any> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (
        (key === "c" || key === "fc" || key === "sc") &&
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        Array.isArray((entry as any).k) &&
        ((entry as any).k.length === 3 || (entry as any).k.length === 4)
      ) {
        next[key] = { ...(entry as object), k: replacement };
      } else {
        next[key] = walk(entry);
      }
    }

    return next;
  };

  return walk(source);
}

export function AnimatedLottieIcon({
  source,
  size = 22,
  color = "#1E293B",
  loop = false,
  active = false,
  onPress,
  style,
  ...pressableProps
}: AnimatedLottieIconProps) {
  const animationRef = useRef<LottieView>(null);
  const tintedSource = useMemo(() => tintAnimationColors(source, color), [color, source]);

  const play = () => {
    animationRef.current?.reset();
    animationRef.current?.play();
  };

  useEffect(() => {
    if (active) {
      play();
    }
  }, [active]);

  const icon = (
    <View style={{ width: size, height: size }}>
      <LottieView
        autoPlay={false}
        loop={loop}
        ref={animationRef}
        source={tintedSource}
        style={{ width: size, height: size }}
      />
    </View>
  );

  if (!onPress) {
    return <View style={[styles.pressable, style]}>{icon}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={(event) => {
        play();
        onPress(event);
      }}
      style={[styles.pressable, style]}
      {...pressableProps}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: "center",
    justifyContent: "center",
  },
});
