import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const COLOR = "#FB7185";
const TOTAL_MATH = 20;
const MEMORY_QUIZ_EVERY = 5; // quiz memory every 5 correct math answers
const SHOW_NUMBERS_DURATION = 2500;

function genMath() {
  const ops = ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  if (op === "+") {
    a = Math.floor(Math.random() * 50) + 10;
    b = Math.floor(Math.random() * 40) + 5;
    answer = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 50) + 30;
    b = Math.floor(Math.random() * 25) + 5;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    answer = a * b;
  }
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const w = answer + (Math.floor(Math.random() * 20) - 10);
    if (w !== answer) wrongs.add(w);
  }
  return {
    expr: `${a} ${op} ${b}`,
    answer,
    options: [...wrongs, answer].sort(() => Math.random() - 0.5),
  };
}

function genMemoryNumbers() {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 90) + 10);
}

export default function ChaosMath() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [phase, setPhase] = useState("memorize"); // memorize | math | recall | result
  const [memNumbers, setMemNumbers] = useState(() => genMemoryNumbers());
  const [question, setQuestion] = useState(() => genMath());
  const [mathCount, setMathCount] = useState(0);
  const [mathCorrect, setMathCorrect] = useState(0);
  const [memoryCorrect, setMemoryCorrect] = useState(0);
  const [memoryTotal, setMemoryTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(8);
  const [recallTarget, setRecallTarget] = useState(null); // which of the 3 numbers to recall
  const [recallInput, setRecallInput] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [flashMsg, setFlashMsg] = useState("");
  const timerRef = useRef(null);
  const mathCountRef = useRef(0);
  const mathCorrectRef = useRef(0);
  const memoryCorrectRef = useRef(0);
  const memoryTotalRef = useRef(0);

  // Memorize phase
  useEffect(() => {
    if (phase !== "memorize") return;
    const t = setTimeout(() => {
      setPhase("math");
      startMathTimer();
    }, SHOW_NUMBERS_DURATION);
    return () => clearTimeout(t);
  }, [phase]);

  const startMathTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(8);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleMathAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleMathAnswer = (opt) => {
    clearInterval(timerRef.current);
    if (selected !== null) return;
    setSelected(opt);
    const wasCorrect = opt === question.answer;
    if (wasCorrect) {
      mathCorrectRef.current += 1;
      setMathCorrect(mathCorrectRef.current);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    mathCountRef.current += 1;
    setMathCount(mathCountRef.current);

    setTimeout(() => {
      if (mathCountRef.current >= TOTAL_MATH) {
        // Final result
        finishGame();
        return;
      }
      // Every MEMORY_QUIZ_EVERY correct math answers → memory quiz
      if (
        mathCorrectRef.current > 0 &&
        mathCorrectRef.current % MEMORY_QUIZ_EVERY === 0
      ) {
        const idx = Math.floor(Math.random() * 3);
        setRecallTarget(idx);
        setRecallInput("");
        setSelected(null);
        setPhase("recall");
      } else {
        setQuestion(genMath());
        setSelected(null);
        startMathTimer();
      }
    }, 700);
  };

  const finishGame = () => {
    const mathScore = mathCorrectRef.current;
    const memScore =
      memoryTotalRef.current > 0
        ? Math.round((memoryCorrectRef.current / memoryTotalRef.current) * 10)
        : 5;
    const finalScore = mathScore + memScore;
    const xp = Math.round((finalScore / (TOTAL_MATH + 10)) * 450 + 80);
    setXpEarned(xp);
    recordGameResult("chaos-math", finalScore, xp);
    setGameOver(true);
  };

  const handleRecallDigit = (d) => {
    if (d === "←") {
      setRecallInput((r) => r.slice(0, -1));
      return;
    }
    if (recallInput.length >= String(memNumbers[recallTarget]).length) return;
    const next = recallInput + d;
    setRecallInput(next);
    if (next.length === String(memNumbers[recallTarget]).length) {
      const correct = parseInt(next, 10) === memNumbers[recallTarget];
      if (correct) {
        memoryCorrectRef.current += 1;
        setMemoryCorrect(memoryCorrectRef.current);
        setFlashMsg("✅ Correct!");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        setFlashMsg(`❌ Was ${memNumbers[recallTarget]}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      memoryTotalRef.current += 1;
      setMemoryTotal(memoryTotalRef.current);
      setTimeout(() => {
        setFlashMsg("");
        if (mathCountRef.current >= TOTAL_MATH) {
          finishGame();
        } else {
          setQuestion(genMath());
          setSelected(null);
          setPhase("math");
          startMathTimer();
        }
      }, 900);
    }
  };

  const resetGame = () => {
    clearInterval(timerRef.current);
    mathCountRef.current = 0;
    mathCorrectRef.current = 0;
    memoryCorrectRef.current = 0;
    memoryTotalRef.current = 0;
    setMemNumbers(genMemoryNumbers());
    setQuestion(genMath());
    setMathCount(0);
    setMathCorrect(0);
    setMemoryCorrect(0);
    setMemoryTotal(0);
    setSelected(null);
    setTimeLeft(8);
    setRecallTarget(null);
    setRecallInput("");
    setGameOver(false);
    setXpEarned(0);
    setFlashMsg("");
    setPhase("memorize");
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
          Chaos Math
        </Text>
        <TouchableOpacity onPress={resetGame}>
          <RotateCcw color={COLORS.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      {phase === "memorize" && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 30,
          }}
        >
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            Hold these 3 numbers in your head!
          </Text>
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 20,
              padding: 28,
              alignItems: "center",
              gap: 12,
              borderWidth: 2,
              borderColor: COLOR + "40",
            }}
          >
            {memNumbers.map((n, i) => (
              <Text
                key={i}
                style={{ color: COLOR, fontSize: 48, fontWeight: "900" }}
              >
                {n}
              </Text>
            ))}
          </View>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 13,
              marginTop: 20,
              textAlign: "center",
            }}
          >
            Then solve rapid-fire math — but you'll be quizzed on these numbers!
          </Text>
        </View>
      )}

      {phase === "math" && (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.card,
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                Math
              </Text>
              <Text
                style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}
              >
                {mathCorrect}/{mathCount}
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
              <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                Memory
              </Text>
              <Text
                style={{
                  color: COLORS.success,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {memoryCorrect}/{memoryTotal}
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
              <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                Time
              </Text>
              <Text
                style={{
                  color: timeLeft <= 3 ? COLORS.error : COLORS.text,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {timeLeft}s
              </Text>
            </View>
          </View>

          {/* Math question */}
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 20,
              padding: 28,
              alignItems: "center",
              marginBottom: 20,
              borderWidth: 1,
              borderColor: COLOR + "30",
            }}
          >
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 11,
                marginBottom: 6,
              }}
            >
              Q {mathCount + 1}/{TOTAL_MATH}
            </Text>
            <Text style={{ color: COLOR, fontSize: 44, fontWeight: "900" }}>
              {question.expr}
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 24,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              = ?
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {question.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = opt === question.answer;
              let bg = COLORS.card;
              let border = COLORS.border;
              if (selected !== null) {
                if (isCorrect) {
                  bg = COLORS.success + "20";
                  border = COLORS.success;
                } else if (isSelected) {
                  bg = COLORS.error + "20";
                  border = COLORS.error;
                }
              }
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    if (selected === null) handleMathAnswer(opt);
                  }}
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    backgroundColor: bg,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: border,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 22,
                      fontWeight: "700",
                    }}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
              💾 Remember: {memNumbers.map((n) => "??").join(" · ")}
            </Text>
          </View>
        </View>
      )}

      {phase === "recall" && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 30,
          }}
        >
          <Text
            style={{
              color: COLOR,
              fontSize: 20,
              fontWeight: "800",
              marginBottom: 6,
            }}
          >
            🧠 Memory Check!
          </Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 14,
              marginBottom: 6,
            }}
          >
            What was number #{recallTarget + 1}?
          </Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 12,
              marginBottom: 20,
            }}
          >
            Numbers were:{" "}
            {memNumbers
              .map((_, i) => (i === recallTarget ? "??" : memNumbers[i]))
              .join(" · ")}
          </Text>
          {flashMsg ? (
            <Text
              style={{
                color: COLORS.text,
                fontSize: 20,
                fontWeight: "800",
                marginBottom: 12,
              }}
            >
              {flashMsg}
            </Text>
          ) : (
            <>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 24 }}>
                {Array.from({
                  length: String(memNumbers[recallTarget]).length,
                }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 52,
                      height: 64,
                      borderRadius: 12,
                      backgroundColor: COLORS.card,
                      borderWidth: 2,
                      borderColor: recallInput[i] ? COLOR : COLORS.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: 28,
                        fontWeight: "700",
                      }}
                    >
                      {recallInput[i] || ""}
                    </Text>
                  </View>
                ))}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                  maxWidth: 260,
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "←", 0].map((k) => (
                  <TouchableOpacity
                    key={k}
                    onPress={() => handleRecallDigit(String(k))}
                    style={{
                      width: 72,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: COLORS.card,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: 20,
                        fontWeight: "600",
                      }}
                    >
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}

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
              {mathCorrect >= 16 ? "🌋" : mathCorrect >= 10 ? "🔥" : "💡"}
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 26, fontWeight: "800" }}
            >
              Chaos Survived!
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginTop: 6,
              }}
            >
              Math: {mathCorrect}/{TOTAL_MATH} · Memory: {memoryCorrect}/
              {memoryTotal}
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
