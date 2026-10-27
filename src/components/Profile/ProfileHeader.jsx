import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Pencil } from "lucide-react-native";
import { COLORS } from "@/constants/theme";

export function ProfileHeader({ levelInfo, xp, userName, onEditName }) {
  const displayName = userName ? userName : "Player";

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text
          style={{
            color: COLORS.text,
            fontSize: 28,
            fontWeight: "800",
            letterSpacing: -0.5,
          }}
        >
          {displayName}
        </Text>
        <TouchableOpacity
          onPress={onEditName}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 10,
            padding: 6,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Pencil color={COLORS.textSecondary} size={14} />
        </TouchableOpacity>
      </View>
      <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
        Lv {levelInfo.currentLevel.level} · {levelInfo.currentLevel.title} ·{" "}
        {xp.toLocaleString()} XP
      </Text>
    </View>
  );
}
