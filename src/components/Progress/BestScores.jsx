import React from "react";
import { View, Text } from "react-native";
import { COLORS, GAMES } from "@/constants/theme";
import { GAME_EMOJIS } from "@/constants/progressConfig";

export function BestScores({ bestScores, scores }) {
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
          marginBottom: 16,
        }}
      >
        🏆 Best Scores
      </Text>
      {GAMES.map((game, idx) => {
        const best = bestScores[game.id];
        const played = (scores[game.id] || []).length;
        const hasScore = best !== null && best !== undefined;
        return (
          <View
            key={game.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: idx < GAMES.length - 1 ? 1 : 0,
              borderBottomColor: COLORS.border,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: game.color + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
                borderWidth: 1,
                borderColor: game.color + "30",
              }}
            >
              <Text style={{ fontSize: 16 }}>
                {GAME_EMOJIS[game.id] || "🎮"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {game.name}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  marginTop: 1,
                }}
              >
                {played > 0
                  ? `${played} game${played !== 1 ? "s" : ""} played`
                  : "Not played yet"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  color: hasScore ? COLORS.secondary : COLORS.border,
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                {hasScore
                  ? game.id === "reaction-test"
                    ? `${best}ms`
                    : best
                  : "—"}
              </Text>
              {hasScore && (
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 10,
                    marginTop: 1,
                  }}
                >
                  Best
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
