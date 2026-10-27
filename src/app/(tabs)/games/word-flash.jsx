import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Star, Check, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";
import KeyboardAvoidingAnimatedView from "../../../components/KeyboardAvoidingAnimatedView";

const WORD_BANK = [
  "APPLE",
  "BRIDGE",
  "CLOUD",
  "DANCE",
  "EAGLE",
  "FLAME",
  "GRAPE",
  "HEART",
  "IVORY",
  "JUNGLE",
  "KNIFE",
  "LEMON",
  "MAGIC",
  "NIGHT",
  "OCEAN",
  "PIANO",
  "QUEEN",
  "RIVER",
  "STORM",
  "TIGER",
  "ULTRA",
  "VIVID",
  "WATER",
  "XENON",
  "YOUTH",
  "ZEBRA",
  "AMBER",
  "BRAVE",
  "CRISP",
  "DRIFT",
  "EMBER",
  "FROST",
  "GLOBE",
  "HONEY",
  "INDEX",
  "JEWEL",
  "KNEEL",
  "LUNAR",
  "MANGO",
  "NERVE",
  "OLIVE",
  "PIXEL",
  "QUAKE",
  "ROUGE",
  "SHINY",
  "TOWER",
  "URBAN",
  "VAPOR",
  "WHEAT",
  "XRAY",
];

