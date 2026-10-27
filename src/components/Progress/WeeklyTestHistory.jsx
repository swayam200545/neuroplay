import React from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { COLORS } from "@/constants/theme";

const { width } = Dimensions.get("window");
const CHART_W = width - 40;

export function WeeklyTestHistory({ weeklyTestHistory }) {
  if (weeklyTestHistory.length === 0) return null;

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 14,
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text
        style={{
          color: COLORS.text,
          fontSize: 16,
          fontWeight: "700",
          marginBottom: 16,
        }}
      >
        🧪 Weekly Test History
      </Text>
      {/* Mini bar chart of weekly scores */}
      {weeklyTestHistory.length >= 2 && (
        <View style={{ marginBottom: 16 }}>
          <Svg width={CHART_W - 40} height={80}>
            {weeklyTestHistory.map((t, i) => {
              const barH = Math.max(4, (t.overallScore / 100) * 60);
              const x = i * ((CHART_W - 40) / weeklyTestHistory.length) + 4;
              const barW = (CHART_W - 40) / weeklyTestHistory.length - 8;
              const y = 60 - barH;
              const color =
                t.overallScore >= 75
                  ? COLORS.success
                  : t.overallScore >= 50
                    ? COLORS.secondary
                    : COLORS.highlight;
              return (
                <React.Fragment key={i}>
                  <Rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={4}
                    fill={color + "90"}
                  />
                  <SvgText
                    x={x + barW / 2}
                    y={75}
                    fill={COLORS.textSecondary}
                    fontSize={8}
                    textAnchor="middle"
                  >
                    {t.date.slice(5)}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </View>
      )}
      {[...weeklyTestHistory]
        .reverse()
        .slice(0, 4)
        .map((t, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: i < 3 ? 1 : 0,
              borderBottomColor: COLORS.border,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: COLORS.secondary + "15",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text
                style={{
                  color: COLORS.secondary,
                  fontSize: 14,
                  fontWeight: "800",
                }}
              >
                {t.overallScore}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 8 }}>
                /100
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                Brain Test
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  marginTop: 1,
                }}
              >
                {t.date}
              </Text>
            </View>
            <View style={{ gap: 4 }}>
              {["memory", "speed", "focus"].map((k) => (
                <View
                  key={k}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: COLORS.border,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: COLORS.secondary,
                        width: `${t[k] || 0}%`,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: 9,
                      width: 26,
                    }}
                  >
                    {t[k] || 0}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
    </View>
  );
}
