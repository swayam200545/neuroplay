import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { COLORS } from "@/constants/theme";
import { FILTERS, CHART_CONFIG } from "@/constants/progressConfig";
import { SparkLine } from "./SparkLine";

export function PerformanceCharts({ chartPoints, filterIdx, setFilterIdx }) {
  const [activeChart, setActiveChart] = useState(0);

  const activeCfg = CHART_CONFIG[activeChart];
  const activePoints = chartPoints[activeCfg.key] || [];

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}>
          📈 Performance Charts
        </Text>
        {/* Time filter */}
        <View style={{ flexDirection: "row", gap: 4 }}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity
              key={f.label}
              onPress={() => setFilterIdx(i)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor:
                  filterIdx === i
                    ? COLORS.primary
                    : COLORS.cardLight || COLORS.border,
              }}
            >
              <Text
                style={{
                  color: filterIdx === i ? "#fff" : COLORS.textSecondary,
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16, flexGrow: 0 }}
      >
        {CHART_CONFIG.map((cfg, i) => (
          <TouchableOpacity
            key={cfg.key}
            onPress={() => setActiveChart(i)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
              backgroundColor:
                activeChart === i ? cfg.color + "30" : COLORS.border + "50",
              borderWidth: 1,
              borderColor: activeChart === i ? cfg.color + "60" : "transparent",
            }}
          >
            <Text style={{ fontSize: 13 }}>
              {cfg.icon}{" "}
              <Text
                style={{
                  color: activeChart === i ? cfg.color : COLORS.textSecondary,
                  fontWeight: activeChart === i ? "700" : "500",
                }}
              >
                {cfg.label}
              </Text>
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SparkLine
        key={`${activeCfg.key}-${filterIdx}`}
        points={activePoints}
        color={activeCfg.color}
        label={activeCfg.label}
        icon={activeCfg.icon}
        lowerIsBetter={activeCfg.lowerIsBetter}
      />
    </View>
  );
}
