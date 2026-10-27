import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const COLOR = "#38BDF8";
const TOTAL_QUESTIONS = 10;
const TIME_PER_Q = 20;

const SHAPES = ["●", "■", "▲", "★", "◆", "✦"];
const PATTERN_COLORS = [
  "#38BDF8",
  "#F97316",
  "#4ADE80",
  "#F472B6",
  "#FCD34D",
  "#A78BFA",
];

// Generate a 3x3 matrix puzzle
function generateMatrix() {
  // Pattern type: color progression, shape rotation, count increase
  const types = ["colorRow", "shapeRow", "countGrid"];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === "colorRow") {
    // Each row uses same shape, each column uses same color
    const shapeIdx = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[shapeIdx];
    const c1 =
      PATTERN_COLORS[Math.floor(Math.random() * PATTERN_COLORS.length)];
    const c2 = PATTERN_COLORS.find((c) => c !== c1) || PATTERN_COLORS[1];
    const c3 =
      PATTERN_COLORS.find((c) => c !== c1 && c !== c2) || PATTERN_COLORS[2];
    const cols = [c1, c2, c3];
    const grid = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid.push({ shape, color: cols[c] });
      }
    }
    const answer = grid[8];
    grid[8] = null;
    const wrongs = [
      {
        shape,
        color: PATTERN_COLORS.find((c) => c !== c3) || PATTERN_COLORS[0],
      },
      { shape: SHAPES[(shapeIdx + 1) % SHAPES.length], color: c3 },
      { shape: SHAPES[(shapeIdx + 2) % SHAPES.length], color: c1 },
    ];
    const options = [...wrongs, answer].sort(() => Math.random() - 0.5);
    return {
      grid,
      answer,
      options,
      hint: "What follows the column color pattern?",
    };
  }

  if (type === "shapeRow") {
    // Rows cycle through 3 different shapes, constant color per row
    const rowShapes = [
      [SHAPES[0], SHAPES[1], SHAPES[2]],
      [SHAPES[3], SHAPES[4], SHAPES[5]],
      [SHAPES[0], SHAPES[2], SHAPES[4]],
    ][Math.floor(Math.random() * 3)];
    const color =
      PATTERN_COLORS[Math.floor(Math.random() * PATTERN_COLORS.length)];
    const grid = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid.push({ shape: rowShapes[c % rowShapes.length], color });
      }
    }
    const answer = grid[8];
    grid[8] = null;
    const wrongs = [
      {
        shape: SHAPES[(SHAPES.indexOf(rowShapes[2]) + 1) % SHAPES.length],
        color,
      },
      { shape: rowShapes[0], color },
      {
        shape: rowShapes[1],
        color:
          PATTERN_COLORS[
            (PATTERN_COLORS.indexOf(color) + 1) % PATTERN_COLORS.length
          ],
      },
    ];
    const options = [...wrongs, answer].sort(() => Math.random() - 0.5);
    return {
      grid,
      answer,
      options,
      hint: "What shape completes the row pattern?",
    };
  }

  // countGrid: number of dots per cell follows a count (1,2,3 / 4,5,6 / 7,8,?)
  const counts = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const color =
    PATTERN_COLORS[Math.floor(Math.random() * PATTERN_COLORS.length)];
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const grid = counts.slice(0, 8).map((n) => ({ count: n, shape, color }));
  grid.push(null);
  const answer = { count: 9, shape, color };
  const wrongs = [
    { count: 7, shape, color },
    { count: 10, shape, color },
    {
      count: 9,
      shape: SHAPES[(SHAPES.indexOf(shape) + 1) % SHAPES.length],
      color,
    },
  ];
  const options = [...wrongs, answer].sort(() => Math.random() - 0.5);
  return {
    grid,
    answer,
    options,
    hint: "How many symbols complete the sequence?",
    isCount: true,
  };
}

function Cell({ cell, size = 72 }) {
  if (!cell) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: COLOR,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: COLOR, fontSize: 22 }}>?</Text>
      </View>
    );
  }
  if (cell.count) {
    const dots = Array.from({ length: Math.min(cell.count, 9) });
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor: COLORS.cardLight,
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 2,
            maxWidth: size - 12,
          }}
        >
          {dots.map((_, i) => (
            <Text key={i} style={{ color: cell.color, fontSize: 10 }}>
              ●
            </Text>
          ))}
        </View>
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        backgroundColor: COLORS.cardLight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: cell.color, fontSize: 28 }}>{cell.shape}</Text>
    </View>
  );
}

