import React, { useRef, useEffect } from "react";
import { Animated, Text } from "react-native";
import { COLORS } from "@/constants/theme";

export function StatCard({ label, value, color, icon, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 80,
      friction: 8,
      delay: delay || 0,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        transform: [{ scale: anim }],
      }}
    >
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ color, fontSize: 20, fontWeight: "800", marginTop: 5 }}>
        {value}
      </Text>
      <Text
        style={{
          color: COLORS.textSecondary,
          fontSize: 10,
          marginTop: 2,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
