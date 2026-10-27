import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw, Star, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const { width } = Dimensions.get("window");
const GAME_DURATION = 45; // seconds
const GRID_COLS = 3;
const ITEM_SIZE = (width - 60) / GRID_COLS;

// ─── Challenge definitions ────────────────────────────────────
const CHALLENGES = [
  {
    id: "even",
    label: "EVEN",
    emoji: "2️⃣",
    color: "#6366F1",
    desc: "Tap EVEN numbers",
    check: (n) => n % 2 === 0,
  },
  {
    id: "odd",
    label: "ODD",
    emoji: "1️⃣",
    color: "#F59E0B",
    desc: "Tap ODD numbers",
    check: (n) => n % 2 !== 0,
  },
  {
    id: "prime",
    label: "PRIME",
    emoji: "⭐",
    color: "#EC4899",
    desc: "Tap PRIME numbers",
    check: (n) => {
      if (n < 2) return false;
      for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
      return true;
    },
  },
  {
    id: "div3",
    label: "÷3",
    emoji: "3️⃣",
    color: "#10B981",
    desc: "Tap multiples of 3",
    check: (n) => n % 3 === 0,
  },
  {
    id: "gt50",
    label: ">50",
    emoji: "📈",
    color: "#3B82F6",
    desc: "Tap numbers > 50",
    check: (n) => n > 50,
  },
  {
    id: "lt20",
    label: "<20",
    emoji: "📉",
    color: "#EF4444",
    desc: "Tap numbers < 20",
    check: (n) => n < 20,
  },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a grid of 9 numbers — always guarantees at least 2 correct for current challenge
function buildGrid(challenge) {
  const pool = [];
  while (pool.length < 9) {
    const n = Math.floor(Math.random() * 98) + 2; // 2–99
    if (!pool.includes(n)) pool.push(n);
  }

  // Ensure at least 2 correct
  const correct = pool.filter(challenge.check);
  if (correct.length < 2) {
    // Insert guaranteed correct answers
    const safeMap = {
      even: [12, 24, 36, 48, 60, 72],
      odd: [11, 13, 17, 19, 21, 23],
      prime: [11, 13, 17, 19, 23, 29],
      div3: [12, 21, 33, 45, 57, 63],
      gt50: [55, 62, 71, 84, 91, 97],
      lt20: [3, 7, 11, 14, 16, 18],
    };
    const safe = safeMap[challenge.id] || [11, 22, 33];
    pool[0] = safe[Math.floor(Math.random() * safe.length)];
    pool[1] = safe[Math.floor(Math.random() * safe.length)];
    // Avoid duplicates
    if (pool[0] === pool[1])
      pool[1] = safe[(safe.indexOf(pool[0]) + 1) % safe.length];
  }

  return shuffleArray(pool);
}

export default function FocusFilter() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [gameState, setGameState] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [grid, setGrid] = useState([]);
  const [tapped, setTapped] = useState(new Set());
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [switchFlash, setSwitchFlash] = useState(false);

  const timerRef = useRef(null);
  const flashAnim = useRef(new Animated.Value(1)).current;
  const labelAnim = useRef(new Animated.Value(0)).current;
  const challengeIdxRef = useRef(0); // keep ref in sync for timer callback

  const challenge = CHALLENGES[challengeIdx];

  // ── Animate challenge switch ──────────────────────────────
  const animateLabelIn = () => {
    labelAnim.setValue(0);
    Animated.spring(labelAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 220,
    }).start();
  };

  const flashScreen = () => {
    setSwitchFlash(true);
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0.6,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setSwitchFlash(false));
  };

  // ── Switch to next challenge ──────────────────────────────
  const advanceChallenge = useCallback((currentIdx) => {
    const nextIdx = (currentIdx + 1) % CHALLENGES.length;
    setChallengeIdx(nextIdx);
    challengeIdxRef.current = nextIdx;
    setGrid(buildGrid(CHALLENGES[nextIdx]));
    setTapped(new Set());
    flashScreen();
    animateLabelIn();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  // ── Start game ────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const startIdx = 0;
    setChallengeIdx(startIdx);
    challengeIdxRef.current = startIdx;
    setGrid(buildGrid(CHALLENGES[startIdx]));
    setTapped(new Set());
    setCorrect(0);
    setWrong(0);
    setStreak(0);
    setBestStreak(0);
    setXpEarned(0);
    setTimeLeft(GAME_DURATION);
    setGameState("playing");
    animateLabelIn();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setGameState("done");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  // ── End game ──────────────────────────────────────────────
  useEffect(() => {
    if (gameState === "done") {
      if (timerRef.current) clearInterval(timerRef.current);
      const totalAttempts = correct + wrong;
      const accuracy =
        totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
      const xp = Math.round(
        (accuracy / 100) * 100 + correct * 5 + bestStreak * 8,
      );
      setXpEarned(xp);
      recordGameResult("focus-filter", accuracy, xp);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [gameState]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  // ── Handle tap on a number ────────────────────────────────
  const handleTap = useCallback(
    (num, idx) => {
      if (tapped.has(idx)) return;
      const ch = CHALLENGES[challengeIdxRef.current];
      const isCorrect = ch.check(num);

      setTapped((prev) => new Set([...prev, idx]));

      if (isCorrect) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newCorrect = correct + 1;
        setCorrect(newCorrect);
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));

        // After every correct tap → switch challenge and refresh grid
        setTimeout(() => {
          advanceChallenge(challengeIdxRef.current);
          setStreak(0); // reset streak per-challenge (optional: keep cumulative)
        }, 300);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setWrong((w) => w + 1);
        setStreak(0);
      }
    },
    [tapped, correct, wrong, streak, advanceChallenge],
  );

  const accuracy =
    correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const timerProgress = timeLeft / GAME_DURATION;
  const timerColor =
    timeLeft <= 8 ? COLORS.error : timeLeft <= 15 ? "#F59E0B" : challenge.color;

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
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (timerRef.current) clearInterval(timerRef.current);
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
          Focus Filter
        </Text>
        <TouchableOpacity onPress={startGame}>
          <RotateCcw color={COLORS.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      {/* ── IDLE ── */}
      {gameState === "idle" && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 36,
          }}
        >
          <Text style={{ fontSize: 60, marginBottom: 16 }}>🎯</Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 24,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            Focus Filter
          </Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 14,
              textAlign: "center",
              marginTop: 12,
              lineHeight: 22,
            }}
          >
            Each correct tap SWITCHES the rule!{"\n"}
            Even → Odd → Prime → ÷3 → {">"} 50 → {"<"} 20{"\n"}
            Stay sharp and keep up!
          </Text>
          {/* Challenge previews */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
              marginTop: 20,
            }}
          >
            {CHALLENGES.map((c) => (
              <View
                key={c.id}
                style={{
                  backgroundColor: c.color + "20",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: c.color + "50",
                }}
              >
                <Text
                  style={{ color: c.color, fontSize: 13, fontWeight: "700" }}
                >
                  {c.emoji} {c.label}
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            onPress={startGame}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 14,
              paddingVertical: 16,
              paddingHorizontal: 48,
              marginTop: 32,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              Start
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── PLAYING ── */}
      {gameState === "playing" && (
        <Animated.View style={{ flex: 1, opacity: flashAnim }}>
          {/* Timer bar */}
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text
                style={{ color: timerColor, fontSize: 13, fontWeight: "700" }}
              >
                {timeLeft}s
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Text
                  style={{ color: "#10B981", fontSize: 12, fontWeight: "600" }}
                >
                  ✅ {correct}
                </Text>
                <Text
                  style={{
                    color: COLORS.error,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  ❌ {wrong}
                </Text>
                {streak >= 2 && (
                  <Text
                    style={{
                      color: "#F59E0B",
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    🔥 {streak}
                  </Text>
                )}
              </View>
            </View>
            <View
              style={{
                height: 5,
                backgroundColor: COLORS.border,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 5,
                  width: `${timerProgress * 100}%`,
                  backgroundColor: timerColor,
                  borderRadius: 3,
                }}
              />
            </View>
          </View>

          {/* Challenge label — big & animated */}
          <View
            style={{
              alignItems: "center",
              marginBottom: 14,
              paddingHorizontal: 20,
            }}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    scale: labelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                    }),
                  },
                ],
                opacity: labelAnim,
                backgroundColor: challenge.color + "20",
                borderRadius: 16,
                paddingVertical: 12,
                paddingHorizontal: 28,
                borderWidth: 2,
                borderColor: challenge.color,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: challenge.color,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                TAP ALL
              </Text>
              <Text
                style={{
                  color: challenge.color,
                  fontSize: 30,
                  fontWeight: "900",
                  marginTop: 2,
                }}
              >
                {challenge.emoji} {challenge.label}
              </Text>
              <Text
                style={{
                  color: challenge.color + "AA",
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {challenge.desc}
              </Text>
            </Animated.View>
          </View>

          {/* Number grid */}
          <View
            style={{
              paddingHorizontal: 20,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
            }}
          >
            {grid.map((num, i) => {
              const isTapped = tapped.has(i);
              const isCorrectNum = challenge.check(num);
              let bg = COLORS.card;
              let border = COLORS.border;
              let textColor = COLORS.text;
              if (isTapped) {
                bg = isCorrectNum ? "#10B981" + "30" : COLORS.error + "30";
                border = isCorrectNum ? "#10B981" : COLORS.error;
                textColor = isCorrectNum ? "#10B981" : COLORS.error;
              }
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleTap(num, i)}
                  activeOpacity={0.7}
                  disabled={isTapped}
                  style={{
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    borderRadius: 16,
                    backgroundColor: bg,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: border,
                  }}
                >
                  <Text
                    style={{
                      color: textColor,
                      fontSize: 28,
                      fontWeight: "800",
                    }}
                  >
                    {num}
                  </Text>
                  {isTapped && (
                    <Text style={{ fontSize: 14, marginTop: 2 }}>
                      {isCorrectNum ? "✅" : "❌"}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Challenge sequence indicator */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
              marginTop: 16,
              paddingHorizontal: 20,
            }}
          >
            {CHALLENGES.map((c, i) => (
              <View
                key={c.id}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    i === challengeIdx ? c.color : c.color + "30",
                }}
              />
            ))}
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 6,
              gap: 6,
              paddingHorizontal: 20,
            }}
          >
            {CHALLENGES.map((c, i) => (
              <View key={c.id} style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 10,
                    color:
                      i === challengeIdx
                        ? c.color
                        : COLORS.textSecondary + "60",
                  }}
                >
                  {c.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* ── DONE ── */}
      {gameState === "done" && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 8 }}>🎯</Text>
            <Text
              style={{ color: COLORS.text, fontSize: 24, fontWeight: "800" }}
            >
              Results
            </Text>

            {/* Main stat */}
            <Text
              style={{
                color: COLORS.secondary,
                fontSize: 52,
                fontWeight: "900",
                marginTop: 8,
              }}
            >
              {accuracy}%
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Accuracy
            </Text>

            {/* Secondary stats */}
            <View style={{ flexDirection: "row", gap: 20, marginTop: 16 }}>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{ color: "#10B981", fontSize: 26, fontWeight: "800" }}
                >
                  {correct}
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                  Correct
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    color: COLORS.error,
                    fontSize: 26,
                    fontWeight: "800",
                  }}
                >
                  {wrong}
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                  Wrong
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{ color: "#F59E0B", fontSize: 26, fontWeight: "800" }}
                >
                  {bestStreak}
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                  Best Streak 🔥
                </Text>
              </View>
            </View>

            {/* XP */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 20,
                gap: 6,
              }}
            >
              <Zap color={COLORS.highlight} size={18} />
              <Text
                style={{
                  color: COLORS.highlight,
                  fontSize: 22,
                  fontWeight: "700",
                }}
              >
                +{xpEarned} XP
              </Text>
            </View>

            <TouchableOpacity
              onPress={startGame}
              style={{
                backgroundColor: COLORS.primary,
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
