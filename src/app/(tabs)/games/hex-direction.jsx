import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Star,
  Pause,
  Square,
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDown,
  ArrowDownRight,
  HelpCircle,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";
import Svg, { Polygon, Line, G } from "react-native-svg";

const { width, height: screenHeight } = Dimensions.get("window");

// 6 directions
const DIRECTIONS = [
  "up-left",
  "up",
  "up-right",
  "down-right",
  "down",
  "down-left",
];
const DIRECTION_LABELS = {
  "up-left": "↖",
  up: "↑",
  "up-right": "↗",
  "down-right": "↘",
  down: "↓",
  "down-left": "↙",
};
const DIRECTION_ICONS = {
  "up-left": ArrowUpLeft,
  up: ArrowUp,
  "up-right": ArrowUpRight,
  "down-right": ArrowDownRight,
  down: ArrowDown,
  "down-left": ArrowDownLeft,
};
const DIRECTION_NAMES = {
  "up-left": "Upper Left",
  up: "Up",
  "up-right": "Upper Right",
  "down-right": "Lower Right",
  down: "Down",
  "down-left": "Lower Left",
};

const TOTAL_ROUNDS = 15;
const TIME_PER_ROUND = 4;

// Bigger hexagons filling the space
const HEX_SIZE = 52;
const HEX_GAP_X = 112;
const HEX_GAP_Y = 100;
const SVG_WIDTH = width;
const SVG_HEIGHT = screenHeight * 0.46;
const GRID_CX = SVG_WIDTH / 2;
const GRID_CY = SVG_HEIGHT / 2;

const GRID_POSITIONS = [
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: 2 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
];

function hexPoints(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

function getHexCenter(index) {
  const pos = GRID_POSITIONS[index];
  const offsetX = pos.row % 2 === 1 ? HEX_GAP_X / 2 : 0;
  const x = GRID_CX - HEX_GAP_X + pos.col * HEX_GAP_X + offsetX;
  const y = GRID_CY - HEX_GAP_Y + pos.row * HEX_GAP_Y;
  return { x, y };
}

function generateRound() {
  const activeIndex = Math.floor(Math.random() * 9);
  const mainDirection =
    DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  const isBonus = Math.random() < 0.25;
  const hexDirections = GRID_POSITIONS.map(
    () => DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)],
  );
  hexDirections[activeIndex] = mainDirection;
  return { activeIndex, mainDirection, isBonus, hexDirections };
}

function getConnections() {
  const connections = [];
  for (let i = 0; i < 9; i++) {
    for (let j = i + 1; j < 9; j++) {
      const pi = GRID_POSITIONS[i];
      const pj = GRID_POSITIONS[j];
      const rowDiff = Math.abs(pi.row - pj.row);
      const colDiff = Math.abs(pi.col - pj.col);
      if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
        connections.push([i, j]);
      }
    }
  }
  return connections;
}

const CONNECTIONS = getConnections();

function getSlideOffset(dir) {
  if (dir === "up-left") return { x: -100, y: -70 };
  if (dir === "up") return { x: 0, y: -110 };
  if (dir === "up-right") return { x: 100, y: -70 };
  if (dir === "down-right") return { x: 100, y: 70 };
  if (dir === "down") return { x: 0, y: 110 };
  if (dir === "down-left") return { x: -100, y: 70 };
  return { x: 0, y: 0 };
}

function getArrowRotation(dir) {
  if (dir === "up") return 0;
  if (dir === "up-right") return 45;
  if (dir === "down-right") return 135;
  if (dir === "down") return 180;
  if (dir === "down-left") return -135;
  if (dir === "up-left") return -45;
  return 0;
}

