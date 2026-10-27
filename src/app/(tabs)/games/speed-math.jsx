import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Star } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const ROUND_TIME = 60; // seconds
const POINTS_PER_CORRECT = 10;
const PENALTY_PER_WRONG = 5;

function generateQuestion(level) {
  const ops =
    level < 3 ? ["+", "-"] : level < 6 ? ["+", "-", "*"] : ["+", "-", "*", "/"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  switch (op) {
    case "+":
      a = Math.floor(Math.random() * (10 + level * 5)) + 1;
      b = Math.floor(Math.random() * (10 + level * 5)) + 1;
      answer = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * (20 + level * 5)) + 10;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case "*":
      a = Math.floor(Math.random() * (5 + level)) + 2;
      b = Math.floor(Math.random() * (5 + level)) + 2;
      answer = a * b;
      break;
    case "/":
      b = Math.floor(Math.random() * 9) + 2;
      answer = Math.floor(Math.random() * 9) + 2;
      a = b * answer;
      break;
  }
  // Generate 3 wrong options
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const offset = Math.floor(Math.random() * 10) + 1;
    const wrong =
      Math.random() < 0.5 ? answer + offset : Math.max(0, answer - offset);
    if (wrong !== answer) wrongs.add(wrong);
  }
  const options = [answer, ...wrongs].sort(() => Math.random() - 0.5);
  return { question: `${a} ${op} ${b}`, answer, options };
}

export default function SpeedMath() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [phase, setPhase] = useState("ready"); // ready | playing | done
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [question, setQuestion] = useState(() => generateQuestion(1));
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [level, setLevel] = useState(1);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      setPhase("done");
      const xp = Math.max(50, Math.round(score * 1.5));
      recordGameResult("speed-math", score, xp);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const nextQuestion = useCallback(
    (newLevel) => {
      setQuestion(generateQuestion(newLevel || level));
      setFeedback(null);
    },
    [level],
  );

  const handleAnswer = useCallback(
    (option) => {
      if (feedback) return;
      if (option === question.answer) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFeedback("correct");
        const newCorrect = correct + 1;
        setCorrect(newCorrect);
        const newScore = score + POINTS_PER_CORRECT;
        setScore(newScore);
        const newLevel = Math.floor(newCorrect / 5) + 1;
        setLevel(newLevel);
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => nextQuestion(newLevel));
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedback("wrong");
        setWrong((w) => w + 1);
        setScore((s) => Math.max(0, s - PENALTY_PER_WRONG));
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 6,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 60,
            useNativeDriver: true,
          }),
        ]).start(() => nextQuestion());
      }
    },
    [feedback, question, score, correct, flashAnim, shakeAnim, nextQuestion],
  );

  const startGame = () => {
    setPhase("playing");
    setTimeLeft(ROUND_TIME);
    setScore(0);
    setCorrect(0);
    setWrong(0);
    setLevel(1);
    setQuestion(generateQuestion(1));
    setFeedback(null);
  };

  const timerColor =
    timeLeft > 20
      ? COLORS.success
      : timeLeft > 10
        ? COLORS.highlight
        : COLORS.error;
  const accuracy =
    correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

  if (phase === "ready") {
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
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={COLORS.text} size={24} />
          </TouchableOpacity>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 20,
              fontWeight: "700",
              marginLeft: 12,
            }}
          >
            Speed Math
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 30,
          }}
        >
          <Text style={{ fontSize: 64 }}>🔢</Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Speed Math
          </Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 15,
              textAlign: "center",
              marginTop: 12,
              lineHeight: 22,
            }}
          >
            Solve as many math equations as you can in 60 seconds. Get +
            {POINTS_PER_CORRECT} pts for correct, -{PENALTY_PER_WRONG} for
            wrong. Questions get harder as you progress!
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
            {["Quick", "Fast", "Tricky"].map((d, i) => (
              <View
                key={d}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 10,
                  padding: 12,
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <Text
                  style={{ color: "#A78BFA", fontSize: 16, fontWeight: "800" }}
                >
                  Lv.{i + 1}+
                </Text>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            onPress={startGame}
            style={{
              backgroundColor: "#A78BFA",
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 60,
              marginTop: 32,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
              Start!
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === "done") {
    const xp = Math.max(50, Math.round(score * 1.5));
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          paddingTop: insets.top,
          alignItems: "center",
          justifyContent: "center",
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
          <Text style={{ fontSize: 52 }}>🏆</Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 12,
            }}
          >
            Time's Up!
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginTop: 20,
              width: "100%",
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.background,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#A78BFA", fontSize: 26, fontWeight: "800" }}
              >
                {score}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                Score
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.background,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: COLORS.success,
                  fontSize: 26,
                  fontWeight: "800",
                }}
              >
                {correct}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                Correct
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.background,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: COLORS.secondary,
                  fontSize: 26,
                  fontWeight: "800",
                }}
              >
                {accuracy}%
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                Accuracy
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 16,
              gap: 6,
            }}
          >
            <Star color={COLORS.highlight} size={18} fill={COLORS.highlight} />
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              +{xp} XP
            </Text>
          </View>
          <TouchableOpacity
            onPress={startGame}
            style={{
              backgroundColor: "#A78BFA",
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
    );
  }

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
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: timerColor, fontSize: 28, fontWeight: "800" }}>
            {timeLeft}s
          </Text>
        </View>
        <View
          style={{
            backgroundColor: COLORS.card,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#A78BFA", fontSize: 16, fontWeight: "700" }}>
            {score}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View
        style={{
          marginHorizontal: 20,
          height: 4,
          backgroundColor: COLORS.border,
          borderRadius: 2,
        }}
      >
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: timerColor,
            width: `${(timeLeft / ROUND_TIME) * 100}%`,
          }}
        />
      </View>

      {/* Stats */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          marginTop: 12,
          gap: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            borderRadius: 10,
            padding: 10,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: COLORS.success, fontSize: 18, fontWeight: "700" }}
          >
            {correct}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
            Correct
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            borderRadius: 10,
            padding: 10,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: COLORS.error, fontSize: 18, fontWeight: "700" }}
          >
            {wrong}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
            Wrong
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            borderRadius: 10,
            padding: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#A78BFA", fontSize: 18, fontWeight: "700" }}>
            Lv.{level}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
            Difficulty
          </Text>
        </View>
      </View>

      {/* Question */}
      <Animated.View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ translateX: shakeAnim }],
        }}
      >
        <Animated.View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 24,
            padding: 40,
            marginHorizontal: 20,
            alignItems: "center",
            width: "90%",
            opacity: flashAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.3],
            }),
          }}
        >
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 14,
              marginBottom: 8,
            }}
          >
            Solve:
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 42, fontWeight: "800" }}>
            {question.question} = ?
          </Text>
        </Animated.View>

        {/* Options */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 24,
            paddingHorizontal: 20,
            justifyContent: "center",
          }}
        >
          {question.options.map((option, i) => {
            let bg = COLORS.card;
            if (feedback === "correct" && option === question.answer)
              bg = COLORS.success + "40";
            if (feedback === "wrong" && option === question.answer)
              bg = COLORS.success + "40";
            if (feedback === "wrong" && option !== question.answer)
              bg = COLORS.error + "20";

            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleAnswer(option)}
                activeOpacity={0.7}
                style={{
                  width: "45%",
                  backgroundColor: bg,
                  borderRadius: 14,
                  paddingVertical: 20,
                  alignItems: "center",
                  borderWidth: feedback && option === question.answer ? 2 : 0,
                  borderColor: COLORS.success,
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 26,
                    fontWeight: "700",
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}
