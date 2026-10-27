import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { COLORS } from "@/constants/theme";
import { STAGE_INFO } from "@/constants/weeklyTestData";

export function IntroStage({ onStart }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text
          style={{
            color: COLORS.secondary,
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          WEEKLY BRAIN TEST
        </Text>
        <Text
          style={{
            color: COLORS.text,
            fontSize: 30,
            fontWeight: "800",
            lineHeight: 36,
          }}
        >
          5 Challenges{"\n"}Await You 🧠
        </Text>
        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 14,
            marginTop: 10,
            lineHeight: 21,
          }}
        >
          Push your brain to the limit. Complete all 5 stages to receive your
          Brain Score and compare with last week.
        </Text>

        <View style={{ marginTop: 28, gap: 10 }}>
          {STAGE_INFO.map((s, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                backgroundColor: COLORS.card,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: COLORS.secondary + "18",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>{s.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {s.label}
                </Text>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {s.desc}
                </Text>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: COLORS.secondary + "25",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: COLORS.secondary,
                    fontSize: 11,
                    fontWeight: "800",
                  }}
                >
                  {i + 1}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View
          style={{
            marginTop: 20,
            backgroundColor: COLORS.secondary + "12",
            borderRadius: 14,
            padding: 14,
            flexDirection: "row",
            gap: 10,
            borderWidth: 1,
            borderColor: COLORS.secondary + "30",
          }}
        >
          <Text style={{ fontSize: 20 }}>⏱</Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 13,
              flex: 1,
              lineHeight: 19,
            }}
          >
            Estimated time:{" "}
            <Text style={{ color: COLORS.text, fontWeight: "700" }}>
              ~5 minutes.
            </Text>{" "}
            Find a quiet spot and give it your full focus!
          </Text>
        </View>

        <TouchableOpacity
          onPress={onStart}
          style={{
            marginTop: 28,
            backgroundColor: COLORS.secondary,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#000", fontSize: 16, fontWeight: "800" }}>
            Begin Test 🚀
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}
