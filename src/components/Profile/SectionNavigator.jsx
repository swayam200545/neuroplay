import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants/theme";
import { SECTIONS } from "@/constants/profileConfig";

export function SectionNavigator({ activeSection, onSectionChange }) {
  return (
    <>
      {/* Section nav pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: 4 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 8,
          paddingRight: 28,
        }}
      >
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <TouchableOpacity
              key={sec.id}
              onPress={() => onSectionChange(sec.id)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 20,
                backgroundColor: isActive ? COLORS.primary : COLORS.card,
                borderWidth: 1.5,
                borderColor: isActive ? COLORS.primary : COLORS.border,
              }}
            >
              <Text style={{ fontSize: 13 }}>{sec.icon}</Text>
              <Text
                style={{
                  color: isActive ? "#fff" : COLORS.textSecondary,
                  fontSize: 13,
                  fontWeight: isActive ? "700" : "500",
                }}
              >
                {sec.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Underline indicator */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12, marginTop: 8 }}>
        <View
          style={{ height: 2, backgroundColor: COLORS.border, borderRadius: 1 }}
        >
          <View
            style={{
              height: 2,
              width: "25%",
              backgroundColor: COLORS.primary,
              borderRadius: 1,
              marginLeft: `${SECTIONS.findIndex((s) => s.id === activeSection) * 25}%`,
            }}
          />
        </View>
      </View>
    </>
  );
}