function getWords(count) {
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const ROUNDS = [
  { wordCount: 3, displayMs: 3000 },
  { wordCount: 4, displayMs: 3000 },
  { wordCount: 5, displayMs: 3500 },
  { wordCount: 6, displayMs: 4000 },
  { wordCount: 7, displayMs: 4500 },
];

export default function WordFlash() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [phase, setPhase] = useState("ready"); // ready | showing | recall | result | done
  const [roundIdx, setRoundIdx] = useState(0);
  const [words, setWords] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [recalled, setRecalled] = useState([]); // correctly recalled words
  const [missed, setMissed] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [showTimer, setShowTimer] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const startRound = useCallback(
    (idx) => {
      const r = ROUNDS[idx];
      const newWords = getWords(r.wordCount);
      setWords(newWords);
      setUserInput("");
      setRecalled([]);
      setMissed([]);
      setPhase("showing");
      setShowTimer(Math.ceil(r.displayMs / 1000));
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [fadeAnim],
  );

  // Countdown during showing phase
  useEffect(() => {
    if (phase !== "showing") return;
    if (showTimer <= 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setPhase("recall");
      });
      return;
    }
    const t = setTimeout(() => setShowTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, showTimer]);

  const submitRecall = () => {
    const entered = userInput.trim().toUpperCase().split(/\s+/).filter(Boolean);
    const correctOnes = entered.filter((w) => words.includes(w));
    const missedOnes = words.filter((w) => !entered.includes(w));
    const pts = correctOnes.length * 20;
    setRecalled(correctOnes);
    setMissed(missedOnes);
    setTotalScore((s) => s + pts);
    setTotalCorrect((c) => c + correctOnes.length);
    setPhase("result");
    if (correctOnes.length === words.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const nextRound = () => {
    const next = roundIdx + 1;
    if (next >= ROUNDS.length) {
      const xp = Math.max(80, totalScore * 2);
      recordGameResult("word-flash", totalScore, xp);
      setPhase("done");
    } else {
      setRoundIdx(next);
      startRound(next);
    }
  };

  const startGame = () => {
    setRoundIdx(0);
    setTotalScore(0);
    setTotalCorrect(0);
    startRound(0);
  };

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
            Word Flash
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
          <Text style={{ fontSize: 64 }}>📖</Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 16,
            }}
          >
            Word Flash
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
            A set of words will flash on screen for a few seconds.{"\n"}
            Memorize them all, then type as many as you can recall.{"\n\n"}5
            rounds. Words increase each round! 🧠
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 20 }}>
            {ROUNDS.map((r, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.card,
                  borderRadius: 10,
                  padding: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#34D399", fontSize: 15, fontWeight: "800" }}
                >
                  {r.wordCount}
                </Text>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 10,
                    marginTop: 2,
                  }}
                >
                  words
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            onPress={startGame}
            style={{
              backgroundColor: "#34D399",
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

  if (phase === "showing") {
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
          <Text style={{ color: COLORS.textSecondary, fontSize: 15 }}>
            Round {roundIdx + 1}/{ROUNDS.length}
          </Text>
          <Text style={{ color: "#34D399", fontSize: 28, fontWeight: "800" }}>
            {showTimer}s
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 15 }}>
            {words.length} words
          </Text>
        </View>
        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 14,
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Memorize these words!
        </Text>
        <Animated.View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            opacity: fadeAnim,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              paddingHorizontal: 24,
              justifyContent: "center",
            }}
          >
            {words.map((w, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: "#34D399" + "20",
                  borderRadius: 12,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: "#34D399" + "50",
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 22,
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  {w}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  }

  if (phase === "recall") {
    return (
      <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
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
            <Text style={{ color: COLORS.textSecondary, fontSize: 15 }}>
              Round {roundIdx + 1}/{ROUNDS.length}
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}
            >
              Recall!
            </Text>
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              {words.length} words
            </Text>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 24 }}>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 15,
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 22,
              }}
            >
              Type all the words you remember.{"\n"}Separate with spaces or new
              lines.
            </Text>
            <TextInput
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Type words here..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              autoFocus
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 16,
                padding: 16,
                color: COLORS.text,
                fontSize: 18,
                minHeight: 140,
                textAlignVertical: "top",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
            <TouchableOpacity
              onPress={submitRecall}
              style={{
                backgroundColor: "#34D399",
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Submit Recall
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingAnimatedView>
    );
  }

  if (phase === "result") {
    const roundPts = recalled.length * 20;
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          paddingTop: insets.top,
        }}
      >
        <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Round {roundIdx + 1} Results
          </Text>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              You recalled
            </Text>
            <Text
              style={{
                color: "#34D399",
                fontSize: 44,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {recalled.length}/{words.length}
            </Text>
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              +{roundPts} pts
            </Text>
          </View>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 15,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            Correct ✅
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {recalled.length > 0 ? (
              recalled.map((w) => (
                <View
                  key={w}
                  style={{
                    backgroundColor: COLORS.success + "20",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Check color={COLORS.success} size={14} />
                  <Text style={{ color: COLORS.success, fontWeight: "600" }}>
                    {w}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: COLORS.textSecondary }}>None :(</Text>
            )}
          </View>
          {missed.length > 0 && (
            <>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 15,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Missed ❌
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                {missed.map((w) => (
                  <View
                    key={w}
                    style={{
                      backgroundColor: COLORS.error + "15",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <X color={COLORS.error} size={14} />
                    <Text style={{ color: COLORS.error, fontWeight: "600" }}>
                      {w}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
          <TouchableOpacity
            onPress={nextRound}
            style={{
              backgroundColor: "#34D399",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {roundIdx + 1 >= ROUNDS.length
                ? "See Final Score"
                : `Next Round (${ROUNDS[roundIdx + 1]?.wordCount} words)`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // done
  const xp = Math.max(80, totalScore * 2);
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
        <Text style={{ fontSize: 52 }}>📖</Text>
        <Text
          style={{
            color: COLORS.text,
            fontSize: 26,
            fontWeight: "800",
            marginTop: 12,
          }}
        >
          Game Complete!
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
            <Text style={{ color: "#34D399", fontSize: 26, fontWeight: "800" }}>
              {totalScore}
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
              style={{ color: COLORS.success, fontSize: 26, fontWeight: "800" }}
            >
              {totalCorrect}
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              Recalled
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
              {ROUNDS.reduce((s, r) => s + r.wordCount, 0)}
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              Total
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
            style={{ color: COLORS.highlight, fontSize: 20, fontWeight: "700" }}
          >
            +{xp} XP
          </Text>
        </View>
        <TouchableOpacity
          onPress={startGame}
          style={{
            backgroundColor: "#34D399",
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
