import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Home, TrendingUp, TrendingDown, Minus } from "lucide-react-native";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const CATEGORIES = [
  { key: "memory", label: "Memory", icon: "🧠", color: COLORS.primary },
  { key: "speed", label: "Speed", icon: "⚡", color: COLORS.secondary },
  { key: "focus", label: "Focus", icon: "🎯", color: "#FF6B9D" },
  { key: "logic", label: "Logic", icon: "➕", color: "#FF8C42" },
  { key: "recall", label: "Recall", icon: "📝", color: COLORS.success },
];

function getMotivation(score, diff) {
  if (score >= 90)
    return {
      emoji: "🏆",
      msg: "Absolutely phenomenal! Your brain is operating at elite level.",
    };
  if (score >= 75)
    return {
      emoji: "🚀",
      msg: "Outstanding performance! You're a true cognitive athlete.",
    };
  if (score >= 60)
    return {
      emoji: "💪",
      msg: "Solid work! Keep pushing and you'll reach the top.",
    };
  if (score >= 45)
    return {
      emoji: "🌱",
      msg: "Good start! Consistency will unlock your full potential.",
    };
  return {
    emoji: "🔥",
    msg: "Every test makes you sharper. You've got this — keep coming back!",
  };
}

function getStrengthsWeaknesses(current) {
  const entries = CATEGORIES.map((c) => ({
    ...c,
    val: current[c.key] || 0,
  })).filter((c) => c.val > 0);
  if (entries.length === 0) return { strengths: [], weaknesses: [] };
  const sorted = [...entries].sort((a, b) => b.val - a.val);
  const strengths = sorted.slice(0, 2);
  const weaknesses = sorted.slice(-2).reverse();
  return { strengths, weaknesses };
}

function ScoreRing({ score, size = 120 }) {
  const animVal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animVal, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  const color =
    score >= 75
      ? COLORS.success
      : score >= 50
        ? COLORS.secondary
        : score >= 30
          ? COLORS.highlight
          : COLORS.error;

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + "18",
          borderWidth: 6,
          borderColor: color + "60",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color, fontSize: 34, fontWeight: "900" }}>{score}</Text>
        <Text
          style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 1 }}
        >
          / 100
        </Text>
      </View>
    </View>
  );
}

