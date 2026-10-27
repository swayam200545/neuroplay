import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { COLORS } from "@/constants/theme";
import { MATH_OPS } from "@/constants/weeklyTestData";
import { shuffle, fakeAnswers } from "@/utils/weeklyTestUtils";

const { width } = Dimensions.get("window");

export function MathStage({ onComplete }) {
  const questions = useRef(shuffle([...MATH_OPS])).current;
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [done, setDone] = useState(false);

  const finish = useCallback(
    (finalScore, total) => {
      if (done) return;
      setDone(true);
      setTimeout(() => onComplete(Math.round((finalScore / total) * 100)), 600);
    },
    [done],
  );

  useEffect(() => {
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(iv);
          finish(score, questions.length);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [score]);

  const handleAnswer = (ans) => {
    if (selected !== null || done) return;
    const q = questions[qi];
    const correct = ans === q.ans;
    setSelected(ans);
    const newScore = score + (correct ? 1 : 0);
    if (correct) setScore(newScore);
    setTimeout(() => {
      setSelected(null);
      if (qi + 1 >= questions.length) {
        finish(newScore, questions.length);
      } else {
        setQi((q) => q + 1);
      }
    }, 600);
  };

  if (qi >= questions.length) return null;
  const q = questions[qi];
  const opts = fakeAnswers(q.ans);

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
        STAGE 4 OF 5 · LOGIC
      </Text>
      <Text
        style={{
          color: COLORS.text,
          fontSize: 22,
          fontWeight: "800",
          marginTop: 10,
        }}
      >
        Math Sprint
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
          Question {qi + 1}/{questions.length}
        </Text>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor:
              timeLeft <= 8 ? COLORS.error + "30" : COLORS.secondary + "20",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: timeLeft <= 8 ? COLORS.error : COLORS.secondary,
          }}
        >
          <Text
            style={{
              color: timeLeft <= 8 ? COLORS.error : COLORS.secondary,
              fontSize: 16,
              fontWeight: "800",
            }}
          >
            {timeLeft}
          </Text>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 24,
            paddingHorizontal: 40,
            paddingVertical: 36,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: "center",
            marginBottom: 32,
            width: "100%",
          }}
        >
          <Text
            style={{
              color: COLORS.text,
              fontSize: 42,
              fontWeight: "900",
              letterSpacing: 2,
            }}
          >
            {q.a} {q.op} {q.b} = ?
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {opts.map((opt) => {
            let bg = COLORS.card;
            let border = COLORS.border;
            if (selected === opt) {
              bg = opt === q.ans ? COLORS.success + "25" : COLORS.error + "25";
              border = opt === q.ans ? COLORS.success : COLORS.error;
            }
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => handleAnswer(opt)}
                style={{
                  width: (width - 48 - 12) / 2 - 6,
                  paddingVertical: 20,
                  borderRadius: 16,
                  backgroundColor: bg,
                  borderWidth: 1.5,
                  borderColor: border,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 26,
                    fontWeight: "800",
                  }}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View
        style={{
          height: 6,
          backgroundColor: COLORS.border,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: COLORS.secondary,
            width: `${(score / questions.length) * 100}%`,
          }}
        />
      </View>
    </View>
  );
}
