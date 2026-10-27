import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "@/constants/theme";

export function ProgressBar({ stage }) {
  const progressPct = stage === 0 ? 0 : ((stage - 1) / 5) * 100;

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
          Stage {Math.min(stage, 5)} of 5
        </Text>
        <Text
          style={{
            color: COLORS.secondary,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {Math.round(progressPct)}%
        </Text>
      </View>
      <View
        style={{
          height: 4,
          backgroundColor: COLORS.border,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 4,
            backgroundColor: COLORS.secondary,
            borderRadius: 2,
            width: `${progressPct}%`,
          }}
        />
      </View>
    </View>
  );
}
