import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Lock, Zap } from "lucide-react-native";
import { COLORS, LEVELS } from "@/constants/theme";

export function RoadmapSection({ levelInfo, xp }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
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
        <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}>
          🗺️ Level Roadmap
        </Text>
        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 12,
            marginTop: 4,
          }}
        >
          You are at Level {levelInfo.currentLevel.level} —{" "}
          {levelInfo.currentLevel.title}
        </Text>
      </View>

      {LEVELS.map((lvl, idx) => {
        const isReached = xp >= lvl.xpRequired;
        const isCurrent = levelInfo.currentLevel.level === lvl.level;
        return (
          <View
            key={lvl.level}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isCurrent
                ? COLORS.primary + "10"
                : "transparent",
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 4,
              borderWidth: isCurrent ? 1.5 : 0,
              borderColor: isCurrent ? COLORS.primary + "40" : "transparent",
              marginBottom: 6,
            }}
          >
            {/* Line connector */}
            <View style={{ alignItems: "center", marginRight: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isCurrent
                    ? COLORS.primary
                    : isReached
                      ? COLORS.success + "25"
                      : COLORS.border + "40",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: isCurrent ? 2 : 1,
                  borderColor: isCurrent
                    ? COLORS.primary
                    : isReached
                      ? COLORS.success + "60"
                      : COLORS.border,
                }}
              >
                {isCurrent ? (
                  <Zap color="#fff" size={15} />
                ) : isReached ? (
                  <Text
                    style={{
                      color: COLORS.success,
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    ✓
                  </Text>
                ) : (
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {lvl.level}
                  </Text>
                )}
              </View>
              {idx < LEVELS.length - 1 && (
                <View
                  style={{
                    width: 2,
                    height: 8,
                    backgroundColor: isReached
                      ? COLORS.success + "40"
                      : COLORS.border,
                    marginTop: 2,
                  }}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    color: isCurrent
                      ? COLORS.primary
                      : isReached
                        ? COLORS.text
                        : COLORS.textSecondary,
                    fontSize: 14,
                    fontWeight: isCurrent ? "800" : isReached ? "600" : "400",
                  }}
                >
                  {lvl.title}
                </Text>
                {isCurrent && (
                  <View
                    style={{
                      backgroundColor: COLORS.primary + "25",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.primary,
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    >
                      YOU
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  marginTop: 1,
                }}
              >
                {lvl.xpRequired.toLocaleString()} XP
              </Text>
            </View>

            {!isReached && !isCurrent && (
              <Lock color={COLORS.border} size={13} />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
