import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
} from "react-native";
import { User, Star, Flame, Trophy, Award, Pencil } from "lucide-react-native";
import { COLORS, ACHIEVEMENTS } from "@/constants/theme";
import ProgressRing from "@/components/ProgressRing";

export function StatsSection({
  levelInfo,
  xp,
  streak,
  totalGamesPlayed,
  unlockedCount,
  userName,
  onEditName,
}) {
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const levelProgress = levelInfo.nextLevel
    ? (xp - levelInfo.currentLevel.xpRequired) /
      (levelInfo.nextLevel.xpRequired - levelInfo.currentLevel.xpRequired)
    : 1;
  const xpToNext = levelInfo.nextLevel
    ? levelInfo.nextLevel.xpRequired - xp
    : 0;

  const displayName = userName ? userName : "Player";

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Hero card */}
      <Animated.View
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 24,
          padding: 22,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: COLORS.primary + "30",
          opacity: headerAnim,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ProgressRing progress={levelProgress} size={82} strokeWidth={6}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: COLORS.primary + "25",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User color={COLORS.primary} size={26} />
            </View>
          </ProgressRing>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                {displayName}
              </Text>
              <TouchableOpacity onPress={onEditName} style={{ padding: 2 }}>
                <Pencil color={COLORS.textSecondary} size={12} />
              </TouchableOpacity>
              <View
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 7,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  Lv {levelInfo.currentLevel.level}
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {levelInfo.currentLevel.title}
            </Text>
            <View style={{ marginTop: 8 }}>
              <View
                style={{
                  height: 5,
                  backgroundColor: COLORS.border,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 5,
                    width: `${Math.round(levelProgress * 100)}%`,
                    backgroundColor: COLORS.primary,
                    borderRadius: 3,
                  }}
                />
              </View>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 10,
                  marginTop: 3,
                }}
              >
                {xp.toLocaleString()} /{" "}
                {levelInfo.nextLevel
                  ? levelInfo.nextLevel.xpRequired.toLocaleString()
                  : xp.toLocaleString()}{" "}
                XP
              </Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 18,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 14,
            gap: 0,
          }}
        >
          {[
            {
              icon: (
                <Star
                  color={COLORS.highlight}
                  size={16}
                  fill={COLORS.highlight}
                />
              ),
              value: xp.toLocaleString(),
              label: "Total XP",
            },
            {
              icon: <Flame color="#FF6B35" size={16} />,
              value: streak,
              label: "Streak",
            },
            {
              icon: <Trophy color={COLORS.secondary} size={16} />,
              value: totalGamesPlayed,
              label: "Games",
            },
            {
              icon: <Award color={COLORS.success} size={16} />,
              value: `${unlockedCount}/${ACHIEVEMENTS.length}`,
              label: "Awards",
            },
          ].map((s, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                alignItems: "center",
                borderRightWidth: i < 3 ? 1 : 0,
                borderRightColor: COLORS.border,
              }}
            >
              {s.icon}
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {s.value}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 10,
                  marginTop: 1,
                }}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Stats detail cards */}
      <View style={{ gap: 10 }}>
        {[
          {
            label: "🔥 Current Streak",
            value: `${streak} day${streak !== 1 ? "s" : ""}`,
            sub: streak >= 7 ? "On fire! 🔥" : "Keep going!",
            color: "#FF6B35",
          },
          {
            label: "⭐ Total XP Earned",
            value: xp.toLocaleString(),
            sub: `Level ${levelInfo.currentLevel.level} — ${levelInfo.currentLevel.title}`,
            color: COLORS.highlight,
          },
          {
            label: "🎮 Games Played",
            value: totalGamesPlayed,
            sub: "Every game sharpens your mind",
            color: COLORS.primary,
          },
          {
            label: "🏆 Achievements",
            value: `${unlockedCount} / ${ACHIEVEMENTS.length}`,
            sub: `${ACHIEVEMENTS.length - unlockedCount} left to unlock`,
            color: COLORS.success,
          },
        ].map((card, i) => (
          <View
            key={i}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  marginBottom: 3,
                }}
              >
                {card.label}
              </Text>
              <Text
                style={{
                  color: card.color,
                  fontSize: 22,
                  fontWeight: "800",
                }}
              >
                {card.value}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  marginTop: 3,
                }}
              >
                {card.sub}
              </Text>
            </View>
            <View
              style={{
                width: 6,
                height: 48,
                borderRadius: 3,
                backgroundColor: card.color,
                marginLeft: 12,
              }}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
