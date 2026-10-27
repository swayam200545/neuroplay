import React, { useState, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw, Star } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

// ─────────────────────────────────────────────
// Massive question bank — shuffled each game
// ─────────────────────────────────────────────
const ALL_QUESTIONS = [
  // ── Number Sequences ──
  {
    type: "Sequence",
    question: "What comes next?\n2, 4, 6, 8, ?",
    options: ["10", "9", "12", "11"],
    correctIndex: 0,
  },
  {
    type: "Sequence",
    question: "What comes next?\n5, 10, 15, 20, ?",
    options: ["24", "25", "30", "22"],
    correctIndex: 1,
  },
  {
    type: "Sequence",
    question: "What comes next?\n3, 6, 12, 24, ?",
    options: ["36", "42", "48", "30"],
    correctIndex: 2,
  },
  {
    type: "Sequence",
    question: "What comes next?\n1, 4, 9, 16, ?",
    options: ["20", "24", "25", "36"],
    correctIndex: 2,
  },
  {
    type: "Sequence",
    question: "What comes next?\n100, 90, 80, 70, ?",
    options: ["55", "65", "60", "50"],
    correctIndex: 2,
  },
  {
    type: "Sequence",
    question: "What comes next?\n1, 1, 2, 3, 5, 8, ?",
    options: ["11", "12", "13", "15"],
    correctIndex: 2,
  },
  {
    type: "Sequence",
    question: "What comes next?\n2, 3, 5, 7, 11, ?",
    options: ["12", "13", "14", "15"],
    correctIndex: 1,
  },
  {
    type: "Sequence",
    question: "What comes next?\n7, 14, 21, 28, ?",
    options: ["34", "35", "36", "40"],
    correctIndex: 1,
  },
  {
    type: "Sequence",
    question: "What comes next?\n81, 27, 9, 3, ?",
    options: ["0", "1", "2", "3"],
    correctIndex: 1,
  },
  {
    type: "Sequence",
    question: "What comes next?\n1, 8, 27, 64, ?",
    options: ["100", "121", "125", "150"],
    correctIndex: 2,
  },
  {
    type: "Sequence",
    question: "What comes next?\n10, 20, 30, 40, ?",
    options: ["45", "48", "50", "60"],
    correctIndex: 2,
  },
  {
    type: "Sequence",
    question: "What comes next?\n0, 2, 6, 12, 20, ?",
    options: ["28", "30", "32", "36"],
    correctIndex: 1,
  },

  // ── Odd One Out ──
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Apple", "Banana", "Carrot", "Mango"],
    correctIndex: 2,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Dog", "Cat", "Eagle", "Hamster"],
    correctIndex: 2,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Red", "Blue", "Green", "Happy"],
    correctIndex: 3,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Piano", "Guitar", "Drums", "Canvas"],
    correctIndex: 3,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["2", "4", "7", "8"],
    correctIndex: 2,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Mars", "Venus", "Europe", "Saturn"],
    correctIndex: 2,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Python", "Java", "HTML", "Ruby"],
    correctIndex: 2,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Circle", "Square", "Triangle", "Sphere"],
    correctIndex: 3,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Rose", "Lily", "Oak", "Tulip"],
    correctIndex: 2,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Paris", "London", "Tokyo", "Amazon"],
    correctIndex: 3,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Swim", "Run", "Jump", "Eat"],
    correctIndex: 3,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Copper", "Iron", "Gold", "Glass"],
    correctIndex: 3,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Shark", "Salmon", "Tuna", "Frog"],
    correctIndex: 3,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Sunday", "Monday", "August", "Friday"],
    correctIndex: 2,
  },
  {
    type: "Odd One Out",
    question: "Which one doesn't belong?",
    options: ["Violin", "Cello", "Flute", "Harp"],
    correctIndex: 2,
  },

  // ── Analogies ──
  {
    type: "Analogy",
    question: "Hot is to Cold as\nDay is to ?",
    options: ["Night", "Sun", "Morning", "Warm"],
    correctIndex: 0,
  },
  {
    type: "Analogy",
    question: "Fish is to Water as\nBird is to ?",
    options: ["Nest", "Sky", "Wing", "Tree"],
    correctIndex: 1,
  },
  {
    type: "Analogy",
    question: "Book is to Read as\nSong is to ?",
    options: ["Sing", "Dance", "Write", "Listen"],
    correctIndex: 3,
  },
  {
    type: "Analogy",
    question: "Eye is to See as\nEar is to ?",
    options: ["Sound", "Hear", "Music", "Talk"],
    correctIndex: 1,
  },
  {
    type: "Analogy",
    question: "Teacher is to School as\nDoctor is to ?",
    options: ["Patient", "Hospital", "Medicine", "Nurse"],
    correctIndex: 1,
  },
  {
    type: "Analogy",
    question: "Pen is to Write as\nKnife is to ?",
    options: ["Sharp", "Cut", "Kitchen", "Metal"],
    correctIndex: 1,
  },
  {
    type: "Analogy",
    question: "Flower is to Garden as\nStar is to ?",
    options: ["Night", "Space", "Bright", "Moon"],
    correctIndex: 1,
  },
  {
    type: "Analogy",
    question: "Wheel is to Car as\nBlade is to ?",
    options: ["Scissors", "Engine", "Metal", "Sharp"],
    correctIndex: 0,
  },
  {
    type: "Analogy",
    question: "Sun is to Earth as\nMoon is to ?",
    options: ["Mars", "Sun", "Earth", "Stars"],
    correctIndex: 2,
  },
  {
    type: "Analogy",
    question: "Cat is to Meow as\nDog is to ?",
    options: ["Bark", "Roar", "Hiss", "Purr"],
    correctIndex: 0,
  },
  {
    type: "Analogy",
    question: "Fire is to Hot as\nIce is to ?",
    options: ["Water", "Cold", "Freeze", "Snow"],
    correctIndex: 1,
  },
  {
    type: "Analogy",
    question: "Gloves are to Hands as\nHat is to ?",
    options: ["Hair", "Head", "Face", "Neck"],
    correctIndex: 1,
  },

  // ── Logic / Deduction ──
  {
    type: "Logic",
    question: "If all cats are animals and Whiskers is a cat, then:",
    options: [
      "Whiskers is an animal",
      "All animals are cats",
      "Whiskers is not an animal",
      "Cats are not animals",
    ],
    correctIndex: 0,
  },
  {
    type: "Logic",
    question: "Tom is older than Sam. Sam is older than Jack. Who is oldest?",
    options: ["Sam", "Jack", "Tom", "All same"],
    correctIndex: 2,
  },
  {
    type: "Logic",
    question: "A store sells apples for $2 each. How much for 5 apples?",
    options: ["$8", "$9", "$10", "$12"],
    correctIndex: 2,
  },
  {
    type: "Logic",
    question: "If today is Wednesday, what day was 3 days ago?",
    options: ["Saturday", "Sunday", "Monday", "Tuesday"],
    correctIndex: 1,
  },
  {
    type: "Logic",
    question: "A clock shows 3:15. What is the angle between the hands?",
    options: ["0°", "7.5°", "45°", "90°"],
    correctIndex: 1,
  },
  {
    type: "Logic",
    question: "How many months have 28 days?",
    options: ["1", "4", "12", "2"],
    correctIndex: 2,
  },
  {
    type: "Logic",
    question: "You have 6 apples and give away 2. How many are left?",
    options: ["2", "3", "4", "8"],
    correctIndex: 2,
  },
  {
    type: "Logic",
    question: "Which is heavier: 1 kg of feathers or 1 kg of iron?",
    options: ["Iron", "Feathers", "They weigh the same", "Depends on volume"],
    correctIndex: 2,
  },
  {
    type: "Logic",
    question:
      "A snail climbs 3m up by day, slips 2m back at night. How many days to climb 10m?",
    options: ["7", "8", "9", "10"],
    correctIndex: 1,
  },
  {
    type: "Logic",
    question:
      "If 3 cats catch 3 mice in 3 minutes, how many cats catch 9 mice in 9 minutes?",
    options: ["3", "6", "9", "12"],
    correctIndex: 0,
  },
  {
    type: "Logic",
    question:
      "A father is 3 times his son's age. In 12 years, he'll be twice. How old is the son now?",
    options: ["12", "10", "8", "6"],
    correctIndex: 0,
  },

  // ── Visual / Pattern ──
  {
    type: "Pattern",
    question: "🔴🔵🔴🔵🔴 → Next?",
    options: ["🔴", "🔵", "🟡", "🟢"],
    correctIndex: 1,
  },
  {
    type: "Pattern",
    question: "A B C A B C A B → Next?",
    options: ["A", "C", "D", "B"],
    correctIndex: 1,
  },
  {
    type: "Pattern",
    question: "1 2 4 8 16 → Next?",
    options: ["24", "30", "32", "28"],
    correctIndex: 2,
  },
  {
    type: "Pattern",
    question: "🌙⭐🌙⭐🌙 → Next?",
    options: ["🌙", "⭐", "☀️", "🌟"],
    correctIndex: 1,
  },
  {
    type: "Pattern",
    question: "Z Y X W → Next?",
    options: ["U", "V", "T", "S"],
    correctIndex: 1,
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

const TOTAL_PUZZLES = 10;

export default function LogicPuzzle() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [gameState, setGameState] = useState("idle");
  const [puzzleQueue, setPuzzleQueue] = useState([]);
  const [puzzleNum, setPuzzleNum] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAnswer, setShowAnswer] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const currentPuzzle = puzzleQueue[puzzleNum] ?? null;

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(ALL_QUESTIONS).slice(0, TOTAL_PUZZLES);
    setPuzzleQueue(shuffled);
    setGameState("playing");
    setPuzzleNum(0);
    setCorrect(0);
    setXpEarned(0);
    setSelectedIndex(-1);
    setShowAnswer(false);
  }, []);

  const handleAnswer = (index) => {
    if (showAnswer || !currentPuzzle) return;
    setSelectedIndex(index);
    setShowAnswer(true);
    const isCorrect = index === currentPuzzle.correctIndex;
    if (isCorrect) {
      setCorrect((c) => c + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const nextPuzzle = () => {
    const nextNum = puzzleNum + 1;
    if (nextNum >= TOTAL_PUZZLES) {
      const newCorrect =
        selectedIndex === currentPuzzle.correctIndex ? correct : correct;
      const score = Math.round((newCorrect / TOTAL_PUZZLES) * 100);
      const xp = Math.round((score / 100) * 150 + 30);
      setXpEarned(xp);
      recordGameResult("logic-puzzle", score, xp);
      setGameState("done");
      return;
    }
    setPuzzleNum(nextNum);
    setSelectedIndex(-1);
    setShowAnswer(false);
  };

  const typeColors = {
    Sequence: "#6366F1",
    "Odd One Out": "#F59E0B",
    Analogy: "#10B981",
    Logic: "#3B82F6",
    Pattern: "#EC4899",
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
          Logic Puzzle
        </Text>
        <TouchableOpacity onPress={startGame}>
          <RotateCcw color={COLORS.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      {/* IDLE */}
      {gameState === "idle" && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🧩</Text>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 24,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Logic Puzzle
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
            {TOTAL_PUZZLES} unique puzzles every game!{"\n"}Sequences ·
            Analogies · Logic · Patterns
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

      {/* PLAYING */}
      {gameState === "playing" && currentPuzzle && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >
          {/* Progress bar */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 5,
              marginBottom: 16,
              marginTop: 4,
            }}
          >
            {Array.from({ length: TOTAL_PUZZLES }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    i < puzzleNum
                      ? COLORS.primary
                      : i === puzzleNum
                        ? COLORS.secondary
                        : COLORS.border,
                }}
              />
            ))}
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              {puzzleNum + 1}/{TOTAL_PUZZLES} · ✅ {correct}
            </Text>
            <View
              style={{
                backgroundColor:
                  (typeColors[currentPuzzle.type] || COLORS.primary) + "25",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: typeColors[currentPuzzle.type] || COLORS.primary,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {currentPuzzle.type}
              </Text>
            </View>
          </View>

          {/* Question card */}
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 20,
              padding: 28,
              marginBottom: 24,
              borderLeftWidth: 4,
              borderLeftColor: typeColors[currentPuzzle.type] || COLORS.primary,
            }}
          >
            <Text
              style={{
                color: COLORS.text,
                fontSize: 20,
                fontWeight: "600",
                lineHeight: 30,
                textAlign: "center",
              }}
            >
              {currentPuzzle.question}
            </Text>
          </View>

          {/* Options */}
          <View style={{ gap: 12 }}>
            {currentPuzzle.options.map((option, i) => {
              let bgColor = COLORS.card;
              let borderColor = COLORS.border;
              if (showAnswer) {
                if (i === currentPuzzle.correctIndex) {
                  bgColor = "#10B981" + "20";
                  borderColor = "#10B981";
                } else if (i === selectedIndex) {
                  bgColor = COLORS.error + "20";
                  borderColor = COLORS.error;
                }
              } else if (i === selectedIndex) {
                borderColor = COLORS.primary;
              }
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleAnswer(i)}
                  disabled={showAnswer}
                  style={{
                    backgroundColor: bgColor,
                    borderRadius: 14,
                    padding: 18,
                    borderWidth: 1.5,
                    borderColor,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: COLORS.border,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 16,
                      fontWeight: "500",
                      flex: 1,
                    }}
                  >
                    {option}
                  </Text>
                  {showAnswer && i === currentPuzzle.correctIndex && (
                    <Text style={{ fontSize: 16 }}>✅</Text>
                  )}
                  {showAnswer &&
                    i === selectedIndex &&
                    i !== currentPuzzle.correctIndex && (
                      <Text style={{ fontSize: 16 }}>❌</Text>
                    )}
                </TouchableOpacity>
              );
            })}
          </View>

          {showAnswer && (
            <TouchableOpacity
              onPress={nextPuzzle}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                paddingVertical: 16,
                marginTop: 24,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {puzzleNum + 1 >= TOTAL_PUZZLES
                  ? "See Results"
                  : "Next Puzzle →"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* DONE */}
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
              {correct >= 9
                ? "🏆"
                : correct >= 7
                  ? "🎯"
                  : correct >= 5
                    ? "🧩"
                    : "💡"}
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 24, fontWeight: "800" }}
            >
              Results
            </Text>
            <Text
              style={{
                color: COLORS.secondary,
                fontSize: 48,
                fontWeight: "800",
                marginTop: 8,
              }}
            >
              {correct}/{TOTAL_PUZZLES}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
              Correct Answers
            </Text>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 16,
                fontWeight: "600",
                marginTop: 8,
              }}
            >
              {Math.round((correct / TOTAL_PUZZLES) * 100)}% accuracy
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
                New Game
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
