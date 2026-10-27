import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const COLOR = "#A3E635";
const ITEMS = [
  "🐬",
  "🦁",
  "🌵",
  "🎸",
  "🚀",
  "🍕",
  "💎",
  "🌙",
  "⚡",
  "🦊",
  "🎯",
  "🏔️",
  "🌈",
  "🔮",
  "🎭",
];
const TOTAL_ITEMS = 12;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SpeedMemory() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [phase, setPhase] = useState("flash"); // flash | recall | result
  const [sequence, setSequence] = useState(() =>
    shuffle(ITEMS).slice(0, TOTAL_ITEMS),
  );
  const [flashIdx, setFlashIdx] = useState(0);
  const [flashInterval, setFlashIntervalMs] = useState(900);
  const [recalled, setRecalled] = useState([]);
  const [allItems] = useState(() => shuffle(ITEMS));
  const [score, setScore] = useState(null);
  const [xpEarned, setXpEarned] = useState(0);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  // Flash sequence
  useEffect(() => {
    if (phase !== "flash") return;
    // Slow → fast flashing
    const intervals = [
      900, 800, 700, 650, 600, 550, 500, 460, 420, 380, 340, 300,
    ];
    let idx = 0;
    const showNext = () => {
      if (idx >= TOTAL_ITEMS) {
        setPhase("recall");
        return;
      }
      setFlashIdx(idx);
      flashAnim.setValue(0);
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
      const delay = intervals[Math.min(idx, intervals.length - 1)];
      timerRef.current = setTimeout(() => {
        idx += 1;
        showNext();
      }, delay);
    };
    showNext();
    return () => clearTimeout(timerRef.current);
  }, [phase]);

  const toggleRecall = (item) => {
    setRecalled((prev) => {
      if (prev.includes(item)) return prev.filter((i) => i !== item);
      if (prev.length >= TOTAL_ITEMS) return prev;
      return [...prev, item];
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const submitRecall = () => {
    const correct = recalled.filter((item) => sequence.includes(item)).length;
    const inOrder = recalled.filter((item, i) => item === sequence[i]).length;
    const finalScore = correct + Math.floor(inOrder / 2);
    const xp = Math.round((finalScore / TOTAL_ITEMS) * 500 + 60);
    setScore({ correct, inOrder, finalScore });
    setXpEarned(xp);
    recordGameResult("speed-memory", finalScore, xp);
    setPhase("result");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const resetGame = () => {
    clearTimeout(timerRef.current);
    flashAnim.setValue(0);
    setSequence(shuffle(ITEMS).slice(0, TOTAL_ITEMS));
    setFlashIdx(0);
    setFlashIntervalMs(900);
    setRecalled([]);
    setScore(null);
    setXpEarned(0);
    setPhase("flash");
  };

  const flashScale = flashAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1.15, 1],
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
            clearTimeout(timerRef.current);
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
          Speed Memory
        </Text>
        <TouchableOpacity onPress={resetGame}>
          <RotateCcw color={COLORS.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      {/* FLASH phase */}
      {phase === "flash" && (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 14,
              marginBottom: 30,
            }}
          >
            Memorize the sequence! ({flashIdx + 1}/{TOTAL_ITEMS})
          </Text>
          {/* Progress dots */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 40 }}>
            {Array.from({ length: TOTAL_ITEMS }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i <= flashIdx ? COLOR : COLORS.border,
                }}
              />
            ))}
          </View>
          <Animated.Text
            style={{ fontSize: 96, transform: [{ scale: flashScale }] }}
          >
            {sequence[flashIdx]}
          </Animated.Text>
          <Text
            style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 40 }}
          >
            Getting faster…
          </Text>
        </View>
      )}

      {/* RECALL phase */}
      {phase === "recall" && (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <Text
              style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}
            >
              Recall the sequence!
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Tap all {TOTAL_ITEMS} items you saw — in order if possible
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              <Text style={{ color: COLOR, fontSize: 13, fontWeight: "700" }}>
                {recalled.length}/{TOTAL_ITEMS} selected
              </Text>
            </View>
          </View>

          {/* Selected sequence preview */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: 12, paddingHorizontal: 20 }}
            contentContainerStyle={{ gap: 6 }}
          >
            {recalled.length === 0 ? (
              <Text style={{ color: COLORS.border, fontSize: 12 }}>
                Tap items below…
              </Text>
            ) : (
              recalled.map((item, i) => (
                <View
                  key={i}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: COLOR + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{item}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* All items grid */}
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              paddingBottom: 100,
            }}
          >
            {allItems.map((item) => {
              const isSelected = recalled.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleRecall(item)}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: isSelected ? COLOR + "25" : COLORS.card,
                    borderWidth: 2,
                    borderColor: isSelected ? COLOR : COLORS.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 32 }}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={submitRecall}
            style={{
              position: "absolute",
              bottom: 30,
              left: 20,
              right: 20,
              backgroundColor: COLOR,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Check color="#000" size={20} />
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>
              Submit Recall
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RESULT */}
      {phase === "result" && score && (
        <View
          style={{
            flex: 1,
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
            <Text style={{ fontSize: 52, marginBottom: 8 }}>
              {score.correct >= 10 ? "💨" : score.correct >= 7 ? "🔥" : "💡"}
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 26, fontWeight: "800" }}
            >
              Score: {score.finalScore}
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginTop: 6,
              }}
            >
              {score.correct}/{TOTAL_ITEMS} recalled · {score.inOrder} in
              correct order
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 16,
                justifyContent: "center",
              }}
            >
              {sequence.map((item, i) => {
                const hit = recalled.includes(item);
                const ordered = recalled[i] === item;
                return (
                  <Text
                    key={i}
                    style={{ fontSize: 24, opacity: hit ? 1 : 0.3 }}
                  >
                    {item}
                  </Text>
                );
              })}
            </View>
            <Text
              style={{
                color: COLOR,
                fontSize: 20,
                fontWeight: "700",
                marginTop: 16,
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
              <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>
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
