import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/theme";
import {
  FILTERS,
  CHART_CONFIG,
  SKILL_CONFIG,
} from "@/constants/progressConfig";
import { buildDailyPoints } from "@/utils/progressUtils";
import useGameStore from "@/store/gameStore";
import { StatCard } from "@/components/Progress/StatCard";
import { PerformanceCharts } from "@/components/Progress/PerformanceCharts";
import { DailyXPChart } from "@/components/Progress/DailyXPChart";
import { SkillBreakdown } from "@/components/Progress/SkillBreakdown";
import { BestScores } from "@/components/Progress/BestScores";
import { BrainInsight } from "@/components/Progress/BrainInsight";

const { width } = Dimensions.get("window");

const SECTIONS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "charts", label: "Charts", icon: "📈" },
  { id: "skills", label: "Skills", icon: "🧠" },
  { id: "insight", label: "Insight", icon: "💡" },
];

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const hydrated = useGameStore((s) => s.hydrated);
  const scores = useGameStore((s) => s.scores);
  const bestScores = useGameStore((s) => s.bestScores);
  const dailyHistory = useGameStore((s) => s.dailyHistory);
  const totalGamesPlayed = useGameStore((s) => s.totalGamesPlayed);
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const getSkillScores = useGameStore((s) => s.getSkillScores);
  const weeklyTestHistory = useGameStore((s) => s.weeklyTestHistory);

  const [activeSection, setActiveSection] = useState("overview");
  const [filterIdx, setFilterIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hydrated) return;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [hydrated]);

  const switchSection = (id) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveSection(id);
  };

  const filter = FILTERS[filterIdx];

  const chartPoints = useMemo(() => {
    if (!scores) return {};
    const result = {};
    CHART_CONFIG.forEach((cfg) => {
      result[cfg.key] = buildDailyPoints(
        scores[cfg.key] || [],
        filter.days,
        cfg.normalize,
      );
    });
    return result;
  }, [scores, filterIdx]);

  if (!hydrated)
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;

  const skills = getSkillScores();
  const totalWeekXP = dailyHistory.slice(-7).reduce((a, d) => a + d.xp, 0);

  const getDisplayValue = (cfg) => {
    if (cfg.invert) {
      const raw = skills[cfg.key];
      return raw > 0 ? Math.max(0, cfg.invertMax - raw) : 0;
    }
    return skills[cfg.key] || 0;
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {/* Quick stats */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              <StatCard
                label="Games Played"
                value={totalGamesPlayed}
                color={COLORS.primary}
                icon="🎮"
                delay={0}
              />
              <StatCard
                label="Day Streak"
                value={streak}
                color="#FF6B35"
                icon="🔥"
                delay={80}
              />
              <StatCard
                label="Week XP"
                value={totalWeekXP}
                color={COLORS.highlight}
                icon="⭐"
                delay={160}
              />
            </View>

            {/* XP overview card */}
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 12,
                  marginBottom: 6,
                }}
              >
                Total XP
              </Text>
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 40,
                  fontWeight: "900",
                }}
              >
                {xp.toLocaleString()}
              </Text>
              <View style={{ flexDirection: "row", marginTop: 16, gap: 16 }}>
                {[
                  { label: "Best Streak", value: `${streak}🔥` },
                  { label: "Total Games", value: totalGamesPlayed },
                  { label: "This Week", value: `+${totalWeekXP} XP` },
                ].map((item, i) => (
                  <View key={i} style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                      {item.label}
                    </Text>
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: 15,
                        fontWeight: "700",
                        marginTop: 2,
                      }}
                    >
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Daily XP mini chart */}
            <DailyXPChart dailyHistory={dailyHistory} filterIdx={filterIdx} />
          </ScrollView>
        );

      case "charts":
        return (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            <PerformanceCharts
              chartPoints={chartPoints}
              filterIdx={filterIdx}
              setFilterIdx={setFilterIdx}
            />
            <BestScores bestScores={bestScores} scores={scores} />
          </ScrollView>
        );

      case "skills":
        return (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            <SkillBreakdown getDisplayValue={getDisplayValue} />
          </ScrollView>
        );

      case "insight":
        return (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            <BrainInsight getDisplayValue={getDisplayValue} />
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}
      >
        <Text
          style={{
            color: COLORS.text,
            fontSize: 28,
            fontWeight: "800",
            letterSpacing: -0.5,
          }}
        >
          Progress
        </Text>
        <Text
          style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}
        >
          Your brain improvement over time
        </Text>
      </View>

      {/* Section nav pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: 4 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 8,
          paddingRight: 28,
        }}
      >
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <TouchableOpacity
              key={sec.id}
              onPress={() => switchSection(sec.id)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 20,
                backgroundColor: isActive ? COLORS.primary : COLORS.card,
                borderWidth: 1.5,
                borderColor: isActive ? COLORS.primary : COLORS.border,
              }}
            >
              <Text style={{ fontSize: 13 }}>{sec.icon}</Text>
              <Text
                style={{
                  color: isActive ? "#fff" : COLORS.textSecondary,
                  fontSize: 13,
                  fontWeight: isActive ? "700" : "500",
                }}
              >
                {sec.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Active section indicator */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12, marginTop: 8 }}>
        <View
          style={{ height: 2, backgroundColor: COLORS.border, borderRadius: 1 }}
        >
          <View
            style={{
              height: 2,
              width: "25%",
              backgroundColor: COLORS.primary,
              borderRadius: 1,
              marginLeft: `${SECTIONS.findIndex((s) => s.id === activeSection) * 25}%`,
            }}
          />
        </View>
      </View>

      {/* Content */}
      <Animated.View
        style={{ flex: 1, paddingHorizontal: 20, opacity: fadeAnim }}
      >
        {renderSection()}
      </Animated.View>
    </View>
  );
}
