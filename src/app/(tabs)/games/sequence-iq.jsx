import React, { useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Star } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

// Different sequence generators
const SEQUENCE_TYPES = [
  // Arithmetic
  () => {
    const start = Math.floor(Math.random() * 10) + 1;
    const diff = Math.floor(Math.random() * 5) + 1;
    const seq = Array.from({ length: 5 }, (_, i) => start + i * diff);
    const answer = seq[5 - 1] + diff;
    return { seq: seq.slice(0, 4), answer, hint: `+${diff} each step` };
  },
  // Multiply
  () => {
    const start = Math.floor(Math.random() * 3) + 1;
    const mult = Math.floor(Math.random() * 2) + 2;
    const seq = Array.from({ length: 5 }, (_, i) => start * Math.pow(mult, i));
    const answer = seq[4];
    return { seq: seq.slice(0, 4), answer, hint: `×${mult} each step` };
  },
  // Fibonacci-style
  () => {
    const a = Math.floor(Math.random() * 3) + 1;
    const b = Math.floor(Math.random() * 3) + 1;
    const seq = [a, b];
    while (seq.length < 5) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
    const answer = seq[4];
    return { seq: seq.slice(0, 4), answer, hint: "Sum of prev two" };
  },
  // Squares
  () => {
    const start = Math.floor(Math.random() * 3) + 1;
    const seq = Array.from({ length: 5 }, (_, i) => (start + i) * (start + i));
    const answer = seq[4];
    return { seq: seq.slice(0, 4), answer, hint: "Perfect squares" };
  },
  // Subtract with growing diff
  () => {
    const start = Math.floor(Math.random() * 50) + 50;
    const seq = [start];
    let diff = 1;
    for (let i = 1; i < 5; i++) {
      seq.push(seq[i - 1] - diff);
      diff += 1;
    }
    const answer = seq[4];
    return { seq: seq.slice(0, 4), answer, hint: "Subtracting more each time" };
  },
  // Alternating add/subtract
  () => {
    const start = Math.floor(Math.random() * 20) + 10;
    const addAmt = Math.floor(Math.random() * 5) + 3;
    const subAmt = Math.floor(Math.random() * 3) + 1;
    const seq = [start];
    for (let i = 1; i < 5; i++) {
      seq.push(i % 2 === 1 ? seq[i - 1] + addAmt : seq[i - 1] - subAmt);
    }
    const answer = seq[4];
    return {
      seq: seq.slice(0, 4),
      answer,
      hint: `+${addAmt}, -${subAmt} alternating`,
    };
  },
];

function generateSequence(difficulty) {
  // Choose a type based on difficulty
  const easyTypes = [0]; // arithmetic only
  const medTypes = [0, 0, 2, 4]; // more arithmetic + fibonacci
  const hardTypes = [0, 1, 2, 3, 4, 5];
  const pool =
    difficulty < 3 ? easyTypes : difficulty < 6 ? medTypes : hardTypes;
  const typeIdx = pool[Math.floor(Math.random() * pool.length)];
  const gen = SEQUENCE_TYPES[typeIdx]();

  // Generate 3 wrong answers
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const offset = Math.floor(Math.random() * 15) + 1;
    const w =
      Math.random() < 0.5
        ? gen.answer + offset
        : Math.max(1, gen.answer - offset);
    if (w !== gen.answer) wrongs.add(w);
  }
  const options = [gen.answer, ...wrongs].sort(() => Math.random() - 0.5);
  return { ...gen, options };
}

const TOTAL_ROUNDS = 10;

