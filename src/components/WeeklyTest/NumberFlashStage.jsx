import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { COLORS } from "@/constants/theme";
import { fakeSequences } from "@/utils/weeklyTestUtils";

export function NumberFlashStage({ onComplete }) {
  const sequence = useRef(
    Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join(""),
  ).current;
  const options = useRef(fakeSequences(sequence)).current;
  const [phase, setPhase] = useState("showing");
  const [timeLeft, setTimeLeft] = useState(4);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase !== "showing") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            setPhase("recalling");
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }).start();
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleSelect = (opt) => {
    if (done) return;
    setSelected(opt);
    setDone(true);
    const score = opt === sequence ? 100 : 0;
    setTimeout(() => onComplete(score), 1000);
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, padding: 24 }}>
      <Text
        style={{
          color: COLORS.secondary,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 2,
        }}
      >
        STAGE 1 OF 5 · MEMORY
      </Text>
      <Text
        style={{
          color: COLORS.text,
          fontSize: 22,
          fontWeight: "800",
          marginTop: 10,
        }}
      >
        {phase === "showing"
          ? "Memorise the sequence!"
          : "Which sequence was it?"}
      </Text>

      {phase === "showing" ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: COLORS.secondary + "20",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: COLORS.secondary + "60",
              marginBottom: 36,
            }}
          >
            <Text
              style={{
                color: COLORS.secondary,
                fontSize: 28,
                fontWeight: "800",
              }}
            >
              {timeLeft}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {sequence.split("").map((d, i) => (
              <View
                key={i}
                style={{
                  width: 52,
                  height: 64,
                  borderRadius: 12,
                  backgroundColor: COLORS.primary + "25",
                  borderWidth: 2,
                  borderColor: COLORS.primary + "60",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: COLORS.primary,
                    fontSize: 28,
                    fontWeight: "800",
                  }}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>
          <Text
            style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 24 }}
          >
            Remember this sequence…
          </Text>
        </View>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", gap: 14, marginTop: 30 }}
        >
          {options.map((opt) => {
            let bg = COLORS.card;
            let border = COLORS.border;
            if (done) {
              if (opt === sequence) {
                bg = COLORS.success + "20";
                border = COLORS.success;
              } else if (opt === selected) {
                bg = COLORS.error + "20";
                border = COLORS.error;
              }
            }
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => handleSelect(opt)}
                disabled={done}
                style={{
                  backgroundColor: bg,
                  borderRadius: 14,
                  paddingVertical: 18,
                  alignItems: "center",
                  borderWidth: 1.5,
                  borderColor: border,
                }}
              >
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {opt.split("").map((d, i) => (
                    <Text
                      key={i}
                      style={{
                        color: COLORS.text,
                        fontSize: 24,
                        fontWeight: "800",
                      }}
                    >
                      {d}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
}
