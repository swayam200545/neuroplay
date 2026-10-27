import React from "react";
import { View, Text } from "react-native";
import { Lock } from "lucide-react-native";
import { COLORS } from "@/constants/theme";

export function AchievementRow({ achievement, isUnlocked }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: isUnlocked
            ? COLORS.primary + "20"
            : COLORS.border + "30",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          borderWidth: 1.5,
          borderColor: isUnlocked ? COLORS.primary + "50" : COLORS.border,
        }}
      >
        <Text style={{ fontSize: 20, opacity: isUnlocked ? 1 : 0.3 }}>
          {achievement.icon}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: isUnlocked ? COLORS.text : COLORS.textSecondary,
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {achievement.name}
        </Text>
        <Text
          style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 1 }}
        >
          {achievement.description}
        </Text>
      </View>
      {isUnlocked ? (
        <View
          style={{
            backgroundColor: COLORS.success + "20",
            paddingHorizontal: 9,
            paddingVertical: 5,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: COLORS.success, fontSize: 13 }}>✓</Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: COLORS.card,
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderRadius: 8,
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Lock color={COLORS.textSecondary} size={10} />
          <Text
            style={{ color: COLORS.textSecondary, fontSize: 9, marginTop: 1 }}
          >
            +{achievement.xpReward}
          </Text>
        </View>
      )}
    </View>
  );
}
