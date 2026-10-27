import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../../constants/theme";
import useGameStore from "../../../store/gameStore";

const COLOR = "#E879F9";

// ─── Round generator — gets harder each wave ─────────────────────
function getChallenge(wave) {
  const types = ["reaction", "math", "memory", "pattern", "focus"];
  // Higher waves unlock more types and harder configs
  const available =
    wave < 3 ? types.slice(0, 2) : wave < 6 ? types.slice(0, 4) : types;
  const type = available[Math.floor(Math.random() * available.length)];
  return { type, wave };
}

// ─── Reaction Challenge ──────────────────────────────────────────
function ReactionChallenge({ wave, onPass, onFail }) {
  const [state, setState] = useState("wait");
  const [rt, setRt] = useState(null);
  const startRef = useRef(null);
  const timerRef = useRef(null);
  const maxTime = Math.max(250, 600 - wave * 20); // gets tighter

  useEffect(() => {
    const delay = 800 + Math.random() * 2000;
    timerRef.current = setTimeout(() => {
      setState("tap");
      startRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        onFail();
      }, maxTime + 100);
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleTap = () => {
    clearTimeout(timerRef.current);
    if (state === "tap") {
      const elapsed = Date.now() - startRef.current;
      setRt(elapsed);
      setState("result");
      if (elapsed <= maxTime) {
        setTimeout(onPass, 700);
      } else {
        setTimeout(onFail, 700);
      }
    } else if (state === "wait") {
      setState("early");
      setTimeout(onFail, 600);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleTap}
      activeOpacity={1}
      style={{
        flex: 1,
        borderRadius: 20,
        backgroundColor:
          state === "tap"
            ? "#22C55E"
            : state === "early"
              ? COLORS.error + "40"
              : COLORS.card,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {state === "wait" && (
        <>
          <Text style={{ fontSize: 40 }}>⏳</Text>
          <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>
            Wait for green…
          </Text>
          <Text style={{ color: COLOR, fontSize: 12, marginTop: 8 }}>
            Limit: {maxTime}ms
          </Text>
        </>
      )}
      {state === "tap" && (
        <>
          <Text style={{ fontSize: 52 }}>🟢</Text>
          <Text style={{ color: "#000", fontSize: 22, fontWeight: "800" }}>
            TAP!
          </Text>
        </>
      )}
      {state === "result" && (
        <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "800" }}>
          {rt}ms
        </Text>
      )}
      {state === "early" && (
        <Text style={{ color: COLORS.error, fontSize: 24, fontWeight: "800" }}>
          Too early! 💀
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Math Challenge ─────────────────────────────────────────────
function MathChallenge({ wave, onPass, onFail }) {
  function makeQ() {
    const difficulty = Math.min(wave, 8);
    const ops =
      difficulty < 3
        ? ["+", "-"]
        : difficulty < 6
          ? ["+", "-", "×"]
          : ["+", "-", "×", "÷"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;
    if (op === "+") {
      a = Math.floor(Math.random() * 40 * difficulty) + 5;
      b = Math.floor(Math.random() * 30) + 5;
      answer = a + b;
    } else if (op === "-") {
      a = Math.floor(Math.random() * 80) + 30;
      b = Math.floor(Math.random() * 30) + 5;
      answer = a - b;
    } else if (op === "×") {
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * 8) + 2;
      answer = a * b;
    } else {
      b = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];
      a = b * (Math.floor(Math.random() * 10) + 2);
      answer = a / b;
    }
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const w = answer + Math.floor(Math.random() * 20) - 10;
      if (w !== answer && w > 0) wrongs.add(w);
    }
    return {
      expr: `${a} ${op} ${b}`,
      answer,
      opts: [...wrongs, answer].sort(() => Math.random() - 0.5),
    };
  }
  const [q] = useState(() => makeQ());
  const [selected, setSelected] = useState(null);
  const timeLimit = Math.max(3000, 10000 - wave * 500);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(onFail, timeLimit);
    return () => clearTimeout(timerRef.current);
  }, []);

  const pick = (opt) => {
    clearTimeout(timerRef.current);
    setSelected(opt);
    if (opt === q.answer) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(onPass, 500);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(onFail, 700);
    }
  };

  return (
    <View style={{ flex: 1, gap: 16 }}>
      <View
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 16,
          padding: 24,
          alignItems: "center",
        }}
      >
        <Text style={{ color: COLOR, fontSize: 44, fontWeight: "900" }}>
          {q.expr} = ?
        </Text>
        <Text
          style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 4 }}
        >
          {(timeLimit / 1000).toFixed(1)}s limit
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {q.opts.map((opt) => {
          const isSel = selected === opt;
          const isOk = opt === q.answer;
          let bg = COLORS.card;
          if (isSel && isOk) bg = COLORS.success + "30";
          else if (isSel && !isOk) bg = COLORS.error + "30";
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                if (!selected) pick(opt);
              }}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: bg,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 2,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{ color: COLORS.text, fontSize: 24, fontWeight: "700" }}
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

