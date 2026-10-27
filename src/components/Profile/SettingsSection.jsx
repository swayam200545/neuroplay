import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Trash2 } from "lucide-react-native";
import { COLORS } from "@/constants/theme";

export function SettingsSection({ resetProgress }) {
  const handleReset = () => {
    Alert.alert(
      "Reset Progress",
      "This will erase all XP, games, and achievements. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetProgress },
      ],
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={{ gap: 10 }}>
        {/* App info card */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              color: COLORS.text,
              fontSize: 15,
              fontWeight: "700",
              marginBottom: 14,
            }}
          >
            ⚙️ App Info
          </Text>
          {[
            { label: "App", value: "NeuroPLay" },
            { label: "Version", value: "1.0.0" },
            { label: "Games Available", value: "17" },
            { label: "Max Level", value: "50 — Brain God" },
          ].map((row, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 10,
                borderBottomWidth: i < 3 ? 1 : 0,
                borderBottomColor: COLORS.border,
              }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                {row.label}
              </Text>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* How scoring works */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              color: COLORS.text,
              fontSize: 15,
              fontWeight: "700",
              marginBottom: 12,
            }}
          >
            💡 How It Works
          </Text>
          {[
            { emoji: "⭐", text: "Earn XP by completing games" },
            { emoji: "🔥", text: "Daily streaks boost your XP" },
            {
              emoji: "🔓",
              text: "Hit level milestones to unlock harder games",
            },
            { emoji: "🏆", text: "Achievements award bonus XP" },
            {
              emoji: "🧠",
              text: "Progress graphs update after every game",
            },
            { emoji: "♾️", text: "Neural Nexus at Lv 50 never ends" },
          ].map((tip, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 8,
                borderBottomWidth: i < 5 ? 1 : 0,
                borderBottomColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 18 }}>{tip.emoji}</Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 13,
                  flex: 1,
                }}
              >
                {tip.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Danger zone */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.error + "30",
          }}
        >
          <Text
            style={{
              color: COLORS.error,
              fontSize: 13,
              fontWeight: "700",
              marginBottom: 12,
            }}
          >
            ⚠️ Danger Zone
          </Text>
          <TouchableOpacity
            onPress={handleReset}
            style={{
              backgroundColor: COLORS.error + "15",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: COLORS.error + "30",
            }}
          >
            <Trash2 color={COLORS.error} size={18} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: COLORS.error,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Reset All Progress
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                Wipes XP, games, and achievements
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