function CategoryBar({ label, icon, color, value, prevValue, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: value / 100,
      duration: 900,
      delay: index * 100,
      useNativeDriver: false,
    }).start();
  }, [value]);
  const barWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const diff = prevValue !== undefined ? value - prevValue : null;
  const hasPrev = diff !== null;

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 7,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Text style={{ fontSize: 15 }}>{icon}</Text>
          <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: "600" }}>
            {label}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {hasPrev && diff !== 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                backgroundColor:
                  diff > 0 ? COLORS.success + "20" : COLORS.error + "20",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              {diff > 0 ? (
                <TrendingUp color={COLORS.success} size={10} />
              ) : (
                <TrendingDown color={COLORS.error} size={10} />
              )}
              <Text
                style={{
                  color: diff > 0 ? COLORS.success : COLORS.error,
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {diff > 0 ? "+" : ""}
                {diff}
              </Text>
            </View>
          )}
          <Text style={{ color, fontSize: 13, fontWeight: "700" }}>
            {value}%
          </Text>
        </View>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: COLORS.border,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: 8,
            borderRadius: 4,
            width: barWidth,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

export default function WeeklyResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const weeklyTestHistory = useGameStore((s) => s.weeklyTestHistory);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (weeklyTestHistory.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
          No test data found.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={{ marginTop: 20 }}
        >
          <Text
            style={{ color: COLORS.primary, fontSize: 14, fontWeight: "600" }}
          >
            Go Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = weeklyTestHistory[weeklyTestHistory.length - 1];
  const prev =
    weeklyTestHistory.length >= 2
      ? weeklyTestHistory[weeklyTestHistory.length - 2]
      : null;
  const overallDiff = prev ? current.overallScore - prev.overallScore : null;
  const motivation = getMotivation(current.overallScore, overallDiff);
  const { strengths, weaknesses } = getStrengthsWeaknesses(current);

  const bestTest = weeklyTestHistory.reduce(
    (best, t) => (t.overallScore > best.overallScore ? t : best),
    weeklyTestHistory[0],
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: insets.top,
      }}
    >
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ opacity: fadeAnim }}
      >
        {/* Header */}
        <Animated.View
          style={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 10,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text
            style={{
              color: COLORS.secondary,
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 2,
            }}
          >
            WEEKLY BRAIN TEST
          </Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 28,
              fontWeight: "800",
              marginTop: 6,
              letterSpacing: -0.5,
            }}
          >
            Results 🎉
          </Text>
          <Text
            style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 3 }}
          >
            {current.date}
          </Text>
        </Animated.View>

        {/* Score hero */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 12,
            backgroundColor: COLORS.card,
            borderRadius: 24,
            padding: 28,
            borderWidth: 1,
            borderColor: COLORS.secondary + "30",
            alignItems: "center",
          }}
        >
          <ScoreRing score={current.overallScore} size={130} />
          <Text
            style={{
              color: COLORS.text,
              fontSize: 20,
              fontWeight: "800",
              marginTop: 18,
            }}
          >
            Brain Score
          </Text>

          {overallDiff !== null && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor:
                  overallDiff >= 0
                    ? COLORS.success + "15"
                    : COLORS.error + "15",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                marginTop: 10,
                borderWidth: 1,
                borderColor:
                  overallDiff >= 0
                    ? COLORS.success + "35"
                    : COLORS.error + "35",
              }}
            >
              {overallDiff > 0 ? (
                <TrendingUp color={COLORS.success} size={16} />
              ) : overallDiff < 0 ? (
                <TrendingDown color={COLORS.error} size={16} />
              ) : (
                <Minus color={COLORS.textSecondary} size={16} />
              )}
              <Text
                style={{
                  color:
                    overallDiff > 0
                      ? COLORS.success
                      : overallDiff < 0
                        ? COLORS.error
                        : COLORS.textSecondary,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {overallDiff > 0 ? "+" : ""}
                {overallDiff} vs last week
              </Text>
            </View>
          )}

          <View
            style={{
              marginTop: 18,
              paddingTop: 18,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 32 }}>{motivation.emoji}</Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                textAlign: "center",
                lineHeight: 20,
                marginTop: 8,
              }}
            >
              {motivation.msg}
            </Text>
          </View>
        </View>

        {/* Category breakdown */}
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
            📊 Category Breakdown
          </Text>
          {CATEGORIES.map((cat, i) => (
            <CategoryBar
              key={cat.key}
              label={cat.label}
              icon={cat.icon}
              color={cat.color}
              value={current[cat.key] || 0}
              prevValue={prev ? prev[cat.key] : undefined}
              index={i}
            />
          ))}
        </View>

        {/* Strengths & Weaknesses */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
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
              🔍 Strengths & Weaknesses
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: COLORS.success + "10",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.success + "30",
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 6 }}>💪</Text>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 11,
                    marginBottom: 6,
                  }}
                >
                  Strongest
                </Text>
                {strengths.map((s) => (
                  <Text
                    key={s.key}
                    style={{
                      color: COLORS.success,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {s.icon} {s.label} ({s.val}%)
                  </Text>
                ))}
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: COLORS.highlight + "10",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.highlight + "30",
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 6 }}>🎯</Text>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 11,
                    marginBottom: 6,
                  }}
                >
                  To Improve
                </Text>
                {weaknesses.map((w) => (
                  <Text
                    key={w.key}
                    style={{
                      color: COLORS.highlight,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {w.icon} {w.label} ({w.val}%)
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Comparison vs last week */}
        {prev && (
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
              📅 vs Last Week
            </Text>
            {CATEGORIES.map((cat) => {
              const curr = current[cat.key] || 0;
              const p = prev[cat.key] || 0;
              const diff = curr - p;
              return (
                <View
                  key={cat.key}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 10 }}>
                    {cat.icon}
                  </Text>
                  <Text style={{ color: COLORS.text, fontSize: 13, flex: 1 }}>
                    {cat.label}
                  </Text>
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: 12,
                      marginRight: 12,
                    }}
                  >
                    {p}% → {curr}%
                  </Text>
                  {diff === 0 ? (
                    <Minus color={COLORS.textSecondary} size={14} />
                  ) : diff > 0 ? (
                    <TrendingUp color={COLORS.success} size={14} />
                  ) : (
                    <TrendingDown color={COLORS.error} size={14} />
                  )}
                  <Text
                    style={{
                      color:
                        diff > 0
                          ? COLORS.success
                          : diff < 0
                            ? COLORS.error
                            : COLORS.textSecondary,
                      fontSize: 12,
                      fontWeight: "700",
                      marginLeft: 4,
                      width: 32,
                    }}
                  >
                    {diff > 0 ? `+${diff}` : diff === 0 ? "±0" : diff}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* All-time best */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 14,
            backgroundColor: COLORS.highlight + "10",
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.highlight + "30",
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 32 }}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              All-Time Best
            </Text>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 22,
                fontWeight: "900",
                marginTop: 2,
              }}
            >
              {bestTest.overallScore}/100
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 11,
                marginTop: 1,
              }}
            >
              {bestTest.date}
            </Text>
          </View>
          <Text
            style={{
              color: COLORS.highlight,
              fontSize: 12,
              fontWeight: "700",
              backgroundColor: COLORS.highlight + "20",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}
          >
            {weeklyTestHistory.length} test
            {weeklyTestHistory.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Home button */}
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: COLORS.primary,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Home color="#fff" size={18} />
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}
