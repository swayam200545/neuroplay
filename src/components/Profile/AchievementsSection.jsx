import React from "react";
import { View, Text, ScrollView } from "react-native";
import { COLORS, ACHIEVEMENTS } from "@/constants/theme";
import { ACHIEVEMENT_TIERS } from "@/constants/profileConfig";
import { CollapsibleTier } from "./CollapsibleTier";

export function AchievementsSection({ unlockedAchievements }) {
  const unlockedCount = unlockedAchievements.length;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Summary */}
      <View
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              color: COLORS.text,
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            🏆 All Achievements
          </Text>
          <View
            style={{
              backgroundColor: COLORS.highlight + "20",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {unlockedCount}/{ACHIEVEMENTS.length}
            </Text>
          </View>
        </View>
        <View
          style={{
            height: 6,
            backgroundColor: COLORS.border,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 6,
              width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`,
              backgroundColor: COLORS.highlight,
              borderRadius: 3,
            }}
          />
        </View>
        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 11,
            marginTop: 8,
          }}
        >
          {ACHIEVEMENTS.length - unlockedCount} left to unlock · Tap a tier to
          expand
        </Text>
      </View>

      {/* Collapsible tier groups */}
      {ACHIEVEMENT_TIERS.map((tier) => (
        <CollapsibleTier
          key={tier.label}
          tier={tier}
          unlockedAchievements={unlockedAchievements}
        />
      ))}
    </ScrollView>
  );
}
