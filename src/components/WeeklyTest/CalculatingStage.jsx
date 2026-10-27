import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { COLORS } from "@/constants/theme";

export function CalculatingStage() {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <Animated.Text style={{ fontSize: 60, transform: [{ rotate: spin }] }}>
        🧠
      </Animated.Text>
      <Text
        style={{
          color: COLORS.text,
          fontSize: 22,
          fontWeight: "800",
          marginTop: 28,
          textAlign: "center",
        }}
      >
        Analysing your brain…
      </Text>
      <Text
        style={{
          color: COLORS.textSecondary,
          fontSize: 14,
          marginTop: 10,
          textAlign: "center",
        }}
      >
        Computing your Brain Score
      </Text>
    </View>
  );
}
