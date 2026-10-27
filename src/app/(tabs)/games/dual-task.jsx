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
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const { width, height } = Dimensions.get("window");
const GAME_DURATION = 30;
const DIGIT_SHOW_DURATION = 2500; // ms to show digits before hiding
const TARGET_SIZE = 56;
const COLOR = "#F97316";

function generateDigits(len = 4) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join(
    "",
  );
}

function generateTarget() {
  const colors = ["#F97316", "#3B82F6", "#22C55E"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const leftPad = 60;
  const rightPad = 60;
  const topPad = 200;
  const bottomPad = 200;
  return {
    id: Math.random(),
    color,
    x: leftPad + Math.random() * (width - leftPad - rightPad - TARGET_SIZE),
    y: topPad + Math.random() * (height - topPad - bottomPad - TARGET_SIZE),
    dx: (Math.random() - 0.5) * 3,
    dy: (Math.random() - 0.5) * 3,
    alive: true,
  };
}

export default function DualTask() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [phase, setPhase] = useState("memorize"); // memorize | play | recall | result
  const [digits, setDigits] = useState(() => generateDigits(4));
  const [targets, setTargets] = useState([]);
  const [tapped, setTapped] = useState(0);
  const [missed, setMissed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [recallInput, setRecallInput] = useState("");
  const [score, setScore] = useState(null);
  const [xpEarned, setXpEarned] = useState(0);
  const animFrame = useRef(null);
  const targetsRef = useRef([]);
  const tappedRef = useRef(0);
  const missedRef = useRef(0);

  // Memorize phase → play phase
  useEffect(() => {
    if (phase !== "memorize") return;
    const t = setTimeout(() => {
      const initial = [generateTarget(), generateTarget(), generateTarget()];
      targetsRef.current = initial;
      setTargets([...initial]);
      setPhase("play");
    }, DIGIT_SHOW_DURATION);
    return () => clearTimeout(t);
  }, [phase]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setPhase("recall");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Spawn new targets occasionally
  useEffect(() => {
    if (phase !== "play") return;
    const spawnId = setInterval(() => {
      if (targetsRef.current.filter((t) => t.alive).length < 4) {
        const nt = generateTarget();
        targetsRef.current = [...targetsRef.current, nt];
      }
    }, 2000);
    return () => clearInterval(spawnId);
  }, [phase]);

  // Animate targets
  useEffect(() => {
    if (phase !== "play") return;
    let last = Date.now();
    const loop = () => {
      const now = Date.now();
      const dt = (now - last) / 16;
      last = now;
      targetsRef.current = targetsRef.current
        .filter((t) => t.alive)
        .map((t) => {
          let nx = t.x + t.dx * dt;
          let ny = t.y + t.dy * dt;
          let ndx = t.dx;
          let ndy = t.dy;
          if (nx < 0 || nx > width - TARGET_SIZE) {
            ndx = -ndx;
            nx = Math.max(0, Math.min(width - TARGET_SIZE, nx));
          }
          if (ny < 160 || ny > height - TARGET_SIZE - 100) {
            ndy = -ndy;
            ny = Math.max(160, Math.min(height - TARGET_SIZE - 100, ny));
          }
          return { ...t, x: nx, y: ny, dx: ndx, dy: ndy };
        });
      setTargets([...targetsRef.current]);
      animFrame.current = requestAnimationFrame(loop);
    };
    animFrame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame.current);
  }, [phase]);

  const tapTarget = useCallback((id, targetColor) => {
    if (targetColor === "#F97316") {
      tappedRef.current += 1;
      setTapped(tappedRef.current);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      missedRef.current += 1;
      setMissed(missedRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    targetsRef.current = targetsRef.current.filter((t) => t.id !== id);
    setTargets([...targetsRef.current]);
  }, []);

  const handleRecall = (digit) => {
    const next = recallInput + digit;
    setRecallInput(next);
    if (next.length === digits.length) {
      const correct =
        next === digits
          ? digits.length
          : [...next].filter((c, i) => c === digits[i]).length;
      const hitScore = Math.min(100, Math.round(tappedRef.current * 8));
      const recallScore = Math.round((correct / digits.length) * 40);
      const penaltyScore = Math.max(0, missedRef.current * 5);
      const finalScore = Math.max(
        0,
        Math.min(100, hitScore + recallScore - penaltyScore),
      );
      const xp = Math.round((finalScore / 100) * 300 + 80);
      setScore(finalScore);
      setXpEarned(xp);
      recordGameResult("dual-task", finalScore, xp);
      setPhase("result");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const resetGame = () => {
    cancelAnimationFrame(animFrame.current);
    targetsRef.current = [];
    tappedRef.current = 0;
    missedRef.current = 0;
    setDigits(generateDigits(4));
    setTargets([]);
    setTapped(0);
    setMissed(0);
    setTimeLeft(GAME_DURATION);
    setRecallInput("");
    setScore(null);
    setXpEarned(0);
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
            cancelAnimationFrame(animFrame.current);
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
          Dual Task
        </Text>
        <TouchableOpacity onPress={resetGame}>
          <RotateCcw color={COLORS.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      {/* MEMORIZE phase */}
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
              marginBottom: 20,
            }}
          >
            Memorize this number!
          </Text>
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 24,
              padding: 32,
              alignItems: "center",
              borderWidth: 2,
              borderColor: COLOR + "50",
            }}
          >
            <Text
              style={{
                color: COLOR,
                fontSize: 64,
                fontWeight: "900",
                letterSpacing: 12,
              }}
            >
              {digits}
            </Text>
          </View>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 13,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            Then tap the 🟠 orange targets — ignore blue and green!
          </Text>
        </View>
      )}

      {/* PLAY phase */}
      {phase === "play" && (
        <>
          {/* Stats bar */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 20,
              gap: 8,
              marginBottom: 8,
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
              <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                Time
              </Text>
              <Text
                style={{
                  color: timeLeft <= 5 ? COLORS.error : COLORS.text,
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                {timeLeft}s
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
                Hits
              </Text>
              <Text
                style={{
                  color: COLORS.success,
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                {tapped}
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
                Misses
              </Text>
              <Text
                style={{ color: COLORS.error, fontSize: 18, fontWeight: "700" }}
              >
                {missed}
              </Text>
            </View>
          </View>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 11,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            🟠 Tap orange only!
          </Text>
          {/* Targets */}
          {targets.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => tapTarget(t.id, t.color)}
              style={{
                position: "absolute",
                left: t.x,
                top: t.y,
                width: TARGET_SIZE,
                height: TARGET_SIZE,
                borderRadius: TARGET_SIZE / 2,
                backgroundColor: t.color,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: t.color,
                shadowOpacity: 0.6,
                shadowRadius: 10,
              }}
            >
              <Text style={{ fontSize: 22 }}>
                {t.color === "#F97316"
                  ? "🟠"
                  : t.color === "#3B82F6"
                    ? "🔵"
                    : "🟢"}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* RECALL phase */}
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
              color: COLORS.text,
              fontSize: 22,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            What was the number?
          </Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            You hit {tapped} orange targets!
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 30 }}>
            {Array.from({ length: digits.length }).map((_, i) => (
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
          {/* Number pad */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
              maxWidth: 260,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "←", 0, "✓"].map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => {
                  if (k === "←") {
                    setRecallInput((r) => r.slice(0, -1));
                  } else if (k === "✓") {
                    if (recallInput.length === digits.length) handleRecall("");
                  } else {
                    if (recallInput.length < digits.length)
                      handleRecall(String(k));
                  }
                }}
                style={{
                  width: 72,
                  height: 52,
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
        </View>
      )}

      {/* RESULT overlay */}
      {phase === "result" && (
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
              {score >= 70 ? "🔥" : score >= 40 ? "👍" : "💡"}
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 26, fontWeight: "800" }}
            >
              Score: {score}
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginTop: 6,
              }}
            >
              {tapped} hits · {missed} misses · recalled{" "}
              {[...recallInput].filter((c, i) => c === digits[i]).length}/
              {digits.length} digits
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
