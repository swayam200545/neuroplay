import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { COLORS } from "@/constants/theme";
import { VOWELS } from "@/constants/weeklyTestData";
import { shuffle } from "@/utils/weeklyTestUtils";

const { width } = Dimensions.get("window");

export function FocusStage({ onComplete }) {
  const consonants = "BCDFGHJKLMNPQRSTVWXYZ".split("");
  const grid = [
    ...shuffle(VOWELS).slice(0, 5),
    ...shuffle(consonants).slice(0, 7),
  ];
  const letters = useRef(shuffle(grid)).current;
  const vowelCount = letters.filter((l) => VOWELS.includes(l)).length;
  const [tapped, setTapped] = useState([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(iv);
          handleDone(tapped);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const handleDone = (finalTapped) => {
    if (done) return;
    setDone(true);
    const correct = finalTapped.filter((l) => VOWELS.includes(l)).length;
    const wrong = finalTapped.filter((l) => !VOWELS.includes(l)).length;
    const score = Math.max(
      0,
      Math.round(((correct - wrong * 0.5) / vowelCount) * 100),
    );
    setTimeout(() => onComplete(score), 800);
  };

  const tap = (l, i) => {
    if (done) return;
    const key = `${l}${i}`;
    const newTapped = tapped.includes(key)
      ? tapped.filter((t) => t !== key)
      : [...tapped, key];
    setTapped(newTapped);
  };

  const correct = tapped.filter((k) => VOWELS.includes(k[0])).length;

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
        STAGE 3 OF 5 · FOCUS
      </Text>
      <Text
        style={{
          color: COLORS.text,
          fontSize: 22,
          fontWeight: "800",
          marginTop: 10,
        }}
      >
        Tap all the vowels!
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 4 }}>
        A, E, I, O, U — ignore consonants
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 20,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor:
              timeLeft <= 5 ? COLORS.error + "30" : COLORS.secondary + "20",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: timeLeft <= 5 ? COLORS.error : COLORS.secondary,
          }}
        >
          <Text
            style={{
              color: timeLeft <= 5 ? COLORS.error : COLORS.secondary,
              fontSize: 18,
              fontWeight: "800",
            }}
          >
            {timeLeft}
          </Text>
        </View>
        <Text
          style={{ color: COLORS.textSecondary, fontSize: 13, marginLeft: 12 }}
        >
          {correct}/{vowelCount} vowels found
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
        }}
      >
        {letters.map((l, i) => {
          const key = `${l}${i}`;
          const isTapped = tapped.includes(key);
          const isVowel = VOWELS.includes(l);
          let bg = COLORS.card;
          let border = COLORS.border;
          let txtColor = COLORS.text;
          if (isTapped) {
            bg = isVowel ? COLORS.success + "25" : COLORS.error + "25";
            border = isVowel ? COLORS.success : COLORS.error;
            txtColor = isVowel ? COLORS.success : COLORS.error;
          }
          return (
            <TouchableOpacity
              key={key}
              onPress={() => tap(l, i)}
              style={{
                width: (width - 48 - 40) / 4,
                aspectRatio: 1,
                borderRadius: 14,
                backgroundColor: bg,
                borderWidth: 1.5,
                borderColor: border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: txtColor, fontSize: 22, fontWeight: "800" }}
              >
                {l}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={() => handleDone(tapped)}
        style={{
          marginTop: 28,
          backgroundColor: COLORS.primary,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
          Done ✓
        </Text>
      </TouchableOpacity>
    </View>
  );
}