function OptionCell({ cell, selected, correct, onPress, size = 64 }) {
  let border = COLORS.border;
  let bg = COLORS.card;
  if (selected) {
    bg = correct ? COLORS.success + "30" : COLORS.error + "30";
    border = correct ? COLORS.success : COLORS.error;
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderWidth: 2,
        borderColor: border,
        borderRadius: 12,
        backgroundColor: bg,
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
        width: size + 16,
        height: size + 16,
      }}
    >
      <Cell cell={cell} size={size} />
    </TouchableOpacity>
  );
}

export default function MatrixIQ() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [qIdx, setQIdx] = useState(0);
  const [puzzle, setPuzzle] = useState(() => generateMatrix());
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [gameOver, setGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: TIME_PER_Q * 1000,
      useNativeDriver: false,
    }).start();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSelect(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIdx]);

  const handleSelect = (opt) => {
    clearInterval(timerRef.current);
    if (selected !== null) return;
    setSelected(opt);
    const wasCorrect =
      opt && JSON.stringify(opt) === JSON.stringify(puzzle.answer);
    if (wasCorrect) {
      setCorrect((c) => c + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setTimeout(() => {
      if (qIdx + 1 >= TOTAL_QUESTIONS) {
        const nc = wasCorrect ? correct + 1 : correct;
        const xp = Math.round((nc / TOTAL_QUESTIONS) * 400 + 60);
        setXpEarned(xp);
        recordGameResult("matrix-iq", nc, xp);
        setGameOver(true);
      } else {
        setQIdx((i) => i + 1);
        setPuzzle(generateMatrix());
        setSelected(null);
        setTimeLeft(TIME_PER_Q);
      }
    }, 1000);
  };

  const resetGame = () => {
    clearInterval(timerRef.current);
    progressAnim.setValue(1);
    setQIdx(0);
    setPuzzle(generateMatrix());
    setCorrect(0);
    setSelected(null);
    setTimeLeft(TIME_PER_Q);
    setGameOver(false);
    setXpEarned(0);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

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
          Matrix IQ
        </Text>
        <TouchableOpacity onPress={resetGame}>
          <RotateCcw color={COLORS.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      {/* Timer bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
            Q {qIdx + 1}/{TOTAL_QUESTIONS} · ✅ {correct}
          </Text>
          <Text
            style={{
              color: timeLeft <= 5 ? COLORS.error : COLORS.textSecondary,
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {timeLeft}s
          </Text>
        </View>
        <View
          style={{ height: 5, backgroundColor: COLORS.border, borderRadius: 3 }}
        >
          <Animated.View
            style={{
              height: 5,
              borderRadius: 3,
              width: progressWidth,
              backgroundColor: timeLeft <= 5 ? COLORS.error : COLOR,
            }}
          />
        </View>
      </View>

      <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 20 }}>
        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          {puzzle.hint}
        </Text>

        {/* 3x3 Grid */}
        <View style={{ gap: 6, marginBottom: 24 }}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={{ flexDirection: "row", gap: 6 }}>
              {[0, 1, 2].map((col) => {
                const cell = puzzle.grid[row * 3 + col];
                return <Cell key={col} cell={cell} size={86} />;
              })}
            </View>
          ))}
        </View>

        {/* Options */}
        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          Choose the missing piece:
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {puzzle.options.map((opt, i) => {
            const isSelected =
              selected && JSON.stringify(selected) === JSON.stringify(opt);
            const isCorrect =
              JSON.stringify(opt) === JSON.stringify(puzzle.answer);
            return (
              <OptionCell
                key={i}
                cell={opt}
                size={64}
                onPress={() => {
                  if (selected === null) handleSelect(opt);
                }}
                selected={isSelected || (selected !== null && isCorrect)}
                correct={isCorrect}
              />
            );
          })}
        </View>
      </View>

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
              {correct >= 8 ? "🧬" : correct >= 5 ? "🔮" : "💡"}
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 26, fontWeight: "800" }}
            >
              {correct}/{TOTAL_QUESTIONS} Correct
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginTop: 6,
              }}
            >
              IQ Score: ~{100 + (correct - 5) * 8}
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
