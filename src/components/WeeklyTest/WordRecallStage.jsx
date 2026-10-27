import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { COLORS } from "@/constants/theme";
import { WORD_BANK } from "@/constants/weeklyTestData";
import { shuffle } from "@/utils/weeklyTestUtils";

export function WordRecallStage({ onComplete }) {
  const targets = useRef(shuffle(WORD_BANK).slice(0, 5)).current;
  const distractors = useRef(
    shuffle(WORD_BANK.filter((w) => !targets.includes(w))).slice(0, 5),
  ).current;
  const all = useRef(shuffle([...targets, ...distractors])).current;

  const [phase, setPhase] = useState("showing");
  const [timeLeft, setTimeLeft] = useState(5);
  const [selected, setSelected] = useState([]);
  const [done, setDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase !== "showing") return;
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(iv);
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
    return () => clearInterval(iv);
  }, [phase]);

  const toggle = (w) => {
    if (done) return;
    setSelected((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w],
    );
  };

  const handleSubmit = () => {
    if (done) return;
    setDone(true);
    const correct = selected.filter((w) => targets.includes(w)).length;
    const wrong = selected.filter((w) => !targets.includes(w)).length;
    const score = Math.max(
      0,
      Math.round(((correct - wrong * 0.5) / targets.length) * 100),
    );
    setTimeout(() => onComplete(score), 800);
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
        STAGE 5 OF 5 · RECALL
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
          ? "Remember these words!"
          : "Which words did you see?"}
      </Text>

      {phase === "showing" ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: COLORS.secondary + "20",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: COLORS.secondary + "60",
              marginBottom: 32,
            }}
          >
            <Text
              style={{
                color: COLORS.secondary,
                fontSize: 26,
                fontWeight: "800",
              }}
            >
              {timeLeft}
            </Text>
          </View>
          {targets.map((w) => (
            <View
              key={w}
              style={{
                backgroundColor: COLORS.primary + "20",
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: COLORS.primary + "40",
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 18,
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                {w}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, marginTop: 20 }}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            Select the {targets.length} words you memorised:
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {all.map((w) => {
              const isSel = selected.includes(w);
              const isCorrect = targets.includes(w);
              let bg = COLORS.card;
              let border = COLORS.border;
              let txtColor = COLORS.text;
              if (isSel) {
                bg = COLORS.secondary + "20";
                border = COLORS.secondary;
                txtColor = COLORS.secondary;
              }
              if (done && isSel) {
                bg = isCorrect ? COLORS.success + "20" : COLORS.error + "20";
                border = isCorrect ? COLORS.success : COLORS.error;
                txtColor = isCorrect ? COLORS.success : COLORS.error;
              }
              return (
                <TouchableOpacity
                  key={w}
                  onPress={() => toggle(w)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: bg,
                    borderWidth: 1.5,
                    borderColor: border,
                  }}
                >
                  <Text
                    style={{ color: txtColor, fontSize: 14, fontWeight: "700" }}
                  >
                    {w}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={selected.length === 0 || done}
            style={{
              marginTop: 24,
              backgroundColor:
                selected.length > 0 ? COLORS.primary : COLORS.border,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              Submit Answers ({selected.length}/{targets.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </Animated.View>
  );
}
