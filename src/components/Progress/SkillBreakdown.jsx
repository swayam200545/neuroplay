import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "@/constants/theme";
import { SKILL_CONFIG } from "@/constants/progressConfig";
import { AnimatedSkillBar } from "./AnimatedSkillBar";

export function SkillBreakdown({ getDisplayValue }) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 14,
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text
        style={{
          color: COLORS.text,
          fontSize: 16,
          fontWeight: "700",
          marginBottom: 20,
        }}
      >
        🧠 Skill Breakdown
      </Text>
      {SKILL_CONFIG.map((cfg, i) => (
        <AnimatedSkillBar
          key={cfg.key}
          label={cfg.label}
          value={getDisplayValue(cfg)}
          max={cfg.max}
          color={cfg.color}
          icon={cfg.icon}
          delay={i * 80}
        />
      ))}
    </View>
  );
}