export default function SequenceIQ() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [phase, setPhase] = useState("ready");
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState(() => generateSequence(1));
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [streak, setStreak] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const handleAnswer = useCallback(
    (option) => {
      if (feedback) return;
      setSelectedOption(option);

      if (option === sequence.answer) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFeedback("correct");
        const newStreak = streak + 1;
        setStreak(newStreak);
        const bonus = newStreak >= 3 ? 20 : 0;
        const pts = 100 + bonus;
        setScore((s) => s + pts);
        setCorrect((c) => c + 1);
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(() => {
            if (round >= TOTAL_ROUNDS) {
              const xp = Math.max(100, score + pts);
              recordGameResult("sequence-iq", score + pts, xp);
              setPhase("done");
            } else {
              setRound((r) => r + 1);
              setSequence(generateSequence(Math.min(round, 7)));
              setFeedback(null);
              setSelectedOption(null);
            }
          }, 600);
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedback("wrong");
        setStreak(0);
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 70,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(() => {
            if (round >= TOTAL_ROUNDS) {
              recordGameResult("sequence-iq", score, Math.max(50, score));
              setPhase("done");
            } else {
              setRound((r) => r + 1);
              setSequence(generateSequence(Math.min(round, 7)));
              setFeedback(null);
              setSelectedOption(null);
            }
          }, 800);
        });
      }
    },
    [feedback, sequence, score, round, streak, bounceAnim, shakeAnim],
  );

  const startGame = () => {
    setPhase("playing");
    setRound(1);
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setSequence(generateSequence(1));
    setFeedback(null);
    setSelectedOption(null);
  };

  const accuracy = round > 1 ? Math.round((correct / (round - 1)) * 100) : 0;

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
            Sequence IQ
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
          <Text style={{ fontSize: 64 }}>🧬</Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 16,
            }}
          >
            Sequence IQ
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
            Find the next number in the sequence.{"\n"}
            10 rounds — difficulty increases as you go.{"\n"}
            Streak bonuses for 3+ correct in a row! 🔥
          </Text>
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 20,
              marginTop: 20,
              width: "100%",
            }}
          >
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              Example:
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {[2, 4, 8, 16].map((n, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: "#60A5FA" + "25",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#60A5FA",
                      fontSize: 20,
                      fontWeight: "700",
                    }}
                  >
                    {n}
                  </Text>
                </View>
              ))}
              <Text style={{ color: COLORS.textSecondary, fontSize: 24 }}>
                →
              </Text>
              <View
                style={{
                  backgroundColor: COLORS.success + "25",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    color: COLORS.success,
                    fontSize: 20,
                    fontWeight: "700",
                  }}
                >
                  ?
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={startGame}
            style={{
              backgroundColor: "#60A5FA",
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 60,
              marginTop: 28,
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
    const xp = Math.max(100, score);
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
          <Text style={{ fontSize: 52 }}>🧬</Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 12,
            }}
          >
            Sequence Complete!
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
                style={{ color: "#60A5FA", fontSize: 26, fontWeight: "800" }}
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
                {correct}/{TOTAL_ROUNDS}
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
              backgroundColor: "#60A5FA",
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
        <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>
          Round{" "}
          <Text style={{ color: COLORS.text, fontWeight: "700" }}>{round}</Text>
          /{TOTAL_ROUNDS}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {streak >= 3 && <Text style={{ fontSize: 16 }}>🔥</Text>}
          <Text style={{ color: "#60A5FA", fontSize: 16, fontWeight: "700" }}>
            {score}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
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
            backgroundColor: "#60A5FA",
            width: `${((round - 1) / TOTAL_ROUNDS) * 100}%`,
          }}
        />
      </View>

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 8 }}
        >
          What comes next?
        </Text>

        {/* Sequence display */}
        <Animated.View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 20,
            padding: 24,
            width: "100%",
            transform: [{ translateX: shakeAnim }, { scale: bounceAnim }],
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {sequence.seq.map((n, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: "#60A5FA" + "20",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{ color: "#60A5FA", fontSize: 24, fontWeight: "800" }}
                >
                  {n}
                </Text>
              </View>
            ))}
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 24,
                fontWeight: "300",
              }}
            >
              →
            </Text>
            <View
              style={{
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor:
                  feedback === "correct"
                    ? COLORS.success + "30"
                    : feedback === "wrong"
                      ? COLORS.error + "20"
                      : COLORS.primary + "20",
                borderWidth: 2,
                borderColor:
                  feedback === "correct"
                    ? COLORS.success
                    : feedback === "wrong"
                      ? COLORS.error
                      : COLORS.primary,
              }}
            >
              <Text
                style={{
                  color:
                    feedback === "correct"
                      ? COLORS.success
                      : feedback === "wrong"
                        ? COLORS.error
                        : COLORS.text,
                  fontSize: 24,
                  fontWeight: "800",
                }}
              >
                {feedback ? sequence.answer : "?"}
              </Text>
            </View>
          </View>

          {feedback && (
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 12,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              💡 {sequence.hint}
            </Text>
          )}
        </Animated.View>

        {/* Streak indicator */}
        {streak > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 16,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Streak:
            </Text>
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {streak} 🔥
            </Text>
            {streak >= 3 && (
              <Text style={{ color: COLORS.success, fontSize: 12 }}>
                +20 bonus!
              </Text>
            )}
          </View>
        )}

        {/* Options */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 28,
            justifyContent: "center",
            width: "100%",
          }}
        >
          {sequence.options.map((opt, i) => {
            let bg = COLORS.card;
            let border = COLORS.border;
            if (selectedOption === opt) {
              bg =
                feedback === "correct"
                  ? COLORS.success + "30"
                  : COLORS.error + "25";
              border = feedback === "correct" ? COLORS.success : COLORS.error;
            }
            if (feedback === "wrong" && opt === sequence.answer) {
              bg = COLORS.success + "20";
              border = COLORS.success;
            }

            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleAnswer(opt)}
                activeOpacity={0.7}
                style={{
                  width: "46%",
                  backgroundColor: bg,
                  borderRadius: 14,
                  paddingVertical: 20,
                  alignItems: "center",
                  borderWidth: 1.5,
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
      </View>
    </View>
  );
}