export default function HexDirection() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [gameState, setGameState] = useState("idle");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
  const [xpEarned, setXpEarned] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [showWrongModal, setShowWrongModal] = useState(false);
  const [wrongInfo, setWrongInfo] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const timerRef = useRef(null);
  const progressData = useRef([]);

  const screenSlideX = useRef(new Animated.Value(0)).current;
  const screenSlideY = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;
  const scorePopOpacity = useRef(new Animated.Value(0)).current;
  const stickRotation = useRef(new Animated.Value(0)).current;
  const stickOpacity = useRef(new Animated.Value(0)).current;
  const roundFadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (gameState === "playing" && !answered) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [gameState, answered, round]);

  const handleTimeout = () => {
    if (answered) return;
    setAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setWrong((w) => w + 1);
    setLastResult("wrong");
    progressData.current.push("wrong");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 15,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -15,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    setWrongInfo({
      message: "Time ran out! Watch the arrow direction carefully.",
      correctDirection: DIRECTION_LABELS[currentRound.mainDirection],
      directionName: DIRECTION_NAMES[currentRound.mainDirection],
    });
    setShowWrongModal(true);
  };

  const startGame = useCallback(() => {
    const firstRound = generateRound();
    setRound(0);
    setScore(0);
    setCorrect(0);
    setWrong(0);
    setCurrentRound(firstRound);
    setTimeLeft(TIME_PER_ROUND);
    setXpEarned(0);
    setAnswered(false);
    setLastResult(null);
    setGameState("playing");
    progressData.current = [];
    screenSlideX.setValue(0);
    screenSlideY.setValue(0);
    screenOpacity.setValue(1);
    stickOpacity.setValue(0);
    stickRotation.setValue(0);
    roundFadeIn.setValue(0);
    Animated.timing(roundFadeIn, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const pauseGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("paused");
  };
  const resumeGame = () => setGameState("playing");
  const stopGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    finishGame();
  };

  const finishGame = () => {
    const totalAttempts = correct + wrong;
    const accuracy =
      totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
    const xp = Math.max(30, Math.round(score * 12 + accuracy * 0.5));
    setXpEarned(xp);
    setGameState("done");
    recordGameResult("hex-direction", score, xp);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const playDirectionSlide = (direction) => {
    const offset = getSlideOffset(direction);
    const rotDeg = getArrowRotation(direction);
    stickRotation.setValue(rotDeg);
    stickOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(screenSlideX, {
        toValue: offset.x,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(screenSlideY, {
        toValue: offset.y,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(screenOpacity, {
        toValue: 0.3,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      screenSlideX.setValue(0);
      screenSlideY.setValue(0);
      screenOpacity.setValue(1);
      stickOpacity.setValue(0);
    });
  };

  const handleDirectionPress = (direction) => {
    if (answered || gameState !== "playing") return;
    setAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrectAnswer = direction === currentRound.mainDirection;
    playDirectionSlide(direction);

    if (isCorrectAnswer) {
      const points = currentRound.isBonus ? 2 : 1;
      setScore((s) => s + points);
      setCorrect((c) => c + 1);
      setLastResult("correct");
      progressData.current.push("correct");

      scorePopAnim.setValue(0);
      scorePopOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(scorePopAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(scorePopOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => advanceToNextRound(), 500);
    } else {
      setWrong((w) => w + 1);
      setLastResult("wrong");
      progressData.current.push("wrong");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 15,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -15,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setWrongInfo({
          message:
            "Wrong direction! Look at the arrow inside the highlighted hexagon.",
          correctDirection: DIRECTION_LABELS[currentRound.mainDirection],
          directionName: DIRECTION_NAMES[currentRound.mainDirection],
        });
        setShowWrongModal(true);
      }, 400);
    }
  };

  const dismissWrongAndNext = () => {
    setShowWrongModal(false);
    setWrongInfo(null);
    advanceToNextRound();
  };

  const advanceToNextRound = () => {
    const nextRound = round + 1;
    if (nextRound >= TOTAL_ROUNDS) {
      finishGame();
      return;
    }
    setRound(nextRound);
    setCurrentRound(generateRound());
    setTimeLeft(TIME_PER_ROUND);
    setAnswered(false);
    setLastResult(null);
    roundFadeIn.setValue(0);
    Animated.timing(roundFadeIn, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const stickAngleDeg = stickRotation.interpolate({
    inputRange: [-180, 180],
    outputRange: ["-180deg", "180deg"],
  });

  // Direction button helper
  const renderDirBtn = (dir) => {
    const IconComp = DIRECTION_ICONS[dir];
    const isDisabled = answered || gameState === "paused";
    return (
      <TouchableOpacity
        key={dir}
        onPress={() => handleDirectionPress(dir)}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={{
          flex: 1,
          height: 52,
          borderRadius: 14,
          backgroundColor: isDisabled ? COLORS.card + "60" : COLORS.card,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: isDisabled ? COLORS.border + "40" : "#4F46E5",
        }}
      >
        <IconComp
          color={isDisabled ? COLORS.textSecondary + "50" : "#6366F1"}
          size={22}
        />
        <Text
          style={{
            color: isDisabled
              ? COLORS.textSecondary + "50"
              : COLORS.textSecondary,
            fontSize: 9,
            marginTop: 1,
            fontWeight: "600",
          }}
        >
          {DIRECTION_LABELS[dir]}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* ── IDLE ── */}
      {gameState === "idle" && (
        <View style={{ flex: 1, paddingTop: insets.top }}>
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
              Hex Direction
            </Text>
            <TouchableOpacity onPress={() => setShowHelp(true)}>
              <HelpCircle color={COLORS.textSecondary} size={22} />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 36,
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#4F46E5" + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 48 }}>⬡</Text>
            </View>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 26,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              Hex Direction
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                textAlign: "center",
                marginTop: 12,
                lineHeight: 20,
              }}
            >
              Find the highlighted hexagon and tap{"\n"}the direction its arrow
              points.{"\n\n"}🎯 Correct = +1 point{"\n"}⚡ Bonus round = +2
              points{"\n"}❌ Wrong = 0 points
            </Text>

            {/* 6 direction preview */}
            <View style={{ marginTop: 20, gap: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  justifyContent: "center",
                }}
              >
                {["up-left", "up", "up-right"].map((dir) => {
                  const IconComp = DIRECTION_ICONS[dir];
                  return (
                    <View
                      key={dir}
                      style={{
                        alignItems: "center",
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        padding: 10,
                        width: 60,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <IconComp color={COLORS.secondary} size={18} />
                      <Text
                        style={{
                          color: COLORS.textSecondary,
                          fontSize: 9,
                          marginTop: 3,
                          fontWeight: "600",
                        }}
                      >
                        {DIRECTION_LABELS[dir]}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  justifyContent: "center",
                }}
              >
                {["down-left", "down", "down-right"].map((dir) => {
                  const IconComp = DIRECTION_ICONS[dir];
                  return (
                    <View
                      key={dir}
                      style={{
                        alignItems: "center",
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        padding: 10,
                        width: 60,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <IconComp color={COLORS.secondary} size={18} />
                      <Text
                        style={{
                          color: COLORS.textSecondary,
                          fontSize: 9,
                          marginTop: 3,
                          fontWeight: "600",
                        }}
                      >
                        {DIRECTION_LABELS[dir]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              onPress={startGame}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 52,
                marginTop: 28,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                Start Game
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── PLAYING ── */}
      {(gameState === "playing" || gameState === "paused") && currentRound && (
        <Animated.View
          style={{
            flex: 1,
            opacity: screenOpacity,
            transform: [
              { translateX: Animated.add(screenSlideX, shakeAnim) },
              { translateY: screenSlideY },
            ],
          }}
        >
          {/* Top bar */}
          <View
            style={{
              paddingTop: insets.top,
              backgroundColor: COLORS.background,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  router.back();
                }}
                style={{ marginRight: 10 }}
              >
                <ArrowLeft color={COLORS.text} size={22} />
              </TouchableOpacity>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 16,
                  fontWeight: "700",
                  flex: 1,
                }}
              >
                Hex Direction
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity onPress={() => setShowHelp(true)}>
                  <HelpCircle color={COLORS.textSecondary} size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={pauseGame}>
                  <Pause color={COLORS.textSecondary} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={{
                height: 4,
                backgroundColor: COLORS.border,
                marginHorizontal: 16,
              }}
            >
              <View
                style={{
                  height: 4,
                  backgroundColor:
                    timeLeft <= 1
                      ? COLORS.error
                      : timeLeft <= 2
                        ? "#F59E0B"
                        : "#6366F1",
                  width: `${(timeLeft / TIME_PER_ROUND) * 100}%`,
                  borderRadius: 2,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 6,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                >
                  <Text
                    style={{
                      color: COLORS.highlight,
                      fontSize: 17,
                      fontWeight: "800",
                    }}
                  >
                    {score}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                    pts
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                >
                  <Text
                    style={{
                      color: COLORS.success,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {correct}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                    ✓
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                >
                  <Text
                    style={{
                      color: COLORS.error,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {wrong}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                    ✗
                  </Text>
                </View>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    color: timeLeft <= 2 ? COLORS.error : COLORS.text,
                    fontSize: 15,
                    fontWeight: "800",
                  }}
                >
                  {timeLeft}s
                </Text>
                <View
                  style={{
                    backgroundColor: COLORS.cardLight,
                    borderRadius: 10,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                  >
                    {round + 1}/{TOTAL_ROUNDS}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 16,
                gap: 2,
                marginBottom: 2,
              }}
            >
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
                const result = progressData.current[i];
                let dotColor = COLORS.border + "60";
                if (result === "correct") dotColor = COLORS.success;
                else if (result === "wrong") dotColor = COLORS.error;
                else if (i === round) dotColor = COLORS.secondary;
                return (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: dotColor,
                    }}
                  />
                );
              })}
            </View>
          </View>

          {/* Bonus */}
          {currentRound.isBonus && (
            <View style={{ alignItems: "center", paddingVertical: 4 }}>
              <View
                style={{
                  backgroundColor: COLORS.highlight + "20",
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  borderWidth: 1,
                  borderColor: COLORS.highlight + "40",
                }}
              >
                <Text style={{ fontSize: 11 }}>⚡</Text>
                <Text
                  style={{
                    color: COLORS.highlight,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  BONUS — x2!
                </Text>
              </View>
            </View>
          )}

          {/* Hex Grid — big hexagons */}
          <Animated.View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              opacity: roundFadeIn,
            }}
          >
            <Svg
              width={SVG_WIDTH}
              height={SVG_HEIGHT}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            >
              {CONNECTIONS.map(([a, b], idx) => {
                const ca = getHexCenter(a);
                const cb = getHexCenter(b);
                return (
                  <Line
                    key={`l-${idx}`}
                    x1={ca.x}
                    y1={ca.y}
                    x2={cb.x}
                    y2={cb.y}
                    stroke={COLORS.border}
                    strokeWidth={1.5}
                    opacity={0.25}
                  />
                );
              })}

              {GRID_POSITIONS.map((_, i) => {
                const center = getHexCenter(i);
                const isActive = i === currentRound.activeIndex;
                const dir = currentRound.hexDirections[i];
                const isWrongR = isActive && lastResult === "wrong";
                const isCorrectR = isActive && lastResult === "correct";

                let fillColor = COLORS.card;
                let strokeColor = COLORS.border;
                let strokeW = 1.5;

                if (isActive) {
                  fillColor = isWrongR
                    ? COLORS.error + "35"
                    : isCorrectR
                      ? COLORS.success + "35"
                      : "#4F46E5" + "45";
                  strokeColor = isWrongR
                    ? COLORS.error
                    : isCorrectR
                      ? COLORS.success
                      : "#6366F1";
                  strokeW = 3;
                }

                const arrowRot = getArrowRotation(dir);
                const aLen = isActive ? 18 : 12;
                const hLen = isActive ? 10 : 6;
                const aStroke = isActive ? "#fff" : COLORS.textSecondary + "45";
                const aWidth = isActive ? 3 : 1.5;

                return (
                  <G key={`h-${i}`}>
                    {isActive && (
                      <Polygon
                        points={hexPoints(center.x, center.y, HEX_SIZE + 8)}
                        fill="none"
                        stroke={
                          isWrongR
                            ? COLORS.error
                            : isCorrectR
                              ? COLORS.success
                              : "#6366F1"
                        }
                        strokeWidth={1}
                        opacity={0.25}
                      />
                    )}
                    <Polygon
                      points={hexPoints(center.x, center.y, HEX_SIZE)}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeW}
                    />

                    <G rotation={arrowRot} origin={`${center.x}, ${center.y}`}>
                      <Line
                        x1={center.x}
                        y1={center.y + aLen}
                        x2={center.x}
                        y2={center.y - aLen}
                        stroke={aStroke}
                        strokeWidth={aWidth}
                        strokeLinecap="round"
                      />
                      <Line
                        x1={center.x}
                        y1={center.y - aLen}
                        x2={center.x - hLen}
                        y2={center.y - aLen + hLen}
                        stroke={aStroke}
                        strokeWidth={aWidth}
                        strokeLinecap="round"
                      />
                      <Line
                        x1={center.x}
                        y1={center.y - aLen}
                        x2={center.x + hLen}
                        y2={center.y - aLen + hLen}
                        stroke={aStroke}
                        strokeWidth={aWidth}
                        strokeLinecap="round"
                      />

                      {isActive && currentRound.isBonus && (
                        <>
                          <Line
                            x1={center.x - 10}
                            y1={center.y + 10}
                            x2={center.x - 10}
                            y2={center.y - 8}
                            stroke="#FFD166"
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                          <Line
                            x1={center.x - 10}
                            y1={center.y - 8}
                            x2={center.x - 15}
                            y2={center.y - 1}
                            stroke="#FFD166"
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                          <Line
                            x1={center.x - 10}
                            y1={center.y - 8}
                            x2={center.x - 5}
                            y2={center.y - 1}
                            stroke="#FFD166"
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                          <Line
                            x1={center.x + 10}
                            y1={center.y + 10}
                            x2={center.x + 10}
                            y2={center.y - 8}
                            stroke="#FFD166"
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                          <Line
                            x1={center.x + 10}
                            y1={center.y - 8}
                            x2={center.x + 5}
                            y2={center.y - 1}
                            stroke="#FFD166"
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                          <Line
                            x1={center.x + 10}
                            y1={center.y - 8}
                            x2={center.x + 15}
                            y2={center.y - 1}
                            stroke="#FFD166"
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                        </>
                      )}
                    </G>
                  </G>
                );
              })}
            </Svg>

            <Animated.View
              style={{
                position: "absolute",
                alignSelf: "center",
                opacity: scorePopOpacity,
                transform: [
                  {
                    translateY: scorePopAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -60],
                    }),
                  },
                  {
                    scale: scorePopAnim.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0.5, 1.4, 1],
                    }),
                  },
                ],
              }}
            >
              <Text
                style={{
                  color: COLORS.success,
                  fontSize: 36,
                  fontWeight: "900",
                }}
              >
                +{currentRound.isBonus ? 2 : 1}
              </Text>
            </Animated.View>
          </Animated.View>

          {/* 6 Direction buttons — 2 rows */}
          <View
            style={{
              paddingBottom: insets.bottom + 6,
              paddingHorizontal: 16,
              backgroundColor: COLORS.background,
            }}
          >
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 10,
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              Tap the direction of the highlighted arrow
            </Text>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              {renderDirBtn("up-left")}
              {renderDirBtn("up")}
              {renderDirBtn("up-right")}
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {renderDirBtn("down-left")}
              {renderDirBtn("down")}
              {renderDirBtn("down-right")}
            </View>

            <TouchableOpacity
              onPress={stopGame}
              style={{
                alignSelf: "center",
                marginTop: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: COLORS.error + "15",
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 6,
              }}
            >
              <Square color={COLORS.error} size={12} fill={COLORS.error} />
              <Text
                style={{ color: COLORS.error, fontSize: 12, fontWeight: "700" }}
              >
                Stop
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stick overlay */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              opacity: stickOpacity,
            }}
          >
            <Animated.View style={{ transform: [{ rotate: stickAngleDeg }] }}>
              <View
                style={{
                  width: 6,
                  height: 140,
                  backgroundColor: "#6366F1",
                  borderRadius: 3,
                  opacity: 0.6,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  top: -16,
                  left: -12,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 15,
                  borderRightWidth: 15,
                  borderBottomWidth: 20,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderBottomColor: "#6366F1",
                  opacity: 0.6,
                }}
              />
            </Animated.View>
          </Animated.View>

          {/* Pause */}
          {gameState === "paused" && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.88)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 24,
                  padding: 32,
                  alignItems: "center",
                  width: width - 60,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Pause color={COLORS.text} size={48} />
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 24,
                    fontWeight: "800",
                    marginTop: 16,
                  }}
                >
                  Paused
                </Text>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 14,
                    marginTop: 8,
                  }}
                >
                  Round {round + 1}/{TOTAL_ROUNDS} · Score: {score}
                </Text>
                <TouchableOpacity
                  onPress={resumeGame}
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 40,
                    marginTop: 24,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                  >
                    Resume
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={stopGame}
                  style={{
                    marginTop: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Square color={COLORS.error} size={14} fill={COLORS.error} />
                  <Text
                    style={{
                      color: COLORS.error,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    End Game
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (timerRef.current) clearInterval(timerRef.current);
                    router.back();
                  }}
                  style={{ marginTop: 14 }}
                >
                  <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                    Back to Games
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* ── DONE ── */}
      {gameState === "done" && (
        <View
          style={{
            flex: 1,
            paddingTop: insets.top,
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
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 8 }}>⬡</Text>
            <Text
              style={{ color: COLORS.text, fontSize: 24, fontWeight: "800" }}
            >
              Results
            </Text>
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 56,
                fontWeight: "900",
                marginTop: 8,
              }}
            >
              {score}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Total Score
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 3,
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >
              {progressData.current.map((r, i) => (
                <View
                  key={i}
                  style={{
                    width: 16,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor:
                      r === "correct" ? COLORS.success : COLORS.error,
                  }}
                />
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 24, marginTop: 20 }}>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    color: COLORS.success,
                    fontSize: 28,
                    fontWeight: "800",
                  }}
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
                    fontSize: 28,
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
                  style={{
                    color: COLORS.secondary,
                    fontSize: 28,
                    fontWeight: "800",
                  }}
                >
                  {correct + wrong > 0
                    ? Math.round((correct / (correct + wrong)) * 100)
                    : 0}
                  %
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                  Accuracy
                </Text>
              </View>
            </View>
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
                width: "100%",
                alignItems: "center",
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

      {/* Wrong Modal */}
      <Modal
        visible={showWrongModal}
        transparent
        animationType="fade"
        onRequestClose={dismissWrongAndNext}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.88)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
              width: "100%",
              borderWidth: 1,
              borderColor: COLORS.error + "40",
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: COLORS.error + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <X color={COLORS.error} size={32} />
            </View>
            <Text
              style={{ color: COLORS.error, fontSize: 22, fontWeight: "800" }}
            >
              Wrong!
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                textAlign: "center",
                marginTop: 10,
                lineHeight: 20,
              }}
            >
              {wrongInfo?.message}
            </Text>
            <View
              style={{
                backgroundColor: COLORS.cardLight,
                borderRadius: 14,
                padding: 16,
                marginTop: 16,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                Correct answer was
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <Text style={{ color: COLORS.success, fontSize: 32 }}>
                  {wrongInfo?.correctDirection}
                </Text>
                <Text
                  style={{
                    color: COLORS.success,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {wrongInfo?.directionName}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={dismissWrongAndNext}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 40,
                marginTop: 20,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {round + 1 >= TOTAL_ROUNDS ? "See Results" : "Next Round"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
              width: "100%",
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowHelp(false)}
              style={{ position: "absolute", top: 16, right: 16 }}
            >
              <X color={COLORS.textSecondary} size={22} />
            </TouchableOpacity>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>❓</Text>
            <Text
              style={{ color: COLORS.text, fontSize: 20, fontWeight: "800" }}
            >
              How to Play
            </Text>
            <View style={{ marginTop: 16, width: "100%", gap: 12 }}>
              {[
                "Find the glowing highlighted hexagon in the grid.",
                "Check which direction its arrow points — there are 6 possible directions!",
                "Tap the matching direction button — the screen will slide that way!",
                "Bonus rounds (3 arrows) give you +2 points instead of +1!",
              ].map((text, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.secondary,
                      fontSize: 16,
                      fontWeight: "800",
                      width: 24,
                    }}
                  >
                    {idx + 1}.
                  </Text>
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: 14,
                      flex: 1,
                      lineHeight: 20,
                    }}
                  >
                    {text}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowHelp(false)}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 40,
                marginTop: 24,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Got it!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
