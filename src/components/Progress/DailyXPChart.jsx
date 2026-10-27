import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "@/constants/theme";
import { FILTERS } from "@/constants/progressConfig";
import { WeeklyBarChart } from "./WeeklyBarChart";

export function DailyXPChart({ dailyHistory, filterIdx }) {
  const filter = FILTERS[filterIdx];

  return (
    <View
      style={{
        marginTop: 14,
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
          marginBottom: 16,
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}>
          📊 Daily XP
        </Text>
        <View
          style={{
            backgroundColor: COLORS.primary + "22",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: COLORS.primary,
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            {filter.label === "All" ? "All time" : `Last ${filter.days} days`}
          </Text>
        </View>
      </View>
      <WeeklyBarChart dailyHistory={dailyHistory} filterDays={filter.days} />
    </View>
  );
}
