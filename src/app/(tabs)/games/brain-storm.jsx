import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const COLOR = "#FCD34D";
const ROUND_DURATION = 20; // seconds per mini-game

// ─── Mini-game 1: Quick Tap ─────────────────────────────────────
function MiniReaction({ onDone }) {
  const [state, setState] = useState("wait"); // wait | tap | result
  const [rt, setRt] = useState(null);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const delay = 1500 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setState("tap");
      startRef.current = Date.now();
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleTap = () => {
    if (state === "tap") {
      const elapsed = Date.now() - startRef.current;
      setRt(elapsed);
      setState("result");
      const score = Math.max(0, Math.min(100, Math.round((800 - elapsed) / 7)));
      setTimeout(() => onDone(score), 1200);
    } else if (state === "wait") {
      clearTimeout(timerRef.current);
      setState("result");
      setRt(9999);
      setTimeout(() => onDone(0), 1000);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleTap}
      activeOpacity={1}
      style={{
        flex: 1,
        backgroundColor:
          state === "tap"
            ? "#22C55E"
            : state === "result"
              ? COLORS.cardLight
              : COLORS.card,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {state === "wait" && (
        <>
          <Text style={{ fontSize: 36 }}>⏳</Text>
          <Text
            style={{ color: COLORS.textSecondary, fontSize: 16, marginTop: 12 }}
          >
            Wait for green…
          </Text>
        </>
      )}
      {state === "tap" && (
        <>
          <Text style={{ fontSize: 52 }}>🟢</Text>
          <Text style={{ color: "#000", fontSize: 20, fontWeight: "800" }}>
            TAP NOW!
          </Text>
        </>
      )}
      {state === "result" && (
        <>
          <Text style={{ color: COLORS.text, fontSize: 32, fontWeight: "800" }}>
            {rt === 9999 ? "Too early! 👎" : `${rt}ms ⚡`}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Mini-game 2: Quick Math ────────────────────────────────────
function MiniMath({ onDone }) {
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [question, setQuestion] = useState(() => makeQ());
  const [selected, setSelected] = useState(null);

  function makeQ() {
    const a = Math.floor(Math.random() * 20) + 5;
    const b = Math.floor(Math.random() * 15) + 3;
    const ops = ["+", "-"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const ans = op === "+" ? a + b : a - b;
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const w = ans + Math.floor(Math.random() * 16) - 8;
      if (w !== ans) wrongs.add(w);
    }
    return {
      expr: `${a} ${op} ${b}`,
      ans,
      opts: [...wrongs, ans].sort(() => Math.random() - 0.5),
    };
  }

  useEffect(() => {
    if (total >= 8) {
      onDone(Math.round((correct / 8) * 100));
    }
  }, [total]);

  const pick = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const ok = opt === question.ans;
    if (ok) {
      setCorrect((c) => c + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setTimeout(() => {
      setTotal((t) => t + 1);
      setQuestion(makeQ());
      setSelected(null);
    }, 500);
  };

  return (
    <View style={{ flex: 1, gap: 12 }}>
      <View
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 16,
          padding: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
          Q {total + 1}/8 · ✅ {correct}
        </Text>
        <Text
          style={{
            color: COLOR,
            fontSize: 42,
            fontWeight: "900",
            marginTop: 6,
          }}
        >
          {question.expr} = ?
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {question.opts.map((opt) => {
          const isSel = selected === opt;
          const isOk = opt === question.ans;
          let bg = COLORS.card;
          if (selected !== null && isOk) bg = COLORS.success + "30";
          else if (isSel && !isOk) bg = COLORS.error + "30";
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => pick(opt)}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: bg,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{ color: COLORS.text, fontSize: 22, fontWeight: "700" }}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Mini-game 3: Focus Tap ─────────────────────────────────────
function MiniFocus({ onDone }) {
  const TARGET_SHAPE = "⭐";
  const DISTRACTORS = ["●", "■", "▲", "◆"];
  const [items] = useState(() => {
    const arr = [];
    for (let i = 0; i < 16; i++) {
      arr.push(
        Math.random() < 0.35
          ? TARGET_SHAPE
          : DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)],
      );
    }
    return arr;
  });
  const [tapped, setTapped] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const handleTap = (i) => {
    if (submitted) return;
    setTapped((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const submit = () => {
    setSubmitted(true);
    const targets = items
      .map((item, i) => (item === TARGET_SHAPE ? i : -1))
      .filter((i) => i !== -1);
    const correct = tapped.filter((i) => targets.includes(i)).length;
    const missed = targets.length - correct;
    const falsePos = tapped.filter((i) => !targets.includes(i)).length;
    const score = Math.max(
      0,
      Math.round(((correct - missed - falsePos) / targets.length) * 100),
    );
    setTimeout(() => onDone(score), 800);
  };

  return (
    <View style={{ flex: 1, gap: 12 }}>
      <Text
        style={{
          color: COLORS.textSecondary,
          fontSize: 13,
          textAlign: "center",
        }}
      >
        Tap all ⭐ — ignore the shapes!
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          justifyContent: "center",
        }}
      >
        {items.map((item, i) => {
          const isTapped = tapped.includes(i);
          const isTarget = item === TARGET_SHAPE;
          let bg = COLORS.card;
          if (submitted) {
            bg = isTarget
              ? COLORS.success + "30"
              : isTapped
                ? COLORS.error + "30"
                : COLORS.card;
          } else if (isTapped) bg = COLOR + "30";
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleTap(i)}
              style={{
                width: 60,
                height: 60,
                borderRadius: 12,
                backgroundColor: bg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: isTapped ? COLOR : COLORS.border,
              }}
            >
              <Text style={{ fontSize: 26 }}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!submitted && (
        <TouchableOpacity
          onPress={submit}
          style={{
            backgroundColor: COLOR,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#000", fontWeight: "700" }}>Done!</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Mini-game 4: Memory Blitz ──────────────────────────────────
function MiniMemory({ onDone }) {
  const EMOJIS = ["🍕", "🌵", "🎸", "💎", "🚀", "🌙", "🦊", "🎯", "🔮", "🌈"];
  const SEQ_LEN = 5;
  const [sequence] = useState(() =>
    Array.from(
      { length: SEQ_LEN },
      () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    ),
  );
  const [phase, setPhase] = useState("show"); // show | recall
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (phase !== "show") return;
    const t = setTimeout(() => setPhase("recall"), 2500);
    return () => clearTimeout(t);
  }, [phase]);

  const pick = (emoji) => {
    if (selected.length >= SEQ_LEN) return;
    const next = [...selected, emoji];
    setSelected(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (next.length === SEQ_LEN) {
      const correct = next.filter((e, i) => e === sequence[i]).length;
      const score = Math.round((correct / SEQ_LEN) * 100);
      setTimeout(() => onDone(score), 600);
    }
  };

  return (
    <View style={{ flex: 1, gap: 12 }}>
      {phase === "show" && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
            Memorize this sequence!
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {sequence.map((e, i) => (
              <Text key={i} style={{ fontSize: 40 }}>
                {e}
              </Text>
            ))}
          </View>
        </View>
      )}
      {phase === "recall" && (
        <>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            Recreate the sequence!
          </Text>
          <View
            style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}
          >
            {Array.from({ length: SEQ_LEN }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: selected[i] ? COLOR + "20" : COLORS.card,
                  borderWidth: 1,
                  borderColor: selected[i] ? COLOR : COLORS.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 24 }}>{selected[i] || ""}</Text>
              </View>
            ))}
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
            }}
          >
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => pick(e)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  backgroundColor: COLORS.card,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 28 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Main Brain Storm Game ──────────────────────────────────────
const ROUNDS = [
  { name: "⚡ Quick Tap", component: MiniReaction, color: "#22C55E" },
  { name: "🔢 Speed Math", component: MiniMath, color: "#A78BFA" },
  { name: "⭐ Focus Tap", component: MiniFocus, color: "#F472B6" },
  { name: "🧠 Memory Blitz", component: MiniMemory, color: COLORS.primary },
];

export default function BrainStorm() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [roundIdx, setRoundIdx] = useState(0);
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [showIntro, setShowIntro] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const timerRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showIntro || gameOver) return;
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: ROUND_DURATION * 1000,
      useNativeDriver: false,
    }).start();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          nextRound(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [roundIdx, showIntro]);

  const nextRound = (score) => {
    clearInterval(timerRef.current);
    const newScores = [...scores, score];
    setScores(newScores);
    if (roundIdx + 1 >= ROUNDS.length) {
      const total = newScores.reduce((a, b) => a + b, 0);
      const xp = Math.round((total / (ROUNDS.length * 100)) * 550 + 80);
      setXpEarned(xp);
      recordGameResult("brain-storm", total, xp);
      setGameOver(true);
    } else {
      setRoundIdx((i) => i + 1);
      setTimeLeft(ROUND_DURATION);
      setShowIntro(true);
    }
  };

  const startRound = () => setShowIntro(false);

  const resetGame = () => {
    clearInterval(timerRef.current);
    progressAnim.setValue(1);
    setRoundIdx(0);
    setScores([]);
    setTimeLeft(ROUND_DURATION);
    setShowIntro(true);
    setGameOver(false);
    setXpEarned(0);
  };

  const round = ROUNDS[roundIdx];
  const RoundComponent = round.component;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  const totalScore = scores.reduce((a, b) => a + b, 0);

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
          Brain Storm
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
          Round {roundIdx + 1}/{ROUNDS.length}
        </Text>
      </View>

      {/* Round dots */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 20,
          marginBottom: 12,
        }}
      >
        {ROUNDS.map((r, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                i < roundIdx
                  ? COLORS.success
                  : i === roundIdx
                    ? round.color
                    : COLORS.border,
            }}
          />
        ))}
      </View>

      {/* Timer */}
      {!showIntro && !gameOver && (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text
              style={{ color: round.color, fontSize: 13, fontWeight: "700" }}
            >
              {round.name}
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
            style={{
              height: 4,
              backgroundColor: COLORS.border,
              borderRadius: 2,
            }}
          >
            <Animated.View
              style={{
                height: 4,
                borderRadius: 2,
                width: progressWidth,
                backgroundColor: round.color,
              }}
            />
          </View>
        </View>
      )}

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {showIntro && !gameOver && (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <Text style={{ fontSize: 52 }}>{round.name.split(" ")[0]}</Text>
            <Text
              style={{ color: round.color, fontSize: 24, fontWeight: "800" }}
            >
              {round.name.split(" ").slice(1).join(" ")}
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {roundIdx === 0 &&
                "Tap as fast as you can when the circle turns green!"}
              {roundIdx === 1 && "Solve 8 rapid equations as fast as possible!"}
              {roundIdx === 2 &&
                "Tap all the ⭐ stars — ignore the other shapes!"}
              {roundIdx === 3 &&
                "Memorize 5 emojis — then recreate the sequence!"}
            </Text>
            <TouchableOpacity
              onPress={startRound}
              style={{
                backgroundColor: round.color,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 48,
              }}
            >
              <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>
                Start Round {roundIdx + 1}
              </Text>
            </TouchableOpacity>
            {scores.length > 0 && (
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                Score so far: {scores.reduce((a, b) => a + b, 0)}
              </Text>
            )}
          </View>
        )}

        {!showIntro && !gameOver && <RoundComponent onDone={nextRound} />}
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
              {totalScore >= 300 ? "🌪️" : totalScore >= 200 ? "🔥" : "💡"}
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 26, fontWeight: "800" }}
            >
              Brain Storm!
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                marginTop: 4,
              }}
            >
              Total: {totalScore}/{ROUNDS.length * 100}
            </Text>
            <View style={{ width: "100%", marginTop: 16, gap: 8 }}>
              {ROUNDS.map((r, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    backgroundColor: COLORS.cardLight,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: COLORS.text, fontSize: 14 }}>
                    {r.name}
                  </Text>
                  <Text
                    style={{ color: r.color, fontSize: 14, fontWeight: "700" }}
                  >
                    {scores[i] ?? 0}/100
                  </Text>
                </View>
              ))}
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
