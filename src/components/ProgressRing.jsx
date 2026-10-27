import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

export default function ProgressRing({
  progress = 0,
  size = 120,
  strokeWidth = 8,
  color1 = "#7C5CFF",
  color2 = "#00E5FF",
  backgroundColor = "#2A2A35",
  children,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={color1} />
            <Stop offset="100%" stopColor={color2} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
