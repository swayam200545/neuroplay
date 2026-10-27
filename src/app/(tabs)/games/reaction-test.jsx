import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw, Zap, AlertTriangle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const ROUNDS = 7;

const COLOR_POOL = [
  { name: "RED", hex: "#EF4444" },
  { name: "BLUE", hex: "#3B82F6" },
  { name: "GREEN", hex: "#22C55E" },
  { name: "YELLOW", hex: "#EAB308" },
  { name: "PURPLE", hex: "#A855F7" },
  { name: "ORANGE", hex: "#F97316" },
  { name: "PINK", hex: "#EC4899" },
  { name: "TEAL", hex: "#14B8A6" },
];

// How long each full-screen color stays (ms)
const HOLD_MIN = 900;
const HOLD_MAX = 2000;

const STATES = {
  IDLE: "idle",
  INTRO: "intro", // brief "get ready" before cycling
  CYCLING: "cycling", // colors flashing full screen
  CORRECT: "correct", // tapped at right moment
  MISS: "miss", // tapped wrong color
  DONE: "done",
};

function getRating(ms) {
  if (ms < 260) return { label: "⚡ LIGHTNING", color: "#EAB308" };
  if (ms < 420) return { label: "🔥 BLAZING", color: "#F97316" };
  if (ms < 650) return { label: "✓ SHARP", color: "#22C55E" };
  if (ms < 950) return { label: "👌 GOOD", color: "#3B82F6" };
  return { label: "🐢 SLOW", color: COLORS.textSecondary };
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build color sequence: target appears at a random position (never first)
function buildSequence(target, totalSlots = 6) {
  const others = shuffleArray(COLOR_POOL.filter((c) => c.name !== target.name));
  const seq = others.slice(0, totalSlots - 1);
  const insertAt = 1 + Math.floor(Math.random() * seq.length);
  seq.splice(insertAt, 0, target);
  return seq;
}

export default function ReactionTest() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [gameState, setGameState] = useState(STATES.IDLE);
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState([]);
  const [penalties, setPenalties] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [bonusXP, setBonusXP] = useState(0);

  const [targetColor, setTargetColor] = useState(COLOR_POOL[2]); // GREEN default
  const [currentBg, setCurrentBg] = useState(COLOR_POOL[0]);
  const [sequence, setSequence] = useState([]);
  const [seqIdx, setSeqIdx] = useState(0);

  const correctTimestamp = useRef(0);
  const cycleRef = useRef(null);
  const flashAnim = useRef(new Animated.Value(1)).current;

  const clearTimers = () => {
    if (cycleRef.current) clearTimeout(cycleRef.current);
  };

  // Flash animation between colors
  const flash = useCallback(() => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0.75,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [flashAnim]);

  // Advance one step in the sequence
  const advanceColor = useCallback(
    (seq, idx, target) => {
      if (idx >= seq.length) {
        // Player missed — didn't tap in time
        setPenalties((p) => p + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setGameState(STATES.MISS);
        return;
      }

      const color = seq[idx];
      setCurrentBg(color);
      setSeqIdx(idx);
      flash();

      if (color.name === target.name) {
        correctTimestamp.current = Date.now();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      const hold = HOLD_MIN + Math.random() * (HOLD_MAX - HOLD_MIN);
      cycleRef.current = setTimeout(() => {
        advanceColor(seq, idx + 1, target);
      }, hold);
    },
    [flash],
  );

  const startRound = useCallback(() => {
    clearTimers();
    const target = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
    const seq = buildSequence(target, 6);
    setTargetColor(target);
    setCurrentBg(COLOR_POOL[0]);
    setSequence(seq);
    setSeqIdx(0);
    setGameState(STATES.INTRO);

    // Brief intro pause
    cycleRef.current = setTimeout(() => {
      setGameState(STATES.CYCLING);
      advanceColor(seq, 0, target);
    }, 1000);
  }, [advanceColor]);

  const handleTap = useCallback(() => {
    // Continue from result/miss screens
    if (gameState === STATES.CORRECT || gameState === STATES.MISS) {
      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound >= ROUNDS) {
        finishGame();
      } else {
        startRound();
      }
      return;
    }

    // Only react during active cycling
    if (gameState !== STATES.CYCLING) return;
    clearTimers();

    if (currentBg.name === targetColor.name) {
      const rt = Date.now() - correctTimestamp.current;
      setCurrentTime(rt);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimes((prev) => [...prev, rt]);
      setGameState(STATES.CORRECT);
    } else {
      // Wrong color
      setPenalties((p) => p + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGameState(STATES.MISS);
    }
  }, [gameState, currentBg, targetColor, round, startRound]);

  const finishGame = useCallback(() => {
    setTimes((prev) => {
      const all = [...prev];
      if (all.length === 0) {
        setXpEarned(30);
        recordGameResult("reaction-test", 0, 30);
        setGameState(STATES.DONE);
        return prev;
      }
      const avg = Math.round(all.reduce((a, b) => a + b, 0) / all.length);
      const penaltyDeduction = penalties * 20;
      const baseXP = Math.max(20, Math.round(300 - avg * 0.3));
      const bonus = all.filter((t) => t < 260).length * 25;
      const xp = Math.max(10, baseXP + bonus - penaltyDeduction);
      setBonusXP(bonus);
      setXpEarned(xp);
      recordGameResult("reaction-test", avg, xp);
      setGameState(STATES.DONE);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return prev;
    });
  }, [penalties, recordGameResult]);

  const resetGame = () => {
    clearTimers();
    setGameState(STATES.IDLE);
    setRound(0);
    setTimes([]);
    setCurrentTime(0);
    setXpEarned(0);
    setPenalties(0);
    setBonusXP(0);
    setCurrentBg(COLOR_POOL[0]);
    setSequence([]);
    setSeqIdx(0);
  };

  useEffect(() => () => clearTimers(), []);

  const avg =
    times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;
  const rating = getRating(currentTime);

  const isActive =
    gameState === STATES.INTRO ||
    gameState === STATES.CYCLING ||
    gameState === STATES.CORRECT ||
    gameState === STATES.MISS;

  const headerTextColor = isActive ? "#fff" : COLORS.text;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: insets.top,
      }}
    >
      {/* ── HEADER (always visible) ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            clearTimers();
            router.back();
          }}
          style={{ marginRight: 12 }}
        >
          <ArrowLeft color={headerTextColor} size={24} />
        </TouchableOpacity>
        <Text
          style={{
            color: headerTextColor,
            fontSize: 20,
            fontWeight: "700",
            flex: 1,
          }}
        >
          Reaction Test
        </Text>
        <TouchableOpacity onPress={resetGame}>
          <RotateCcw
            color={isActive ? "rgba(255,255,255,0.7)" : COLORS.textSecondary}
            size={22}
          />
        </TouchableOpacity>
      </View>

      {/* Round dots */}
      <View
        style={{
          flexDirection: "row",
          gap: 6,
          marginBottom: 10,
          paddingHorizontal: 20,
        }}
      >
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor:
                i < round
                  ? isActive
                    ? "rgba(255,255,255,0.65)"
                    : COLORS.secondary
                  : i === round && gameState !== STATES.DONE
                    ? isActive
                      ? "#fff"
                      : COLORS.primary
                    : isActive
                      ? "rgba(255,255,255,0.2)"
                      : COLORS.border,
            }}
          />
        ))}
      </View>

      {/* Penalties */}
      {penalties > 0 && gameState !== STATES.DONE && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
            gap: 6,
          }}
        >
          <AlertTriangle color={isActive ? "#fff" : COLORS.error} size={13} />
          <Text
            style={{
              color: isActive ? "#fff" : COLORS.error,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {penalties} miss{penalties > 1 ? "es" : ""} · -{penalties * 20} XP
          </Text>
        </View>
      )}

      {/* ── IDLE ── */}
      {gameState === STATES.IDLE && (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={() => {
              setRound(0);
              setTimes([]);
              setPenalties(0);
              startRound();
            }}
            activeOpacity={0.88}
            style={{
              flex: 1,
              backgroundColor: COLORS.card,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🎨</Text>
            <Text
              style={{ color: COLORS.text, fontSize: 26, fontWeight: "800" }}
            >
              Tap to Start
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                marginTop: 12,
                textAlign: "center",
                paddingHorizontal: 28,
                lineHeight: 22,
              }}
            >
              {ROUNDS} rounds · The screen flashes different colors.{"\n"}Tap
              the screen ONLY when you see{"\n"}the TARGET color!
            </Text>
            {/* Color preview row */}
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 24,
                justifyContent: "center",
                flexWrap: "wrap",
                paddingHorizontal: 30,
              }}
            >
              {COLOR_POOL.map((c) => (
                <View key={c.name} style={{ alignItems: "center", gap: 4 }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: c.hex,
                    }}
                  />
                  <Text style={{ color: COLORS.textSecondary, fontSize: 9 }}>
                    {c.name}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── ACTIVE (full-screen color) ── */}
      {isActive && (
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: currentBg.hex,
            opacity: flashAnim,
          }}
        >
          <Pressable
            onPress={handleTap}
            style={{
              flex: 1,
              justifyContent: "space-between",
              paddingTop: 10,
              paddingBottom: 30,
              paddingHorizontal: 20,
            }}
          >
            {/* Target label */}
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.32)",
                  borderRadius: 20,
                  paddingHorizontal: 22,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 11,
                    fontWeight: "700",
                    textAlign: "center",
                    letterSpacing: 1,
                  }}
                >
                  TAP WHEN YOU SEE
                </Text>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 30,
                    fontWeight: "900",
                    textAlign: "center",
                    marginTop: 4,
                    letterSpacing: 2,
                  }}
                >
                  {targetColor.name}
                </Text>
              </View>
            </View>

            {/* Center message */}
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {gameState === STATES.INTRO && (
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{ color: "rgba(255,255,255,0.4)", fontSize: 60 }}
                  >
                    🎯
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 22,
                      fontWeight: "800",
                      marginTop: 16,
                    }}
                  >
                    Get Ready…
                  </Text>
                </View>
              )}

              {gameState === STATES.CYCLING && (
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 60,
                      fontWeight: "900",
                      letterSpacing: 3,
                    }}
                  >
                    {currentBg.name}
                  </Text>
                  {currentBg.name === targetColor.name ? (
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 20,
                        fontWeight: "800",
                        marginTop: 12,
                        backgroundColor: "rgba(0,0,0,0.35)",
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 12,
                      }}
                    >
                      👆 TAP NOW!
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: 15,
                        marginTop: 10,
                      }}
                    >
                      Wait for {targetColor.name}…
                    </Text>
                  )}
                </View>
              )}

              {gameState === STATES.CORRECT && (
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 60 }}>✅</Text>
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 52,
                      fontWeight: "900",
                      marginTop: 8,
                    }}
                  >
                    {currentTime}ms
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 18,
                      fontWeight: "700",
                    }}
                  >
                    {rating.label}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 13,
                      marginTop: 12,
                    }}
                  >
                    Round {round + 1}/{ROUNDS} · Tap to continue
                  </Text>
                </View>
              )}

              {gameState === STATES.MISS && (
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 60 }}>❌</Text>
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 26,
                      fontWeight: "900",
                      marginTop: 8,
                    }}
                  >
                    {currentBg.name !== targetColor.name
                      ? "Wrong Color!"
                      : "Too Slow!"}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 14,
                      marginTop: 6,
                    }}
                  >
                    -20 XP penalty
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 13,
                      marginTop: 16,
                    }}
                  >
                    Tap to continue
                  </Text>
                </View>
              )}
            </View>

            {/* Sequence progress dots */}
            <View
              style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              {sequence.map((c, i) => (
                <View
                  key={i}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor:
                      i < seqIdx
                        ? "rgba(255,255,255,0.25)"
                        : i === seqIdx
                          ? "#fff"
                          : "rgba(255,255,255,0.12)",
                    borderWidth: c.name === targetColor.name ? 2.5 : 0,
                    borderColor: "#fff",
                  }}
                />
              ))}
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* ── DONE ── */}
      {gameState === STATES.DONE && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 28,
              padding: 28,
              alignItems: "center",
              width: "100%",
            }}
          >
            <Zap color={COLORS.secondary} size={44} />
            <Text
              style={{
                color: COLORS.text,
                fontSize: 24,
                fontWeight: "800",
                marginTop: 12,
              }}
            >
              Results
            </Text>
            <Text
              style={{
                color: COLORS.secondary,
                fontSize: 52,
                fontWeight: "800",
                marginTop: 6,
              }}
            >
              {avg}ms
            </Text>
            <Text
              style={{
                color: getRating(avg).color,
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              {getRating(avg).label}
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              Average Reaction Time
            </Text>

            {/* Per-round breakdown */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 16,
                justifyContent: "center",
              }}
            >
              {times.map((t, i) => {
                const r = getRating(t);
                return (
                  <View
                    key={i}
                    style={{
                      backgroundColor: COLORS.cardLight || COLORS.background,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                      R{i + 1}
                    </Text>
                    <Text
                      style={{
                        color: r.color,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {t}ms
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* XP Breakdown */}
            <View
              style={{
                backgroundColor: COLORS.background,
                borderRadius: 12,
                padding: 14,
                marginTop: 16,
                width: "100%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                  Base XP
                </Text>
                <Text style={{ color: COLORS.text, fontSize: 12 }}>
                  +{Math.max(20, Math.round(300 - avg * 0.3))}
                </Text>
              </View>
              {bonusXP > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <Text style={{ color: COLORS.secondary, fontSize: 12 }}>
                    ⚡ Lightning bonus
                  </Text>
                  <Text style={{ color: COLORS.secondary, fontSize: 12 }}>
                    +{bonusXP}
                  </Text>
                </View>
              )}
              {penalties > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <Text style={{ color: COLORS.error, fontSize: 12 }}>
                    Miss penalties
                  </Text>
                  <Text style={{ color: COLORS.error, fontSize: 12 }}>
                    -{penalties * 20}
                  </Text>
                </View>
              )}
              <View
                style={{
                  height: 1,
                  backgroundColor: COLORS.border,
                  marginVertical: 8,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  Total
                </Text>
                <Text
                  style={{
                    color: COLORS.highlight,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  +{xpEarned}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={resetGame}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 40,
                marginTop: 20,
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
