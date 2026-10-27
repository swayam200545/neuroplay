import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw, Star, Delete } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

// ─── Helpers ─────────────────────────────────────────────
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
  return true;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateNumber(digits) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Challenge types
const CHALLENGE_TYPES = [
  {
    id: "recall",
    label: "Number Recall",
    icon: "🔢",
    desc: "See a number, type it back",
  },
  { id: "even", label: "Find Even", icon: "➕", desc: "Tap all EVEN numbers" },
  { id: "odd", label: "Find Odd", icon: "🔵", desc: "Tap all ODD numbers" },
  {
    id: "prime",
    label: "Find Primes",
    icon: "⭐",
    desc: "Tap all PRIME numbers",
  },
  {
    id: "largest",
    label: "Largest Number",
    icon: "📈",
    desc: "Tap the LARGEST number",
  },
  {
    id: "smallest",
    label: "Smallest Number",
    icon: "📉",
    desc: "Tap the SMALLEST number",
  },
  {
    id: "divisible",
    label: "Divisible by 3",
    icon: "÷",
    desc: "Tap numbers divisible by 3",
  },
  {
    id: "square",
    label: "Perfect Squares",
    icon: "🟦",
    desc: "Tap perfect square numbers",
  },
];

// Generate a grid challenge (even/odd/prime/divisible/square)
function generateGridChallenge(type, round) {
  const count = 9; // 3×3 grid
  const numDigits = Math.min(2 + Math.floor(round / 4), 3);
  const pool = [];
  while (pool.length < count) {
    const n =
      Math.floor(Math.random() * (numDigits === 2 ? 90 : 900)) +
      (numDigits === 2 ? 10 : 100);
    if (!pool.includes(n)) pool.push(n);
  }

  let correctFn;
  if (type === "even") correctFn = (n) => n % 2 === 0;
  else if (type === "odd") correctFn = (n) => n % 2 !== 0;
  else if (type === "prime") correctFn = isPrime;
  else if (type === "divisible") correctFn = (n) => n % 3 === 0;
  else if (type === "square") correctFn = (n) => Math.sqrt(n) % 1 === 0;

  // Ensure at least 2 correct answers
  let nums = shuffleArray(pool);
  const hasEnough = nums.filter(correctFn).length >= 2;
  if (!hasEnough) {
    // Replace some slots with guaranteed correct ones
    const safeCorrects =
      type === "even"
        ? [12, 24, 36, 48, 60, 72, 84, 96]
        : type === "odd"
          ? [11, 13, 17, 19, 23, 29, 31, 37]
          : type === "prime"
            ? [11, 13, 17, 19, 23, 29, 31, 37, 41, 43]
            : type === "divisible"
              ? [12, 21, 33, 45, 57, 63, 72, 81]
              : [16, 25, 36, 49, 64, 81, 100];
    nums[0] = safeCorrects[Math.floor(Math.random() * safeCorrects.length)];
    nums[1] = safeCorrects[Math.floor(Math.random() * safeCorrects.length)];
    nums = shuffleArray(nums);
  }

  const correctSet = new Set(nums.filter(correctFn));
  return { nums, correctSet };
}

// Generate largest/smallest challenge
function generateRankChallenge(type, round) {
  const count = 6;
  const numDigits = Math.min(2 + Math.floor(round / 3), 4);
  const pool = new Set();
  while (pool.size < count) {
    pool.add(generateNumber(numDigits));
  }
  const nums = shuffleArray([...pool]);
  const correctNum = type === "largest" ? Math.max(...nums) : Math.min(...nums);
  return { nums, correctNum };
}

const DISPLAY_TIME = 1200;

