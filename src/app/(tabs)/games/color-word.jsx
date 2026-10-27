import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Star } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const ROUND_TIME = 45;
const WORD_COLORS = [
  { name: "RED", hex: "#FF4D6A" },
  { name: "BLUE", hex: "#60A5FA" },
  { name: "GREEN", hex: "#4ADE80" },
  { name: "YELLOW", hex: "#FFD166" },
  { name: "PURPLE", hex: "#A78BFA" },
  { name: "ORANGE", hex: "#FF8C42" },
];

function generateRound() {
  const wordObj = WORD_COLORS[Math.floor(Math.random() * WORD_COLORS.length)];
  let inkObj = WORD_COLORS[Math.floor(Math.random() * WORD_COLORS.length)];
  // Sometimes make them match (easy), sometimes mismatch (hard)
  if (Math.random() < 0.3) inkObj = wordObj;
  // Shuffle answer options (3 options: correct ink color + 2 distractors)
  const others = WORD_COLORS.filter((c) => c.name !== inkObj.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  const options = [inkObj, ...others].sort(() => Math.random() - 0.5);
  return {
    word: wordObj.name,
    inkColor: inkObj.hex,
    inkName: inkObj.name,
    options,
  };
}

export default function ColorWord() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [round, setRound] = useState(() => generateRound());
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [lastChoice, setLastChoice] = useState(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      setPhase("done");
      const xp = Math.max(
        50,
        Math.round((score / Math.max(1, correct + wrong)) * 200 + score * 2),
      );
      recordGameResult("color-word", score, xp);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const handleChoice = useCallback(
    (colorName) => {
      if (feedback) return;
      setLastChoice(colorName);
      if (colorName === round.inkName) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFeedback("correct");
        setCorrect((c) => c + 1);
        setScore((s) => s + 10);
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setRound(generateRound());
          setFeedback(null);
          setLastChoice(null);
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFeedback("wrong");
        setWrong((w) => w + 1);
        setScore((s) => Math.max(0, s - 5));
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 12,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -12,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 60,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setRound(generateRound());
          setFeedback(null);
          setLastChoice(null);
        });
      }
    },
    [feedback, round, shakeAnim, scaleAnim],
  );

  const startGame = () => {
    setPhase("playing");
    setTimeLeft(ROUND_TIME);
    setScore(0);
    setCorrect(0);
    setWrong(0);
    setRound(generateRound());
    setFeedback(null);
    setLastChoice(null);
  };

  const timerColor =
    timeLeft > 15
      ? COLORS.success
      : timeLeft > 8
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
            Color Word
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
          <Text style={{ fontSize: 64 }}>🎨</Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 16,
            }}
          >
            Color Word
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
            A color word will appear in a different ink color.{"\n"}
            Tap the{" "}
            <Text style={{ color: "#F472B6", fontWeight: "700" }}>
              INK COLOR
            </Text>{" "}
            — not the word written!{"\n\n"}
            This challenges your brain's ability to override instinct. 🧠
          </Text>
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 20,
              marginTop: 20,
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              Example:
            </Text>
            <Text
              style={{
                color: "#4ADE80",
                fontSize: 32,
                fontWeight: "900",
                letterSpacing: 2,
              }}
            >
              RED
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginTop: 8,
              }}
            >
              → Tap "GREEN" (the ink color)
            </Text>
          </View>
          <TouchableOpacity
            onPress={startGame}
            style={{
              backgroundColor: "#F472B6",
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
    const xp = Math.max(50, Math.round(score * 2));
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
          <Text style={{ fontSize: 52 }}>🎨</Text>
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
                style={{ color: "#F472B6", fontSize: 26, fontWeight: "800" }}
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
              backgroundColor: "#F472B6",
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
        <Text style={{ color: timerColor, fontSize: 28, fontWeight: "800" }}>
          {timeLeft}s
        </Text>
        <View
          style={{
            backgroundColor: COLORS.card,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#F472B6", fontSize: 16, fontWeight: "700" }}>
            {score}
          </Text>
        </View>
      </View>

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
            backgroundColor: "#F472B6",
            width: `${(timeLeft / ROUND_TIME) * 100}%`,
          }}
        />
      </View>

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
          <Text
            style={{ color: COLORS.secondary, fontSize: 18, fontWeight: "700" }}
          >
            {accuracy}%
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
            Accuracy
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          What color is the INK?
        </Text>
        <Animated.View
          style={{
            transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
          }}
        >
          <Text
            style={{
              color: round.inkColor,
              fontSize: 52,
              fontWeight: "900",
              letterSpacing: 4,
              textShadowColor: round.inkColor + "60",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            }}
          >
            {round.word}
          </Text>
        </Animated.View>

        {/* Color Buttons */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 40,
            paddingHorizontal: 20,
            justifyContent: "center",
          }}
        >
          {round.options.map((opt, i) => {
            let borderColor = "transparent";
            if (feedback && lastChoice === opt.name) {
              borderColor =
                feedback === "correct" ? COLORS.success : COLORS.error;
            }
            if (feedback === "wrong" && opt.name === round.inkName)
              borderColor = COLORS.success;

            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleChoice(opt.name)}
                activeOpacity={0.7}
                style={{
                  width: "44%",
                  borderRadius: 14,
                  paddingVertical: 18,
                  alignItems: "center",
                  backgroundColor: opt.hex + "25",
                  borderWidth: 2,
                  borderColor:
                    borderColor !== "transparent"
                      ? borderColor
                      : opt.hex + "60",
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: opt.hex,
                    marginBottom: 8,
                  }}
                />
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  {opt.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
