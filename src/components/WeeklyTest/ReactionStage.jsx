import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { COLORS } from "@/constants/theme";

export function ReactionStage({ onComplete }) {
  const TOTAL_ROUNDS = 4;
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState("wait");
  const [times, setTimes] = useState([]);
  const [tooEarly, setTooEarly] = useState(false);
  const startRef = useRef(null);
  const timerRef = useRef(null);
  const bgAnim = useRef(new Animated.Value(0)).current;

  const startRound = useCallback(() => {
    setPhase("wait");
    setTooEarly(false);
    const delay = 1500 + Math.random() * 2500;
    timerRef.current = setTimeout(() => {
      setPhase("go");
      startRef.current = Date.now();
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }, delay);
  }, []);

  useEffect(() => {
    startRound();
    return () => clearTimeout(timerRef.current);
  }, []);

  const bg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.card, COLORS.success + "50"],
  });

  const handleTap = () => {
    if (phase === "wait") {
      clearTimeout(timerRef.current);
      setTooEarly(true);
      setPhase("result");
      setTimeout(() => {
        bgAnim.setValue(0);
        if (round + 1 < TOTAL_ROUNDS) {
          setRound((r) => r + 1);
          startRound();
        } else {
          const valid = [...times];
          const avg =
            valid.length > 0
              ? valid.reduce((a, b) => a + b, 0) / valid.length
              : 500;
          const score = Math.max(
            0,
            Math.min(100, Math.round((1000 - avg) / 9)),
          );
          onComplete(score);
        }
      }, 1200);
      return;
    }
    if (phase === "go") {
      const rt = Date.now() - startRef.current;
      const newTimes = [...times, rt];
      setTimes(newTimes);
      setPhase("result");
      bgAnim.setValue(0);
      setTimeout(() => {
        if (round + 1 < TOTAL_ROUNDS) {
          setRound((r) => r + 1);
          startRound();
        } else {
          const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
          const score = Math.max(
            0,
            Math.min(100, Math.round((1000 - avg) / 9)),
          );
          onComplete(score);
        }
      }, 900);
    }
  };

  const lastTime = times[times.length - 1];

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text
        style={{
          color: COLORS.secondary,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 2,
        }}
      >
        STAGE 2 OF 5 · REACTION
      </Text>
      <Text
        style={{
          color: COLORS.text,
          fontSize: 22,
          fontWeight: "800",
          marginTop: 10,
        }}
      >
        Tap when it turns green!
      </Text>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginTop: 20,
          marginBottom: 30,
        }}
      >
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: i <= round ? COLORS.secondary : COLORS.border,
            }}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={handleTap}
        activeOpacity={0.95}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={{
            flex: 1,
            borderRadius: 24,
            backgroundColor: bg,
            borderWidth: 1,
            borderColor: phase === "go" ? COLORS.success : COLORS.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {phase === "wait" && (
            <>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: COLORS.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 32 }}>⏳</Text>
              </View>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 14,
                  marginTop: 16,
                }}
              >
                Wait for green…
              </Text>
            </>
          )}
          {phase === "go" && (
            <>
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: COLORS.success + "40",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 44 }}>🟢</Text>
              </View>
              <Text
                style={{
                  color: COLORS.success,
                  fontSize: 18,
                  fontWeight: "700",
                  marginTop: 16,
                }}
              >
                TAP NOW!
              </Text>
            </>
          )}
          {phase === "result" && (
            <>
              <Text style={{ fontSize: 44 }}>{tooEarly ? "😬" : "✅"}</Text>
              <Text
                style={{
                  color: tooEarly ? COLORS.error : COLORS.success,
                  fontSize: 18,
                  fontWeight: "700",
                  marginTop: 12,
                }}
              >
                {tooEarly ? "Too early!" : `${lastTime}ms`}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                Round {round + 1}/{TOTAL_ROUNDS}
              </Text>
            </>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
