import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw, Star, AlertTriangle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const { width, height: screenHeight } = Dimensions.get("window");
const EMOJIS = ["🧠", "⚡", "🎯", "🔮", "💎", "🌟", "🎲", "🏆"];
const GRID_SIZE = 4;
const CARD_GAP = 10;
const PADDING = 20;
const TOTAL_CARDS = GRID_SIZE * GRID_SIZE;
const CARD_WIDTH =
  (width - PADDING * 2 - CARD_GAP * (GRID_SIZE - 1)) / GRID_SIZE;
const CARD_HEIGHT = CARD_WIDTH * 1.15;
const TOTAL_PAIRS = TOTAL_CARDS / 2; // 8
const MAX_MOVES = 10;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCards() {
  const selected = shuffleArray(EMOJIS).slice(0, TOTAL_PAIRS);
  const pairs = [...selected, ...selected];
  return shuffleArray(pairs).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
}

export default function MemoryMatch() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [cards, setCards] = useState(() => generateCards());
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const locked = useRef(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const movesLeft = MAX_MOVES - moves;
  const isLowMoves = movesLeft <= 3 && movesLeft > 0;

  useEffect(() => {
    if (gameOver || failed) return;
    const interval = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [gameOver, failed, startTime]);

  const shakeBar = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 4,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (matches === TOTAL_PAIRS) {
      const score = Math.round(
        100 - ((moves - TOTAL_PAIRS) / TOTAL_PAIRS) * 40,
      );
      const xp = Math.max(
        50,
        Math.round((Math.max(0, score) / 100) * 200 + 50),
      );
      setXpEarned(xp);
      setGameOver(true);
      recordGameResult("memory-match", Math.max(0, score), xp);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [matches]);

  const handleCardPress = useCallback(
    (index) => {
      if (locked.current || failed || gameOver) return;
      if (cards[index].flipped || cards[index].matched) return;
      if (selected.length >= 2) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newCards = [...cards];
      newCards[index] = { ...newCards[index], flipped: true };
      setCards(newCards);

      const newSelected = [...selected, index];
      setSelected(newSelected);

      if (newSelected.length === 2) {
        const newMoves = moves + 1;
        setMoves(newMoves);
        locked.current = true;
        const [first, second] = newSelected;

        if (newCards[first].emoji === newCards[second].emoji) {
          // Match — keep revealed
          setTimeout(() => {
            setCards((prev) => {
              const updated = [...prev];
              updated[first] = { ...updated[first], matched: true };
              updated[second] = { ...updated[second], matched: true };
              return updated;
            });
            setMatches((m) => m + 1);
            setSelected([]);
            locked.current = false;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }, 300);
        } else {
          // Mismatch — flip back, use up a move
          if (newMoves >= MAX_MOVES - 1) shakeBar();
          setTimeout(() => {
            setCards((prev) => {
              const updated = [...prev];
              updated[first] = { ...updated[first], flipped: false };
              updated[second] = { ...updated[second], flipped: false };
              return updated;
            });
            setSelected([]);
            locked.current = false;

            if (newMoves >= MAX_MOVES) {
              // Out of moves!
              setTimeout(() => {
                const currentScore = Math.round((matches / TOTAL_PAIRS) * 100);
                const xp = Math.max(20, matches * 15);
                setXpEarned(xp);
                setFailed(true);
                recordGameResult("memory-match", currentScore, xp);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error,
                );
              }, 200);
            }
          }, 800);
        }
      }
    },
    [cards, selected, moves, matches, failed, gameOver],
  );

  const resetGame = () => {
    setCards(generateCards());
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
    setFailed(false);
    setXpEarned(0);
    locked.current = false;
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

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
          Memory Match
        </Text>
        <TouchableOpacity onPress={resetGame}>
          <RotateCcw color={COLORS.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          marginBottom: 10,
          gap: 10,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            borderRadius: 10,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
            Time
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}>
            {formatTime(elapsed)}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            borderRadius: 10,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
            Pairs
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}>
            {matches}/{TOTAL_PAIRS}
          </Text>
        </View>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: isLowMoves ? COLORS.error + "20" : COLORS.card,
            borderRadius: 10,
            padding: 12,
            alignItems: "center",
            transform: [{ translateX: shakeAnim }],
          }}
        >
          <Text
            style={{
              color: isLowMoves ? COLORS.error : COLORS.textSecondary,
              fontSize: 11,
            }}
          >
            Moves Left
          </Text>
          <Text
            style={{
              color: isLowMoves ? COLORS.error : COLORS.text,
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            {movesLeft}
          </Text>
        </Animated.View>
      </View>

      {/* Moves progress bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View
          style={{ height: 4, backgroundColor: COLORS.border, borderRadius: 2 }}
        >
          <View
            style={{
              height: 4,
              borderRadius: 2,
              width: `${Math.max(0, (movesLeft / MAX_MOVES) * 100)}%`,
              backgroundColor: isLowMoves ? COLORS.error : COLORS.secondary,
            }}
          />
        </View>
        {isLowMoves && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
            }}
          >
            <AlertTriangle color={COLORS.error} size={11} />
            <Text style={{ color: COLORS.error, fontSize: 11 }}>
              Only {movesLeft} move{movesLeft !== 1 ? "s" : ""} left!
            </Text>
          </View>
        )}
      </View>

      {/* Grid */}
      <View
        style={{
          paddingHorizontal: PADDING,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {cards.map((card, i) => {
          const isRevealed = card.flipped || card.matched;
          const col = i % GRID_SIZE;
          const row = Math.floor(i / GRID_SIZE);
          return (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.8}
              onPress={() => handleCardPress(i)}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderRadius: 14,
                backgroundColor: card.matched
                  ? COLORS.primary + "25"
                  : isRevealed
                    ? COLORS.cardLight
                    : COLORS.card,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: card.matched ? 1.5 : 1,
                borderColor: card.matched
                  ? COLORS.primary
                  : isRevealed
                    ? COLORS.border
                    : COLORS.border + "80",
                marginLeft: col > 0 ? CARD_GAP : 0,
                marginTop: row > 0 ? CARD_GAP : 0,
              }}
            >
              {isRevealed ? (
                <Text style={{ fontSize: CARD_WIDTH * 0.45 }}>
                  {card.emoji}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "800",
                    color: COLORS.primary + "50",
                  }}
                >
                  ?
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Win Modal */}
      {gameOver && (
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
            <Text style={{ fontSize: 52, marginBottom: 8 }}>🎉</Text>
            <Text
              style={{ color: COLORS.text, fontSize: 26, fontWeight: "800" }}
            >
              Complete!
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginTop: 6,
              }}
            >
              {matches}/{TOTAL_PAIRS} pairs · {moves} moves ·{" "}
              {formatTime(elapsed)}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 14,
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
              onPress={resetGame}
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

      {/* Failed Modal */}
      {failed && (
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
            <Text style={{ fontSize: 52, marginBottom: 8 }}>💀</Text>
            <Text
              style={{ color: COLORS.error, fontSize: 26, fontWeight: "800" }}
            >
              Out of Moves!
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              You used all {MAX_MOVES} moves.{"\n"}Found {matches}/{TOTAL_PAIRS}{" "}
              pairs.
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
                gap: 6,
              }}
            >
              <Star
                color={COLORS.highlight}
                size={16}
                fill={COLORS.highlight}
              />
              <Text
                style={{
                  color: COLORS.highlight,
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                +{xpEarned} XP
              </Text>
            </View>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 12,
                marginTop: 10,
              }}
            >
              💡 Tip: Memorize card positions before flipping!
            </Text>
            <TouchableOpacity
              onPress={resetGame}
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
