import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw, Star, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

// 6 colors for more complexity
const PAD_COLORS = [
  "#FF4D6A",
  "#7C5CFF",
  "#00E5FF",
  "#FFD166",
  "#4ADE80",
  "#FF8C42",
];
const PAD_LABELS = ["Red", "Purple", "Cyan", "Gold", "Green", "Orange"];
const PAD_EMOJIS = ["🔴", "🟣", "🔵", "🟡", "🟢", "🟠"];

const { width } = Dimensions.get("window");
const PAD_SIZE = (width - 72) / 3; // 3 per row now

function getShowSpeed(level) {
  // Speeds up as level increases
  if (level <= 3) return 600;
  if (level <= 6) return 500;
  if (level <= 10) return 380;
  if (level <= 15) return 280;
  return 200;
}
function getGapSpeed(level) {
  if (level <= 3) return 250;
  if (level <= 6) return 200;
  if (level <= 10) return 150;
  return 100;
}

export default function PatternRepeat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [gameState, setGameState] = useState("idle");
  const [sequence, setSequence] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [level, setLevel] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [speedLabel, setSpeedLabel] = useState("");
  const glowAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  const getSpeedLabel = (lvl) => {
    if (lvl <= 3) return "Slow 🐢";
    if (lvl <= 6) return "Medium ⚡";
    if (lvl <= 10) return "Fast 🔥";
    if (lvl <= 15) return "Blazing 💎";
    return "INSANE 🧠";
  };

  const startGame = useCallback(() => {
    setGameState("playing");
    setLevel(1);
    setXpEarned(0);
    setSpeedLabel(getSpeedLabel(1));
    const firstSequence = [Math.floor(Math.random() * 6)];
    setSequence(firstSequence);
    setPlayerIndex(0);
    showSequence(firstSequence, 1);
  }, []);

  const showSequence = (seq, lvl) => {
    setIsShowingSequence(true);
    setPlayerIndex(0);
    const showDuration = getShowSpeed(lvl);
    const gapDuration = getGapSpeed(lvl);
    let i = 0;
    const show = () => {
      if (i < seq.length) {
        setActiveIndex(seq[i]);
        Haptics.impactAsync(
          i % 2 === 0
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Medium,
        );
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: showDuration - 80,
            useNativeDriver: true,
          }),
        ]).start();
        timeoutRef.current = setTimeout(() => {
          setActiveIndex(-1);
          timeoutRef.current = setTimeout(() => {
            i++;
            show();
          }, gapDuration);
        }, showDuration);
      } else {
        setIsShowingSequence(false);
      }
    };
    timeoutRef.current = setTimeout(show, 700);
  };

  const handlePadPress = (padIndex) => {
    if (isShowingSequence || gameState !== "playing") return;
    setActiveIndex(padIndex);
    setTimeout(() => setActiveIndex(-1), 120);

    if (sequence[playerIndex] === padIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const nextIndex = playerIndex + 1;
      if (nextIndex >= sequence.length) {
        const newLevel = level + 1;
        setLevel(newLevel);
        setSpeedLabel(getSpeedLabel(newLevel));
        const nextColor = Math.floor(Math.random() * 6);
        const newSequence = [...sequence, nextColor];
        setSequence(newSequence);
        setPlayerIndex(0);
        timeoutRef.current = setTimeout(
          () => showSequence(newSequence, newLevel),
          600,
        );
      } else {
        setPlayerIndex(nextIndex);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const xp = Math.round(level * 22 + 30);
      setXpEarned(xp);
      recordGameResult("pattern-repeat", level, xp);
      setGameState("done");
    }
  };

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

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
          Pattern Repeat
        </Text>
        <TouchableOpacity onPress={startGame}>
          <RotateCcw color={COLORS.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      {gameState === "idle" && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 36,
          }}
        >
          <Text style={{ fontSize: 60, marginBottom: 16 }}>🔮</Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 24,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Pattern Repeat
          </Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 14,
              textAlign: "center",
              marginTop: 10,
              lineHeight: 22,
            }}
          >
            Watch the color sequence, then repeat it.{"\n"}
            Gets faster every level with 6 colors!
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 20,
              justifyContent: "center",
            }}
          >
            {PAD_EMOJIS.map((e, i) => (
              <View
                key={i}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: PAD_COLORS[i] + "30",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: PAD_COLORS[i] + "60",
                }}
              >
                <Text style={{ fontSize: 22 }}>{e}</Text>
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

      {gameState === "playing" && (
        <View style={{ flex: 1 }}>
          {/* Level & Speed info */}
          <View
            style={{ alignItems: "center", marginTop: 8, marginBottom: 16 }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
              Level
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 40, fontWeight: "800" }}
            >
              {level}
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              <View
                style={{
                  backgroundColor: COLORS.card,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                  Speed:{" "}
                  <Text style={{ color: COLORS.highlight, fontWeight: "600" }}>
                    {speedLabel}
                  </Text>
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: COLORS.card,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                  Length:{" "}
                  <Text style={{ color: COLORS.secondary, fontWeight: "600" }}>
                    {sequence.length}
                  </Text>
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: isShowingSequence ? COLORS.secondary : COLORS.primary,
                fontSize: 15,
                fontWeight: "700",
                marginTop: 10,
              }}
            >
              {isShowingSequence
                ? "👁  Watch carefully..."
                : `👆 Your turn! (${playerIndex + 1}/${sequence.length})`}
            </Text>
          </View>

          {/* Progress dots for player input */}
          {!isShowingSequence && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 5,
                marginBottom: 16,
                flexWrap: "wrap",
                paddingHorizontal: 20,
              }}
            >
              {sequence.map((colorIdx, i) => (
                <View
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor:
                      i < playerIndex ? PAD_COLORS[colorIdx] : COLORS.border,
                  }}
                />
              ))}
            </View>
          )}

          {/* 6-color pads in 3x2 grid */}
          <View
            style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
          >
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                width: PAD_SIZE * 3 + 24,
                gap: 12,
              }}
            >
              {PAD_COLORS.map((color, i) => {
                const isActive = activeIndex === i;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handlePadPress(i)}
                    disabled={isShowingSequence}
                    activeOpacity={0.6}
                    style={{
                      width: PAD_SIZE,
                      height: PAD_SIZE * 0.85,
                      borderRadius: 18,
                      backgroundColor: color,
                      opacity: isActive ? 1 : 0.3,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: isActive ? 2 : 0,
                      borderColor: "#fff",
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{PAD_EMOJIS[i]}</Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 11,
                        fontWeight: "600",
                        marginTop: 2,
                      }}
                    >
                      {PAD_LABELS[i]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

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
            <Text style={{ fontSize: 52, marginBottom: 8 }}>🔮</Text>
            <Text
              style={{ color: COLORS.text, fontSize: 24, fontWeight: "800" }}
            >
              Game Over!
            </Text>
            <Text
              style={{
                color: COLORS.highlight,
                fontSize: 52,
                fontWeight: "800",
                marginTop: 8,
              }}
            >
              Level {level}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
              Memorized {sequence.length} step sequence
            </Text>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 14 }}>
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.background,
                  padding: 12,
                  borderRadius: 12,
                  minWidth: 80,
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 22,
                    fontWeight: "700",
                  }}
                >
                  {level}
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                  Max Level
                </Text>
              </View>
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.background,
                  padding: 12,
                  borderRadius: 12,
                  minWidth: 80,
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 22,
                    fontWeight: "700",
                  }}
                >
                  {sequence.length}
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                  Steps
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