export default function NumberRecall() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [gameState, setGameState] = useState("idle");
  const [challengeType, setChallengeType] = useState(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  // Recall mode state
  const [currentNumber, setCurrentNumber] = useState("");
  const [userInput, setUserInput] = useState("");
  const [showingNumber, setShowingNumber] = useState(false);
  const [digits, setDigits] = useState(3);
  const timerAnim = useRef(new Animated.Value(1)).current;
  const timerAnimRef = useRef(null);
  const timeoutRef = useRef(null);

  // Grid/rank mode state
  const [gridNums, setGridNums] = useState([]);
  const [correctSet, setCorrectSet] = useState(new Set());
  const [correctNum, setCorrectNum] = useState(null);
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const MAX_ROUNDS = 8;

  const pickRandomType = () => {
    const t =
      CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
    return t.id;
  };

  const startGame = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (timerAnimRef.current) timerAnimRef.current.stop();
    setGameState("chooser");
    setRound(0);
    setScore(0);
    setDigits(3);
    setUserInput("");
    setSelected([]);
    setSubmitted(false);
  }, []);

  const startWithType = (type) => {
    setChallengeType(type);
    setRound(0);
    setScore(0);
    setDigits(3);
    setUserInput("");
    setSelected([]);
    setSubmitted(false);
    setGameState("playing");
    startNewChallenge(type, 0, 3);
  };

  const startNewChallenge = (type, roundNum, numDigits) => {
    setUserInput("");
    setSelected([]);
    setSubmitted(false);

    if (type === "recall") {
      const num = generateNumber(numDigits).toString();
      setCurrentNumber(num);
      setShowingNumber(true);
      timerAnim.setValue(1);
      const dur = DISPLAY_TIME + (numDigits - 3) * 120;
      timerAnimRef.current = Animated.timing(timerAnim, {
        toValue: 0,
        duration: dur,
        useNativeDriver: false,
      });
      timerAnimRef.current.start();
      timeoutRef.current = setTimeout(() => setShowingNumber(false), dur);
    } else if (type === "largest" || type === "smallest") {
      const { nums, correctNum: cn } = generateRankChallenge(type, roundNum);
      setGridNums(nums);
      setCorrectNum(cn);
    } else {
      const { nums, correctSet: cs } = generateGridChallenge(type, roundNum);
      setGridNums(nums);
      setCorrectSet(cs);
    }
  };

  const handleRecallSubmit = () => {
    if (userInput === currentNumber) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newScore = score + 1;
      setScore(newScore);
      const newRound = round + 1;
      if (newRound >= MAX_ROUNDS) return endGame(newScore);
      const newDigits = digits + 1;
      setRound(newRound);
      setDigits(newDigits);
      startNewChallenge("recall", newRound, newDigits);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      endGame(score);
    }
  };

  const handleGridTap = (num) => {
    if (submitted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
    );
  };

  const handleGridSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const selSet = new Set(selected);
    const allCorrect = [...correctSet].every((n) => selSet.has(n));
    const noFalse = selected.every((n) => correctSet.has(n));
    const correct = allCorrect && noFalse;
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newScore = score + 1;
      setScore(newScore);
      setTimeout(() => {
        const newRound = round + 1;
        if (newRound >= MAX_ROUNDS) return endGame(newScore);
        setRound(newRound);
        startNewChallenge(challengeType, newRound, digits);
      }, 900);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => endGame(score), 1000);
    }
  };

  const handleRankTap = (num) => {
    if (submitted) return;
    setSubmitted(true);
    const correct = num === correctNum;
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newScore = score + 1;
      setScore(newScore);
      setTimeout(() => {
        const newRound = round + 1;
        if (newRound >= MAX_ROUNDS) return endGame(newScore);
        setRound(newRound);
        startNewChallenge(challengeType, newRound, digits);
      }, 700);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => endGame(score), 800);
    }
  };

  const endGame = (finalScore) => {
    const xp = Math.round(finalScore * 20 + 30);
    setXpEarned(xp);
    recordGameResult("number-recall", finalScore * 10, xp);
    setGameState("done");
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (timerAnimRef.current) timerAnimRef.current.stop();
    };
  }, []);

  const numPadKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["del", "0", "go"],
  ];

  const cfg = CHALLENGE_TYPES.find((c) => c.id === challengeType);

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
          onPress={() => router.back()}
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
          Number Recall
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
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🔢</Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 24,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Number Recall
          </Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 14,
              textAlign: "center",
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            8 challenge types!{"\n"}Choose your brain workout.
          </Text>
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

      {/* ── CHOOSER ── */}
      {gameState === "chooser" && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            Pick a challenge:
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {CHALLENGE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => startWithType(t.id)}
                style={{
                  width: "47%",
                  backgroundColor: COLORS.card,
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</Text>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {t.label}
                </Text>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  {t.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── PLAYING ── */}
      {gameState === "playing" && (
        <View style={{ flex: 1 }}>
          {/* Stats bar */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 20,
              marginBottom: 16,
              gap: 10,
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
              <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                Mode
              </Text>
              <Text
                style={{ color: COLORS.text, fontSize: 13, fontWeight: "700" }}
              >
                {cfg?.icon} {cfg?.label}
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
              <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                Round
              </Text>
              <Text
                style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}
              >
                {round + 1}/{MAX_ROUNDS}
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
              <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                Score
              </Text>
              <Text
                style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}
              >
                {score}
              </Text>
            </View>
          </View>

          {/* ─ RECALL mode ─ */}
          {challengeType === "recall" && (
            <View style={{ flex: 1 }}>
              <View
                style={{
                  alignItems: "center",
                  marginTop: 10,
                  minHeight: 130,
                  justifyContent: "center",
                }}
              >
                {showingNumber ? (
                  <>
                    <Text
                      style={{
                        color: COLORS.secondary,
                        fontSize: 13,
                        fontWeight: "600",
                        marginBottom: 8,
                      }}
                    >
                      Remember this number!
                    </Text>
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: 52,
                        fontWeight: "800",
                        letterSpacing: 8,
                      }}
                    >
                      {currentNumber}
                    </Text>
                    <View
                      style={{
                        width: 200,
                        height: 4,
                        backgroundColor: COLORS.border,
                        borderRadius: 2,
                        marginTop: 20,
                        overflow: "hidden",
                      }}
                    >
                      <Animated.View
                        style={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: COLORS.secondary,
                          width: timerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                        }}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Text
                      style={{
                        color: COLORS.primary,
                        fontSize: 13,
                        fontWeight: "600",
                        marginBottom: 8,
                      }}
                    >
                      Type the number
                    </Text>
                    <View
                      style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 16,
                        paddingHorizontal: 32,
                        paddingVertical: 16,
                        minWidth: 200,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text
                        style={{
                          color: userInput ? COLORS.text : COLORS.textSecondary,
                          fontSize: 36,
                          fontWeight: "700",
                          letterSpacing: 6,
                          minHeight: 44,
                        }}
                      >
                        {userInput || "..."}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {!showingNumber && (
                <View style={{ paddingHorizontal: 30, marginTop: 20, gap: 10 }}>
                  {numPadKeys.map((row, ri) => (
                    <View
                      key={ri}
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        justifyContent: "center",
                      }}
                    >
                      {row.map((key) => {
                        if (key === "del")
                          return (
                            <TouchableOpacity
                              key={key}
                              onPress={() =>
                                setUserInput((p) => p.slice(0, -1))
                              }
                              style={{
                                flex: 1,
                                height: 56,
                                borderRadius: 14,
                                backgroundColor: COLORS.card,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Delete color={COLORS.textSecondary} size={22} />
                            </TouchableOpacity>
                          );
                        if (key === "go")
                          return (
                            <TouchableOpacity
                              key={key}
                              onPress={handleRecallSubmit}
                              disabled={!userInput}
                              style={{
                                flex: 1,
                                height: 56,
                                borderRadius: 14,
                                backgroundColor: userInput
                                  ? COLORS.primary
                                  : COLORS.card,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text
                                style={{
                                  color: "#fff",
                                  fontSize: 16,
                                  fontWeight: "700",
                                }}
                              >
                                GO
                              </Text>
                            </TouchableOpacity>
                          );
                        return (
                          <TouchableOpacity
                            key={key}
                            onPress={() => {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                              setUserInput((p) => p + key);
                            }}
                            style={{
                              flex: 1,
                              height: 56,
                              borderRadius: 14,
                              backgroundColor: COLORS.card,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: COLORS.text,
                                fontSize: 22,
                                fontWeight: "700",
                              }}
                            >
                              {key}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ─ GRID modes (even/odd/prime/divisible/square) ─ */}
          {["even", "odd", "prime", "divisible", "square"].includes(
            challengeType,
          ) && (
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 13,
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                {cfg?.desc} — tap all that match, then submit
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  justifyContent: "center",
                }}
              >
                {gridNums.map((num, i) => {
                  const isSel = selected.includes(num);
                  const isCorrectNum = correctSet.has(num);
                  let bg = COLORS.card;
                  let border = COLORS.border;
                  if (submitted) {
                    if (isCorrectNum) {
                      bg = "#10B981" + "25";
                      border = "#10B981";
                    } else if (isSel) {
                      bg = COLORS.error + "25";
                      border = COLORS.error;
                    }
                  } else if (isSel) {
                    bg = COLORS.primary + "25";
                    border = COLORS.primary;
                  }
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleGridTap(num)}
                      style={{
                        width: "30%",
                        aspectRatio: 1,
                        borderRadius: 14,
                        backgroundColor: bg,
                        borderWidth: 2,
                        borderColor: border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.text,
                          fontSize: 20,
                          fontWeight: "700",
                        }}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!submitted && (
                <TouchableOpacity
                  onPress={handleGridSubmit}
                  style={{
                    backgroundColor:
                      selected.length > 0 ? COLORS.primary : COLORS.card,
                    borderRadius: 14,
                    paddingVertical: 14,
                    marginTop: 20,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color:
                        selected.length > 0 ? "#fff" : COLORS.textSecondary,
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Submit Answer
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ─ RANK modes (largest/smallest) ─ */}
          {["largest", "smallest"].includes(challengeType) && (
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 14,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                Tap the{" "}
                <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                  {challengeType}
                </Text>{" "}
                number!
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                  justifyContent: "center",
                }}
              >
                {gridNums.map((num, i) => {
                  const isC = num === correctNum;
                  let bg = COLORS.card;
                  let border = COLORS.border;
                  if (submitted) {
                    if (isC) {
                      bg = "#10B981" + "25";
                      border = "#10B981";
                    } else {
                      bg = COLORS.error + "15";
                    }
                  }
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleRankTap(num)}
                      disabled={submitted}
                      style={{
                        width: "45%",
                        paddingVertical: 18,
                        borderRadius: 16,
                        backgroundColor: bg,
                        borderWidth: 2,
                        borderColor: border,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.text,
                          fontSize: 26,
                          fontWeight: "800",
                        }}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── DONE ── */}
      {gameState === "done" && (
        <View
          style={{
            flex: 1,
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
            <Text style={{ fontSize: 48, marginBottom: 8 }}>
              {cfg?.icon || "🔢"}
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 24, fontWeight: "800" }}
            >
              Game Over
            </Text>
            <Text
              style={{
                color: COLORS.secondary,
                fontSize: 48,
                fontWeight: "800",
                marginTop: 8,
              }}
            >
              {score}/{MAX_ROUNDS}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
              {cfg?.label} · {Math.round((score / MAX_ROUNDS) * 100)}% accuracy
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 20,
                gap: 6,
              }}
            >
              <Star
                color={COLORS.highlight}
                size={18}
                fill={COLORS.highlight}
              />
              <Text
                style={{
                  color: COLORS.highlight,
                  fontSize: 20,
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
                Try Again
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
