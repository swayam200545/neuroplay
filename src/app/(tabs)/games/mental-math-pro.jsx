import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const COLOR = "#C084FC";
const TOTAL_QUESTIONS = 12;
const TIME_PER_Q = 15;

function generateChain() {
  const start = Math.floor(Math.random() * 20) + 2;
  const ops = [
    {
      sym: "×",
      fn: (n) => n * (Math.floor(Math.random() * 4) + 2),
      label: (v) => `× ${v}`,
    },
    {
      sym: "+",
      fn: (n) => n + Math.floor(Math.random() * 30) + 5,
      label: (v) => `+ ${v}`,
    },
    {
      sym: "−",
      fn: (n) => n - Math.floor(Math.random() * 10) - 2,
      label: (v) => `− ${Math.abs(v)}`,
    },
  ];
  const steps = [];
  let current = start;
  const numSteps = 2 + Math.floor(Math.random() * 2); // 2–3 steps
  for (let i = 0; i < numSteps; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    const next = op.fn(current);
    const diff = next - current;
    steps.push({ label: op.label(Math.abs(diff)), result: next });
    current = next;
  }
  const answer = Math.abs(current);
  // Generate 3 wrong options
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const w = answer + (Math.floor(Math.random() * 30) - 15);
    if (w !== answer && w > 0) wrongs.add(w);
  }
  const options = [...wrongs, answer].sort(() => Math.random() - 0.5);
  return { start, steps, answer, options };
}

export default function MentalMathPro() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [qIdx, setQIdx] = useState(0);
  const [chain, setChain] = useState(() => generateChain());
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const startTimer = () => {
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: TIME_PER_Q * 1000,
      useNativeDriver: false,
    }).start();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [qIdx]);

  const handleAnswer = (choice) => {
    clearInterval(timerRef.current);
    const wasCorrect = choice === chain.answer;
    setSelected(choice);
    if (wasCorrect) {
      setCorrect((c) => c + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    Animated.timing(feedbackAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      if (qIdx + 1 >= TOTAL_QUESTIONS) {
        const nextCorrect = wasCorrect ? correct + 1 : correct;
        const score = nextCorrect;
        const xp = Math.round((nextCorrect / TOTAL_QUESTIONS) * 350 + 60);
        setXpEarned(xp);
        recordGameResult("mental-math-pro", score, xp);
        setGameOver(true);
      } else {
        setQIdx((i) => i + 1);
        setChain(generateChain());
        setSelected(null);
        setTimeLeft(TIME_PER_Q);
        feedbackAnim.setValue(0);
        progressAnim.setValue(1);
      }
    }, 900);
  };

  const resetGame = () => {
    clearInterval(timerRef.current);
    progressAnim.setValue(1);
    feedbackAnim.setValue(0);
    setQIdx(0);
    setChain(generateChain());
    setCorrect(0);
    setTimeLeft(TIME_PER_Q);
    setSelected(null);
    setShowResult(false);
    setGameOver(false);
    setXpEarned(0);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

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
        }}
      >
        <TouchableOpacity
          onPress={() => {
            clearInterval(timerRef.current);
            router.back();
          }}
          style={{ marginRight: 12 }}
        >
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Text
          style={{
            color: COLORS.text,
            fontSize: 20,
            fontWeight: "700",
            flex: 1,
          }}
        >
          Mental Math Pro
        </Text>
        <TouchableOpacity onPress={resetGame}>
          <RotateCcw color={COLORS.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
            Q {qIdx + 1}/{TOTAL_QUESTIONS}
          </Text>
          <Text
            style={{
              color: timeLeft <= 5 ? COLORS.error : COLORS.textSecondary,
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {timeLeft}s
          </Text>
        </View>
        <View
          style={{ height: 5, backgroundColor: COLORS.border, borderRadius: 3 }}
        >
          <Animated.View
            style={{
              height: 5,
              borderRadius: 3,
              width: progressWidth,
              backgroundColor: timeLeft <= 5 ? COLORS.error : COLOR,
            }}
          />
        </View>
        <View
          style={{
            height: 5,
            backgroundColor: COLORS.border,
            borderRadius: 3,
            marginTop: 8,
          }}
        >
          <View
            style={{
              height: 5,
              borderRadius: 3,
              width: `${(qIdx / TOTAL_QUESTIONS) * 100}%`,
              backgroundColor: COLORS.success,
            }}
          />
        </View>
      </View>

      {/* Chain display */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: COLOR + "40",
          }}
        >
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 12,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Calculate step by step in your head
          </Text>
          <Text
            style={{
              color: COLOR,
              fontSize: 36,
              fontWeight: "900",
              textAlign: "center",
            }}
          >
            {chain.start}
          </Text>
          {chain.steps.map((step, i) => (
            <View key={i} style={{ alignItems: "center", marginTop: 8 }}>
              <View
                style={{ width: 2, height: 8, backgroundColor: COLORS.border }}
              />
              <View
                style={{
                  backgroundColor: COLOR + "20",
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: COLOR, fontSize: 22, fontWeight: "700" }}>
                  {step.label}
                </Text>
              </View>
              {i < chain.steps.length - 1 && (
                <View
                  style={{
                    width: 2,
                    height: 8,
                    backgroundColor: COLORS.border,
                  }}
                />
              )}
            </View>
          ))}
          <View
            style={{
              width: 2,
              height: 8,
              backgroundColor: COLORS.border,
              alignSelf: "center",
            }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text
              style={{ color: COLORS.text, fontSize: 28, fontWeight: "800" }}
            >
              = ?
            </Text>
          </View>
        </View>

        {/* Options */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {chain.options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = opt === chain.answer;
            let bg = COLORS.card;
            let border = COLORS.border;
            if (selected !== null) {
              if (isCorrect) {
                bg = COLORS.success + "20";
                border = COLORS.success;
              } else if (isSelected && !isCorrect) {
                bg = COLORS.error + "20";
                border = COLORS.error;
              }
            }
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  if (selected === null) handleAnswer(opt);
                }}
                style={{
                  flex: 1,
                  minWidth: "45%",
                  backgroundColor: bg,
                  borderRadius: 14,
                  padding: 18,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: border,
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 24,
                    fontWeight: "700",
                  }}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Score row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 20,
            marginTop: 20,
          }}
        >
          <Text
            style={{ color: COLORS.success, fontSize: 14, fontWeight: "700" }}
          >
            ✅ {correct}
          </Text>
          <Text
            style={{ color: COLORS.error, fontSize: 14, fontWeight: "700" }}
          >
            ❌ {qIdx - correct}
          </Text>
        </View>
      </View>

      {/* Game over modal */}
      {gameOver && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
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
            }}
          >
            <Text style={{ fontSize: 52, marginBottom: 8 }}>
              {correct >= 10 ? "🧠" : correct >= 7 ? "🔥" : "💡"}
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 26, fontWeight: "800" }}
            >
              {correct}/{TOTAL_QUESTIONS} Correct
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginTop: 6,
              }}
            >
              {Math.round((correct / TOTAL_QUESTIONS) * 100)}% accuracy
            </Text>
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 20,
                fontWeight: "700",
                marginTop: 12,
              }}
            >
              +{xpEarned} XP ⭐
            </Text>
            <TouchableOpacity
              onPress={resetGame}
              style={{
                backgroundColor: COLOR,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 40,
                marginTop: 24,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Play Again
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginTop: 14 }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                Back to Games
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
