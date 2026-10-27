import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "@/constants/theme";
import { SKILL_CONFIG } from "@/constants/progressConfig";

export function BrainInsight({ getDisplayValue }) {
  const entries = SKILL_CONFIG.map((c) => ({
    ...c,
    val: getDisplayValue(c),
  })).filter((c) => c.val > 0);

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
          marginBottom: 14,
        }}
      >
        🔍 Brain Insight
      </Text>
      {entries.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <Text style={{ fontSize: 36, marginBottom: 10 }}>🌱</Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 13,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Play a few games to unlock{"\n"}your personalized brain insights!
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.success + "12",
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.success + "30",
              }}
            >
              <Text style={{ fontSize: 22, marginBottom: 6 }}>💪</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                Strongest
              </Text>
              <Text
                style={{
                  color: COLORS.success,
                  fontSize: 14,
                  fontWeight: "700",
                  marginTop: 3,
                }}
              >
                {entries.reduce((a, b) => (a.val > b.val ? a : b)).label}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.highlight + "12",
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.highlight + "30",
              }}
            >
              <Text style={{ fontSize: 22, marginBottom: 6 }}>🎯</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                To Improve
              </Text>
              <Text
                style={{
                  color: COLORS.highlight,
                  fontSize: 14,
                  fontWeight: "700",
                  marginTop: 3,
                }}
              >
                {entries.reduce((a, b) => (a.val < b.val ? a : b)).label}
              </Text>
            </View>
          </View>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 12,
              lineHeight: 18,
              marginTop: 14,
            }}
          >
            You're excelling at{" "}
            <Text style={{ color: COLORS.success, fontWeight: "600" }}>
              {entries.reduce((a, b) => (a.val > b.val ? a : b)).label}
            </Text>
            . Focus more on{" "}
            <Text style={{ color: COLORS.highlight, fontWeight: "600" }}>
              {entries.reduce((a, b) => (a.val < b.val ? a : b)).label}
            </Text>{" "}
            to become a more balanced cognitive athlete.
          </Text>
        </>
      )}
    </View>
  );
}
