import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { COLORS } from "@/constants/theme";
import useGameStore from "@/store/gameStore";
import { IntroStage } from "@/components/WeeklyTest/IntroStage";
import { NumberFlashStage } from "@/components/WeeklyTest/NumberFlashStage";
import { ReactionStage } from "@/components/WeeklyTest/ReactionStage";
import { FocusStage } from "@/components/WeeklyTest/FocusStage";
import { MathStage } from "@/components/WeeklyTest/MathStage";
import { WordRecallStage } from "@/components/WeeklyTest/WordRecallStage";
import { CalculatingStage } from "@/components/WeeklyTest/CalculatingStage";
import { ProgressBar } from "@/components/WeeklyTest/ProgressBar";

export default function WeeklyTestScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordWeeklyTest = useGameStore((s) => s.recordWeeklyTest);

  const [stage, setStage] = useState(0);
  const [stageScores, setStageScores] = useState({});

  const STAGE_KEYS = ["memory", "speed", "focus", "logic", "recall"];

  const handleStageComplete = (scoreIndex, score) => {
    const key = STAGE_KEYS[scoreIndex - 1];
    const newScores = { ...stageScores, [key]: score };
    setStageScores(newScores);
    setStage(scoreIndex + 1);

    if (scoreIndex === 5) {
      setStage(6);
      setTimeout(() => {
        const keys = ["memory", "speed", "focus", "logic", "recall"];
        const total = keys.reduce((sum, k) => sum + (newScores[k] || 0), 0);
        const overall = Math.round(total / keys.length);
        const result = { overallScore: overall, ...newScores };
        recordWeeklyTest(result);
        router.replace("/(tabs)/games/weekly-results");
      }, 2000);
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: stage > 0 ? 1 : 0,
          borderBottomColor: COLORS.border,
        }}
      >
        {stage === 0 ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
          >
            <X color={COLORS.textSecondary} size={22} />
          </TouchableOpacity>
        ) : (
          <ProgressBar stage={stage} />
        )}
      </View>

      {stage === 0 && <IntroStage onStart={() => setStage(1)} />}
      {stage === 1 && (
        <NumberFlashStage onComplete={(s) => handleStageComplete(1, s)} />
      )}
      {stage === 2 && (
        <ReactionStage onComplete={(s) => handleStageComplete(2, s)} />
      )}
      {stage === 3 && (
        <FocusStage onComplete={(s) => handleStageComplete(3, s)} />
      )}
      {stage === 4 && (
        <MathStage onComplete={(s) => handleStageComplete(4, s)} />
      )}
      {stage === 5 && (
        <WordRecallStage onComplete={(s) => handleStageComplete(5, s)} />
      )}
      {stage === 6 && <CalculatingStage />}
    </View>
  );
}
