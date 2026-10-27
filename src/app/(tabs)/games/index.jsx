import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Grid3x3,
  Zap,
  Target,
  Layers,
  Hash,
  Puzzle,
  Calculator,
  Palette,
  BookOpen,
  TrendingUp,
  ChevronRight,
  Star,
  Lock,
  X,
  SplitSquareHorizontal,
  BrainCircuit,
  LayoutGrid,
  Sigma,
  Gauge,
  Crown,
  Infinity,
  Trophy,
  Hexagon,
} from "lucide-react-native";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const ICON_MAP = {
  Grid3x3,
  Zap,
  Target,
  Layers,
  Hash,
  Puzzle,
  Calculator,
  Palette,
  BookOpen,
  TrendingUp,
  SplitSquareHorizontal,
  BrainCircuit,
  LayoutGrid,
  Sigma,
  Gauge,
  Crown,
  Infinity,
  Hexagon,
};

const CATEGORIES = ["All", "Memory", "Speed", "Focus", "Logic"];

const TIER_LABELS = {
  1: { label: "⚡ Starter", color: COLORS.success },
  5: { label: "🔥 Intermediate", color: COLORS.secondary },
  20: { label: "💎 Expert", color: COLORS.primary },
  35: { label: "👑 Elite", color: "#FCD34D" },
};

export default function GamesIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bestScores = useGameStore((s) => s.bestScores);
  const scores = useGameStore((s) => s.scores);
  const getUnlockedGames = useGameStore((s) => s.getUnlockedGames);
  const getLevelInfo = useGameStore((s) => s.getLevelInfo);

  const [activeCategory, setActiveCategory] = useState("All");
  const [lockedModal, setLockedModal] = useState(null);

  const games = getUnlockedGames();
  const levelInfo = getLevelInfo();
  const currentLevel = levelInfo.currentLevel.level;

  const getGamesPlayed = (gameId) => (scores[gameId] || []).length;

  const filteredGames =
    activeCategory === "All"
      ? games
      : games.filter((g) => g.category === activeCategory);

  const handleGamePress = (game) => {
    if (!game.isUnlocked) {
      setLockedModal(game);
      return;
    }
    router.push(`/(tabs)/games/${game.id}`);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}
      >
        <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "700" }}>
          Games
        </Text>
        <Text
          style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4 }}
        >
          Choose a game to train your brain
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
      >
        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20, flexGrow: 0 }}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.7}
              style={{
                backgroundColor:
                  cat === activeCategory ? COLORS.primary : COLORS.card,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: cat === activeCategory ? "#fff" : COLORS.textSecondary,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Game Cards */}
        {(() => {
          let lastTier = null;
          return filteredGames.map((game) => {
            const IconComponent = ICON_MAP[game.icon] || Zap;
            const played = getGamesPlayed(game.id);
            const best = bestScores[game.id];
            const locked = !game.isUnlocked;
            const levelsAway = game.unlockLevel - currentLevel;

            // Find which tier bracket this game belongs to
            const tierKeys = Object.keys(TIER_LABELS)
              .map(Number)
              .sort((a, b) => a - b);
            const tierKey = tierKeys.reduce(
              (acc, k) => (game.unlockLevel >= k ? k : acc),
              tierKeys[0],
            );
            const showTierHeader =
              activeCategory === "All" && tierKey !== lastTier;
            if (showTierHeader) lastTier = tierKey;
            const tier = TIER_LABELS[tierKey];

            return (
              <React.Fragment key={game.id}>
                {showTierHeader && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                      marginTop: lastTier === tierKey ? 0 : 4,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: tier.color + "40",
                      }}
                    />
                    <View
                      style={{
                        backgroundColor: tier.color + "18",
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 20,
                        marginHorizontal: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: tier.color,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {tier.label}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: tier.color + "40",
                      }}
                    />
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => handleGamePress(game)}
                  activeOpacity={0.75}
                  style={{
                    backgroundColor: COLORS.card,
                    borderRadius: 16,
                    padding: 18,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    borderLeftWidth: 3,
                    borderLeftColor: locked ? COLORS.border : game.color,
                    opacity: locked ? 0.7 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: locked
                        ? COLORS.border + "40"
                        : game.color + "18",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {locked ? (
                      <Lock color={COLORS.textSecondary} size={22} />
                    ) : (
                      <IconComponent color={game.color} size={26} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: locked ? COLORS.textSecondary : COLORS.text,
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        {game.name}
                      </Text>
                      {game.isNew && !locked && (
                        <View
                          style={{
                            backgroundColor: COLORS.highlight + "25",
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: COLORS.highlight,
                              fontSize: 10,
                              fontWeight: "700",
                            }}
                          >
                            NEW
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        color: COLORS.textSecondary,
                        fontSize: 12,
                        marginTop: 3,
                      }}
                    >
                      {game.description}
                    </Text>
                    {locked ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                          gap: 6,
                        }}
                      >
                        <Lock color={COLORS.primary} size={11} />
                        <Text
                          style={{
                            color: COLORS.primary,
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          Level {game.unlockLevel} — {levelsAway} level
                          {levelsAway !== 1 ? "s" : ""} away
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Star
                            color={COLORS.highlight}
                            size={12}
                            fill={COLORS.highlight}
                          />
                          <Text
                            style={{
                              color: COLORS.textSecondary,
                              fontSize: 11,
                            }}
                          >
                            +{game.xpBase} XP
                          </Text>
                        </View>
                        {played > 0 && (
                          <Text
                            style={{
                              color: COLORS.textSecondary,
                              fontSize: 11,
                            }}
                          >
                            {played}x played
                          </Text>
                        )}
                        {best !== null && (
                          <Text
                            style={{
                              color: COLORS.secondary,
                              fontSize: 11,
                              fontWeight: "600",
                            }}
                          >
                            Best:{" "}
                            {game.id === "reaction-test" ? `${best}ms` : best}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                  <ChevronRight
                    color={locked ? COLORS.border : COLORS.textSecondary}
                    size={20}
                  />
                </TouchableOpacity>
              </React.Fragment>
            );
          });
        })()}
      </ScrollView>

      {/* Locked Game Modal */}
      <Modal
        visible={!!lockedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedModal(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 24,
              padding: 32,
              alignItems: "center",
              width: "100%",
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <TouchableOpacity
              onPress={() => setLockedModal(null)}
              style={{ position: "absolute", top: 16, right: 16 }}
            >
              <X color={COLORS.textSecondary} size={22} />
            </TouchableOpacity>

            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: COLORS.primary + "18",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Lock color={COLORS.primary} size={32} />
            </View>

            <Text
              style={{
                color: COLORS.text,
                fontSize: 22,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {lockedModal?.name}
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                textAlign: "center",
                marginTop: 8,
                lineHeight: 20,
              }}
            >
              {lockedModal?.description}
            </Text>

            <View
              style={{
                backgroundColor: COLORS.primary + "15",
                borderRadius: 16,
                padding: 20,
                marginTop: 20,
                width: "100%",
                alignItems: "center",
                borderWidth: 1,
                borderColor: COLORS.primary + "30",
              }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                Required Level
              </Text>
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 36,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {lockedModal?.unlockLevel}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                You are Level {currentLevel} —{" "}
                {lockedModal ? lockedModal.unlockLevel - currentLevel : 0} more
                level
                {lockedModal && lockedModal.unlockLevel - currentLevel !== 1
                  ? "s"
                  : ""}{" "}
                to go!
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setLockedModal(null)}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 40,
                marginTop: 20,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                Keep Training 💪
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
