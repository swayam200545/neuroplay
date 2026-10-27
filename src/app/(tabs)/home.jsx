import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Flame,
  Trophy,
  Zap,
  ChevronRight,
  Brain,
  Star,
  Lock,
  Grid3x3,
  Target,
  Layers,
  Hash,
  Puzzle,
  Calculator,
  Palette,
  BookOpen,
  TrendingUp,
  Sparkles,
} from "lucide-react-native";
import { COLORS, GAMES } from "../../constants/theme";
import useGameStore from "../../store/gameStore";
import ProgressRing from "../../components/ProgressRing";

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
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const totalGamesPlayed = useGameStore((s) => s.totalGamesPlayed);
  const hydrated = useGameStore((s) => s.hydrated);
  const getLevelInfo = useGameStore((s) => s.getLevelInfo);
  const getTodayProgress = useGameStore((s) => s.getTodayProgress);
  const getUnlockedGames = useGameStore((s) => s.getUnlockedGames);
  const newlyUnlockedGames = useGameStore((s) => s.newlyUnlockedGames);
  const dismissUnlockCelebration = useGameStore(
    (s) => s.dismissUnlockCelebration,
  );
  const canTakeWeeklyTest = useGameStore((s) => s.canTakeWeeklyTest);
  const lastWeeklyTestDate = useGameStore((s) => s.lastWeeklyTestDate);
  const weeklyTestHistory = useGameStore((s) => s.weeklyTestHistory);

  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (newlyUnlockedGames && newlyUnlockedGames.length > 0) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [newlyUnlockedGames]);

  if (!hydrated)
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;

  const levelInfo = getLevelInfo();
  const todayProgress = getTodayProgress();
  const levelProgress = levelInfo.nextLevel
    ? (xp - levelInfo.currentLevel.xpRequired) /
      (levelInfo.nextLevel.xpRequired - levelInfo.currentLevel.xpRequired)
    : 1;

  const allGames = getUnlockedGames();
  const quickPlayGames = allGames.filter((g) => g.isUnlocked).slice(0, 3);
  const nextLockedGame = allGames.find((g) => !g.isUnlocked);
  const unlockedGame =
    newlyUnlockedGames && newlyUnlockedGames.length > 0
      ? newlyUnlockedGames[0]
      : null;

  const xpToNext = levelInfo.nextLevel
    ? levelInfo.nextLevel.xpRequired - xp
    : 0;

  const weeklyAvailable = canTakeWeeklyTest();
  const lastTest =
    weeklyTestHistory.length > 0
      ? weeklyTestHistory[weeklyTestHistory.length - 1]
      : null;

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: insets.top,
        opacity: fadeAnim,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 4,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              {getGreeting()} 👋
            </Text>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 26,
                fontWeight: "800",
                marginTop: 2,
                letterSpacing: -0.5,
              }}
            >
              NeuroPlay
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/games")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: streak > 0 ? "#FF6B35" + "20" : COLORS.card,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: streak > 0 ? "#FF6B35" + "40" : COLORS.border,
            }}
          >
            <Flame
              color={streak > 0 ? "#FF6B35" : COLORS.textSecondary}
              size={17}
            />
            <Text
              style={{
                color: streak > 0 ? "#FF6B35" : COLORS.textSecondary,
                fontSize: 15,
                fontWeight: "700",
                marginLeft: 5,
              }}
            >
              {streak}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Level Progress Card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 18,
            backgroundColor: COLORS.card,
            borderRadius: 24,
            padding: 24,
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.primary + "25",
          }}
        >
          <ProgressRing progress={levelProgress} size={130} strokeWidth={9}>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{ color: COLORS.text, fontSize: 30, fontWeight: "800" }}
              >
                {levelInfo.currentLevel.level}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  marginTop: 1,
                }}
              >
                {levelInfo.currentLevel.title}
              </Text>
            </View>
          </ProgressRing>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 14,
              gap: 6,
            }}
          >
            <Star color={COLORS.highlight} size={13} fill={COLORS.highlight} />
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              {xp.toLocaleString()} XP
            </Text>
          </View>

          {levelInfo.nextLevel && (
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 12,
                marginTop: 3,
              }}
            >
              {xpToNext.toLocaleString()} XP to{" "}
              <Text style={{ color: COLORS.text, fontWeight: "600" }}>
                {levelInfo.nextLevel.title}
              </Text>
            </Text>
          )}

          {/* Next unlock teaser */}
          {nextLockedGame && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.primary + "12",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginTop: 16,
                gap: 8,
                borderWidth: 1,
                borderColor: COLORS.primary + "25",
                width: "100%",
              }}
            >
              <Lock color={COLORS.primary} size={13} />
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 12,
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                Reach Level {nextLockedGame.unlockLevel} to unlock{" "}
                <Text style={{ fontWeight: "800" }}>{nextLockedGame.name}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Daily Training */}
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Text
              style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}
            >
              Daily Training
            </Text>
            <Text
              style={{
                color: todayProgress.completed
                  ? COLORS.success
                  : COLORS.textSecondary,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {todayProgress.completed
                ? "✓ Done!"
                : `${todayProgress.gamesPlayed}/${todayProgress.gamesTarget} games`}
            </Text>
          </View>

          {/* Progress dots */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
            {Array.from({ length: todayProgress.gamesTarget }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    i < todayProgress.gamesPlayed
                      ? todayProgress.completed
                        ? COLORS.success
                        : COLORS.primary
                      : COLORS.border,
                }}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/games")}
            activeOpacity={0.85}
            style={{
              backgroundColor: todayProgress.completed
                ? COLORS.success
                : COLORS.primary,
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Brain color="#fff" size={19} />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              {todayProgress.gamesPlayed === 0
                ? "Start Training"
                : todayProgress.completed
                  ? "Training Complete! 🎉"
                  : "Continue Training"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Brain Test */}
        <TouchableOpacity
          onPress={() =>
            weeklyAvailable && router.push("/(tabs)/games/weekly-test")
          }
          activeOpacity={weeklyAvailable ? 0.8 : 1}
          style={{
            marginHorizontal: 20,
            marginTop: 14,
            backgroundColor: weeklyAvailable ? COLORS.card : COLORS.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: weeklyAvailable
              ? COLORS.secondary + "50"
              : COLORS.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: weeklyAvailable
                    ? COLORS.secondary + "20"
                    : COLORS.border + "30",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 22 }}>🧪</Text>
              </View>
              <View>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Weekly Brain Test
                </Text>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  {weeklyAvailable
                    ? "5 challenges · ~5 min"
                    : lastWeeklyTestDate
                      ? `Next test available in ${7 - Math.floor((new Date() - new Date(lastWeeklyTestDate)) / (1000 * 60 * 60 * 24))} days`
                      : "Loading..."}
                </Text>
              </View>
            </View>
            <View
              style={{
                backgroundColor: weeklyAvailable
                  ? COLORS.secondary
                  : COLORS.border,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: weeklyAvailable ? "#000" : COLORS.textSecondary,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {weeklyAvailable ? "START" : "LOCKED"}
              </Text>
            </View>
          </View>
          {lastTest && (
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                Last test: {lastTest.date}
              </Text>
              <Text
                style={{
                  color: COLORS.secondary,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {lastTest.overallScore}/100
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Stats Row */}
        <View
          style={{
            flexDirection: "row",
            marginHorizontal: 20,
            marginTop: 14,
            gap: 10,
          }}
        >
          {[
            {
              icon: <Trophy color={COLORS.highlight} size={20} />,
              value: totalGamesPlayed,
              label: "Games",
            },
            {
              icon: <Flame color="#FF6B35" size={20} />,
              value: `${streak}🔥`,
              label: "Streak",
            },
            {
              icon: <Zap color={COLORS.secondary} size={20} />,
              value: `Lv.${levelInfo.currentLevel.level}`,
              label: "Level",
            },
          ].map((stat, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: COLORS.card,
                borderRadius: 16,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              {stat.icon}
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 18,
                  fontWeight: "800",
                  marginTop: 7,
                }}
              >
                {stat.value}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Play */}
        <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Text
              style={{ color: COLORS.text, fontSize: 17, fontWeight: "700" }}
            >
              Quick Play
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/games")}
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                See All
              </Text>
              <ChevronRight color={COLORS.primary} size={15} />
            </TouchableOpacity>
          </View>
          {quickPlayGames.map((game) => {
            const IconComponent = ICON_MAP[game.icon] || Zap;
            return (
              <TouchableOpacity
                key={game.id}
                onPress={() => router.push(`/(tabs)/games/${game.id}`)}
                activeOpacity={0.75}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderLeftWidth: 3,
                  borderLeftColor: game.color,
                }}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    backgroundColor: game.color + "18",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconComponent color={game.color} size={22} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    {game.name}
                  </Text>
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {game.description}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: game.color + "15",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: game.color,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    +{game.xpBase} XP
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Brain Tip */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 6,
            backgroundColor: COLORS.secondary + "10",
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: COLORS.secondary + "25",
          }}
        >
          <Sparkles color={COLORS.secondary} size={20} />
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 12,
              flex: 1,
              lineHeight: 18,
            }}
          >
            <Text style={{ color: COLORS.secondary, fontWeight: "700" }}>
              Brain Tip:{" "}
            </Text>
            Consistent daily training is more effective than long occasional
            sessions. Keep your streak alive!
          </Text>
        </View>
      </ScrollView>

      {/* 🎉 Game Unlock Celebration Modal */}
      <Modal
        visible={!!unlockedGame}
        transparent
        animationType="none"
        onRequestClose={dismissUnlockCelebration}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.88)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 28,
              padding: 36,
              alignItems: "center",
              width: "100%",
              borderWidth: 1,
              borderColor: COLORS.primary + "50",
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }}
          >
            <Text style={{ fontSize: 60 }}>🔓</Text>
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 14,
                fontWeight: "700",
                marginTop: 12,
                letterSpacing: 2,
              }}
            >
              NEW GAME UNLOCKED!
            </Text>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 24,
                fontWeight: "800",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {unlockedGame?.name}
            </Text>
            <View
              style={{
                backgroundColor: unlockedGame
                  ? unlockedGame.color + "18"
                  : COLORS.primary + "18",
                borderRadius: 16,
                padding: 18,
                marginTop: 16,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {unlockedGame?.description}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 10,
                  gap: 6,
                }}
              >
                <Star
                  color={COLORS.highlight}
                  size={13}
                  fill={COLORS.highlight}
                />
                <Text
                  style={{
                    color: COLORS.highlight,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  +{unlockedGame?.xpBase} XP per game
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginTop: 22,
                width: "100%",
              }}
            >
              <TouchableOpacity
                onPress={dismissUnlockCelebration}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.cardLight,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Later
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  dismissUnlockCelebration();
                  if (unlockedGame)
                    router.push(`/(tabs)/games/${unlockedGame.id}`);
                }}
                style={{
                  flex: 2,
                  backgroundColor: unlockedGame
                    ? unlockedGame.color
                    : COLORS.primary,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}
                >
                  Play Now! 🎮
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </Animated.View>
  );
}
