import React, { useState } from "react";
import { View, Text } from "react-native";
import Svg, {
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Polyline,
  Circle,
} from "react-native-svg";
import { COLORS } from "@/constants/theme";

const CHART_H = 140;
const PAD = { left: 36, right: 12, top: 12, bottom: 28 };

function makePlaceholders(n = 7) {
  const pts = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    pts.push({
      date: d.toISOString().split("T")[0],
      value: 0,
      placeholder: true,
    });
  }
  return pts;
}

export function SparkLine({ points, color, label, lowerIsBetter = false }) {
  const [containerWidth, setContainerWidth] = useState(0);

  const isPlaceholder = points.length === 0;
  const realPoints = points.length === 1 ? [points[0], points[0]] : points;
  const displayPoints = isPlaceholder ? makePlaceholders(7) : realPoints;

  const CHART_W = containerWidth > 0 ? containerWidth : 0;
  const innerW = Math.max(0, CHART_W - PAD.left - PAD.right);
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const vals = displayPoints.map((p) => p.value);
  const allZero = vals.every((v) => v === 0);

  const LABEL_MIN = allZero ? 0 : Math.max(0, Math.min(...vals) - 5);
  const LABEL_MAX = allZero ? 100 : Math.min(100, Math.max(...vals) + 5);
  const PLOT_MIN = allZero ? -10 : LABEL_MIN;
  const PLOT_MAX = LABEL_MAX;
  const plotRange = PLOT_MAX - PLOT_MIN || 1;

  const toX = (i) =>
    PAD.left + (i / Math.max(displayPoints.length - 1, 1)) * innerW;
  const toY = (v) => PAD.top + innerH - ((v - PLOT_MIN) / plotRange) * innerH;
  const labelRange = LABEL_MAX - LABEL_MIN || 1;
  const labelToY = (v) =>
    PAD.top + innerH - ((v - LABEL_MIN) / labelRange) * innerH;

  const polyPts = displayPoints
    .map((p, i) => `${toX(i)},${toY(p.value)}`)
    .join(" ");

  const latest = isPlaceholder
    ? 0
    : displayPoints[displayPoints.length - 1].value;
  const prev = isPlaceholder
    ? 0
    : (displayPoints[displayPoints.length - 2]?.value ?? latest);
  const trend = isPlaceholder ? null : latest - prev;

  const GRID_STEPS = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{ overflow: "hidden" }}
    >
      {/* Trend badge */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginBottom: 4,
        }}
      >
        {trend !== null ? (
          <View
            style={{
              backgroundColor:
                trend >= 0 ? COLORS.success + "20" : COLORS.error + "20",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text
              style={{
                color: trend >= 0 ? COLORS.success : COLORS.error,
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: COLORS.border + "60",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
              No sessions yet
            </Text>
          </View>
        )}
      </View>

      {/* Only render SVG once we have a valid width */}
      {CHART_W > 0 && (
        <Svg width={CHART_W} height={CHART_H + PAD.top}>
          <Defs>
            <LinearGradient id={`grad_${label}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color} stopOpacity="0.5" />
              <Stop offset="1" stopColor={color} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          {GRID_STEPS.map((pct) => {
            const labelVal = Math.round(
              LABEL_MIN + pct * (LABEL_MAX - LABEL_MIN),
            );
            const y = labelToY(labelVal);
            return (
              <React.Fragment key={pct}>
                <Line
                  x1={PAD.left}
                  y1={y}
                  x2={CHART_W - PAD.right}
                  y2={y}
                  stroke={COLORS.border}
                  strokeWidth={0.6}
                  strokeDasharray="3,4"
                />
                <SvgText
                  x={PAD.left - 4}
                  y={y + 4}
                  fill={COLORS.textSecondary}
                  fontSize={9}
                  textAnchor="end"
                >
                  {labelVal}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Line */}
          <Polyline
            points={polyPts}
            fill="none"
            stroke={isPlaceholder ? color : `url(#grad_${label})`}
            strokeOpacity={isPlaceholder ? 0.5 : 1}
            strokeWidth={isPlaceholder ? 2 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {displayPoints.map((p, i) => (
            <Circle
              key={i}
              cx={toX(i)}
              cy={toY(p.value)}
              r={isPlaceholder ? 3 : 3.5}
              fill={color}
              fillOpacity={isPlaceholder ? 0.45 : 1}
              stroke={COLORS.background}
              strokeWidth={1.5}
            />
          ))}

          {/* X-axis labels */}
          {[
            0,
            Math.floor((displayPoints.length - 1) / 2),
            displayPoints.length - 1,
          ]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((i) => {
              const d = displayPoints[i].date.split("-");
              return (
                <SvgText
                  key={i}
                  x={toX(i)}
                  y={CHART_H + PAD.top - 2}
                  fill={COLORS.textSecondary}
                  fontSize={9}
                  textAnchor="middle"
                >
                  {`${d[1]}/${d[2]}`}
                </SvgText>
              );
            })}

          {/* Placeholder watermark */}
          {isPlaceholder && (
            <SvgText
              x={CHART_W / 2}
              y={PAD.top + innerH / 2 - 10}
              fill={COLORS.textSecondary}
              fontSize={11}
              textAnchor="middle"
              opacity="0.55"
            >
              Play {label} games to build your graph
            </SvgText>
          )}
        </Svg>
      )}

      {/* Footer */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 6,
        }}
      >
        <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
          {isPlaceholder ? "0 sessions" : `${displayPoints.length} sessions`}
        </Text>
        <Text
          style={{
            color: isPlaceholder ? COLORS.textSecondary : color,
            fontSize: 13,
            fontWeight: "700",
          }}
        >
          {isPlaceholder ? "Score: —" : `Current: ${latest}%`}
        </Text>
      </View>
    </View>
  );
}
