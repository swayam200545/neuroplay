import React, { useState } from "react";
import { View, Dimensions } from "react-native";
import Svg, {
  Rect,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { COLORS } from "@/constants/theme";

const CHART_H = 150;

function makePlaceholderBars(n = 7) {
  const bars = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    bars.push({ date: d.toISOString().split("T")[0], xp: 0, games: 0 });
  }
  return bars;
}

export function WeeklyBarChart({ dailyHistory, filterDays }) {
  const [containerWidth, setContainerWidth] = useState(0);

  const raw = filterDays ? dailyHistory.slice(-filterDays) : dailyHistory;
  const isPlaceholder = raw.length === 0;
  const data = isPlaceholder ? makePlaceholderBars(7) : raw;

  const CHART_W = containerWidth;
  const maxXP = isPlaceholder ? 100 : Math.max(...data.map((d) => d.xp), 100);
  const chartPad = 28;
  const avail = CHART_W - chartPad * 2;
  const spacing = avail / Math.max(data.length, 1);
  const BAR_W = Math.min(spacing * 0.55, 32);

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{ overflow: "hidden" }}
    >
      {CHART_W > 0 && (
        <Svg width={CHART_W} height={CHART_H + 36}>
          <Defs>
            <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.primary} stopOpacity="1" />
              <Stop offset="1" stopColor={COLORS.secondary} stopOpacity="0.6" />
            </LinearGradient>
            <LinearGradient id="barGradGhost" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.border} stopOpacity="0.6" />
              <Stop offset="1" stopColor={COLORS.border} stopOpacity="0.2" />
            </LinearGradient>
          </Defs>

          {/* Horizontal grid lines */}
          {[0, 0.33, 0.67, 1].map((pct) => {
            const y = CHART_H - pct * (CHART_H - 10);
            return (
              <Line
                key={pct}
                x1={chartPad}
                y1={y}
                x2={CHART_W - chartPad}
                y2={y}
                stroke={COLORS.border}
                strokeWidth={0.7}
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Bars */}
          {data.map((day, i) => {
            const barH = isPlaceholder
              ? 6
              : Math.max(4, (day.xp / maxXP) * (CHART_H - 14));
            const x = chartPad + i * spacing + (spacing - BAR_W) / 2;
            const y = CHART_H - barH;
            const parts = day.date.split("-");
            const label =
              parts.length >= 3 ? `${parts[1]}/${parts[2]}` : day.date.slice(5);
            return (
              <React.Fragment key={i}>
                <Rect
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={barH}
                  rx={6}
                  fill={isPlaceholder ? "url(#barGradGhost)" : "url(#barGrad)"}
                />
                <SvgText
                  x={x + BAR_W / 2}
                  y={CHART_H + 16}
                  fill={COLORS.textSecondary}
                  fontSize={9}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
                {!isPlaceholder && day.xp > 0 && (
                  <SvgText
                    x={x + BAR_W / 2}
                    y={y - 5}
                    fill={COLORS.primary}
                    fontSize={8}
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {day.xp}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}

          {/* Watermark when no data */}
          {isPlaceholder && (
            <SvgText
              x={CHART_W / 2}
              y={CHART_H / 2}
              fill={COLORS.textSecondary}
              fontSize={11}
              textAnchor="middle"
              opacity="0.6"
            >
              Play games to earn XP
            </SvgText>
          )}
        </Svg>
      )}
    </View>
  );
}
