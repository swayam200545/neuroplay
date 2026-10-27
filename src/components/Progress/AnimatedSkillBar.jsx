import React, { useRef, useEffect } from "react";
import { View, Text, Animated } from "react-native";
import { COLORS } from "@/constants/theme";

export function AnimatedSkillBar({ label, value, max, color, icon, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      delay: delay || 0,
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const barWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 7,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14 }}>{icon}</Text>
          <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: "600" }}>
            {label}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: color + "22",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
          }}
        >
          <Text style={{ color, fontSize: 12, fontWeight: "700" }}>
            {Math.round(pct * 100)}%
          </Text>
        </View>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: COLORS.border,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: 8,
            borderRadius: 4,
            width: barWidth,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}