// ─── Memory Challenge ────────────────────────────────────────────
function MemoryChallenge({ wave, onPass, onFail }) {
  const len = Math.min(3 + Math.floor(wave / 2), 9);
  const EMOJIS = [
    "🔥",
    "💎",
    "⭐",
    "🌙",
    "⚡",
    "🔮",
    "🦊",
    "🎯",
    "🚀",
    "🌵",
    "🎸",
    "🐬",
  ];
  const [seq] = useState(() =>
    Array.from(
      { length: len },
      () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    ),
  );
  const [phase, setPhase] = useState("show");
  const [input, setInput] = useState([]);

  useEffect(() => {
    const showTime = Math.max(1000, 2500 - wave * 100);
    const t = setTimeout(() => setPhase("recall"), showTime);
    return () => clearTimeout(t);
  }, []);

  const pick = (e) => {
    const next = [...input, e];
    setInput(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (next.length === len) {
      const correct = next.every((v, i) => v === seq[i]);
      setTimeout(correct ? onPass : onFail, 400);
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
          <Text style={{ color: COLORS.textSecondary }}>
            Memorize {len} items!
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
            }}
          >
            {seq.map((e, i) => (
              <Text key={i} style={{ fontSize: 36 }}>
                {e}
              </Text>
            ))}
          </View>
        </View>
      )}
      {phase === "recall" && (
        <>
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {Array.from({ length: len }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: input[i] ? COLOR + "20" : COLORS.card,
                  borderWidth: 1,
                  borderColor: input[i] ? COLOR : COLORS.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 22 }}>{input[i] || ""}</Text>
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

// ─── Pattern Challenge ───────────────────────────────────────────
function PatternChallenge({ wave, onPass, onFail }) {
  const COLORS_LIST = ["#E879F9", "#38BDF8", "#4ADE80", "#F97316", "#F472B6"];
  const len = Math.min(3 + Math.floor(wave / 2), 8);
  const [seq] = useState(() =>
    Array.from(
      { length: len },
      () => COLORS_LIST[Math.floor(Math.random() * COLORS_LIST.length)],
    ),
  );
  const [showIdx, setShowIdx] = useState(0);
  const [phase, setPhase] = useState("show");
  const [input, setInput] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase !== "show") return;
    const speed = Math.max(300, 700 - wave * 30);
    timerRef.current = setTimeout(() => {
      if (showIdx + 1 >= len) {
        setPhase("recall");
      } else {
        setShowIdx((i) => i + 1);
      }
    }, speed);
    return () => clearTimeout(timerRef.current);
  }, [showIdx, phase]);

  const tap = (color) => {
    const next = [...input, color];
    setInput(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (next[next.length - 1] !== seq[next.length - 1]) {
      setTimeout(onFail, 300);
      return;
    }
    if (next.length === len) {
      setTimeout(onPass, 300);
    }
  };

  return (
    <View style={{ flex: 1, gap: 16 }}>
      <Text
        style={{
          color: COLORS.textSecondary,
          fontSize: 13,
          textAlign: "center",
        }}
      >
        {phase === "show"
          ? `Watch the sequence… (${showIdx + 1}/${len})`
          : "Repeat the sequence!"}
      </Text>
      {phase === "show" && (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: seq[showIdx],
            }}
          />
        </View>
      )}
      {phase === "recall" && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            flex: 1,
            alignItems: "center",
          }}
        >
          {COLORS_LIST.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => tap(c)}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: c,
                shadowColor: c,
                shadowOpacity: 0.6,
                shadowRadius: 8,
              }}
            />
          ))}
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 4, justifyContent: "center" }}>
        {seq.map((c, i) => (
          <View
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor:
                input[i] === c
                  ? c
                  : i < input.length
                    ? COLORS.error
                    : COLORS.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Focus Challenge ─────────────────────────────────────────────
function FocusChallenge({ wave, onPass, onFail }) {
  const targets = ["⭐", "💎", "🔥"][wave % 3];
  const items = [];
  for (let i = 0; i < 12 + wave; i++) {
    const isTarget = Math.random() < 0.3;
    items.push(
      isTarget
        ? targets
        : ["●", "■", "▲", "◆", "✦"][Math.floor(Math.random() * 5)],
    );
  }
  const [cells] = useState(items);
  const [tapped, setTapped] = useState([]);
  const [done, setDone] = useState(false);

  const tap = (i) => {
    if (done) return;
    setTapped((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const submit = () => {
    setDone(true);
    const targetIdxs = cells
      .map((c, i) => (c === targets ? i : -1))
      .filter((i) => i !== -1);
    const correct = tapped.filter((i) => targetIdxs.includes(i)).length;
    const fp = tapped.filter((i) => !targetIdxs.includes(i)).length;
    const missed = targetIdxs.length - correct;
    if (fp > 1 || missed > 1) {
      setTimeout(onFail, 500);
    } else {
      setTimeout(onPass, 500);
    }
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
        Tap all {targets} only!
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
        }}
      >
        {cells.map((item, i) => {
          const isTapped = tapped.includes(i);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => tap(i)}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: isTapped ? COLOR + "30" : COLORS.card,
                borderWidth: 2,
                borderColor: isTapped ? COLOR : COLORS.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 24 }}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity
        onPress={submit}
        style={{
          backgroundColor: COLOR,
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#000", fontWeight: "700" }}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Neural Nexus ───────────────────────────────────────────
const CHALLENGE_MAP = {
  reaction: ReactionChallenge,
  math: MathChallenge,
  memory: MemoryChallenge,
  pattern: PatternChallenge,
  focus: FocusChallenge,
};

export default function NeuralNexus() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recordGameResult = useGameStore((s) => s.recordGameResult);

  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [challenge, setChallenge] = useState(() => getChallenge(1));
  const [phase, setPhase] = useState("intro"); // intro | play | result
  const [highestWave, setHighestWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [streak, setStreak] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  useEffect(() => {
    startPulse();
  }, []);

  const handlePass = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const nextWave = wave + 1;
    const newStreak = streak + 1;
    setWave(nextWave);
    setStreak(newStreak);
    setHighestWave(Math.max(nextWave, highestWave));
    if (newStreak % 5 === 0) {
      setLives((l) => Math.min(l + 1, 5));
    } // bonus life every 5 streak
    setChallenge(getChallenge(nextWave));
    setPhase("intro");
  }, [wave, streak, highestWave]);

  const handleFail = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    const newLives = lives - 1;
    setLives(newLives);
    setStreak(0);
    if (newLives <= 0) {
      const score = wave * 10 + highestWave * 5;
      const xp = Math.round((score / 500) * 700 + 80);
      setXpEarned(xp);
      recordGameResult("neural-nexus", score, xp);
      setGameOver(true);
    } else {
      setChallenge(getChallenge(wave));
      setPhase("intro");
    }
  }, [lives, wave, highestWave]);

  const resetGame = () => {
    setWave(1);
    setLives(3);
    setChallenge(getChallenge(1));
    setPhase("intro");
    setHighestWave(1);
    setGameOver(false);
    setXpEarned(0);
    setStreak(0);
  };

  const ChallengeComponent = CHALLENGE_MAP[challenge.type];
  const typeLabel = {
    reaction: "⚡ Reaction",
    math: "🔢 Math",
    memory: "🧠 Memory",
    pattern: "🔮 Pattern",
    focus: "🎯 Focus",
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
          Neural Nexus
        </Text>
        <Text style={{ color: COLOR, fontSize: 13, fontWeight: "700" }}>
          Wave {wave}
        </Text>
      </View>

      {/* HUD */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          gap: 12,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
            Lives
          </Text>
          <Text style={{ color: COLORS.error, fontSize: 18 }}>
            {"❤️".repeat(lives)}
            {"🖤".repeat(Math.max(0, 3 - lives))}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
            Streak
          </Text>
          <Text style={{ color: COLOR, fontSize: 18, fontWeight: "700" }}>
            🔥 {streak}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
            Best
          </Text>
          <Text
            style={{ color: COLORS.highlight, fontSize: 18, fontWeight: "700" }}
          >
            W{highestWave}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {phase === "intro" && !gameOver && (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: COLOR + "20",
                  borderWidth: 3,
                  borderColor: COLOR,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 40 }}>🌌</Text>
              </View>
            </Animated.View>
            <Text style={{ color: COLOR, fontSize: 28, fontWeight: "900" }}>
              Wave {wave}
            </Text>
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
            >
              <Text
                style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}
              >
                {typeLabel[challenge.type]}
              </Text>
            </View>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              {wave <= 5
                ? "You're just warming up…"
                : wave <= 15
                  ? "The Nexus is testing you."
                  : wave <= 30
                    ? "Very few make it this far."
                    : "You are beyond human. 🧬"}
            </Text>
            <TouchableOpacity
              onPress={() => setPhase("play")}
              style={{
                backgroundColor: COLOR,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 52,
              }}
            >
              <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>
                Enter Wave {wave}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "play" && !gameOver && (
          <ChallengeComponent
            wave={wave}
            onPass={handlePass}
            onFail={handleFail}
          />
        )}
      </View>

      {gameOver && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.95)",
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
              {wave > 30 ? "🌌" : wave > 15 ? "🌪️" : wave > 8 ? "🔥" : "💡"}
            </Text>
            <Text
              style={{ color: COLORS.text, fontSize: 26, fontWeight: "800" }}
            >
              Nexus Conquered!
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                marginTop: 6,
              }}
            >
              Reached Wave {wave}
            </Text>
            <View
              style={{
                backgroundColor: COLOR + "15",
                borderRadius: 12,
                padding: 16,
                marginTop: 16,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                Highest Wave
              </Text>
              <Text style={{ color: COLOR, fontSize: 40, fontWeight: "900" }}>
                {highestWave}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                {wave > 20
                  ? "Elite brain performance 🧬"
                  : wave > 10
                    ? "Impressive endurance 🔥"
                    : "Keep training 💪"}
              </Text>
            </View>
            <Text
              style={{
                color: COLORS.highlight,
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
