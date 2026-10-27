import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { COLORS, ACHIEVEMENTS } from "@/constants/theme";
import { AchievementRow } from "./AchievementRow";

export function CollapsibleTier({ tier, unlockedAchievements }) {
  const [open, setOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  const tierAchievements = ACHIEVEMENTS.filter((a) => tier.ids.includes(a.id));
  const tierUnlocked = tierAchievements.filter((a) =>
    unlockedAchievements.includes(a.id),
  ).length;
  const pct = Math.round((tierUnlocked / tierAchievements.length) * 100);

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
    setOpen(!open);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });
  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tierAchievements.length * 68],
  });

  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={{ flexDirection: "row", alignItems: "center", padding: 16 }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Text
              style={{ color: tier.color, fontSize: 13, fontWeight: "800" }}
            >
              {tier.label}
            </Text>
            <View
              style={{
                backgroundColor: tier.color + "20",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text
                style={{ color: tier.color, fontSize: 11, fontWeight: "700" }}
              >
                {tierUnlocked}/{tierAchievements.length}
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 4,
              backgroundColor: COLORS.border,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 4,
                width: `${pct}%`,
                backgroundColor: tier.color,
                borderRadius: 2,
              }}
            />
          </View>
        </View>
        <Animated.View style={{ marginLeft: 12, transform: [{ rotate }] }}>
          <ChevronRight color={COLORS.textSecondary} size={18} />
        </Animated.View>
      </TouchableOpacity>

      {/* Collapsible list */}
      <Animated.View
        style={{ maxHeight, overflow: "hidden", paddingHorizontal: 16 }}
      >
        {tierAchievements.map((a) => (
          <AchievementRow
            key={a.id}
            achievement={a}
            isUnlocked={unlockedAchievements.includes(a.id)}
          />
        ))}
        <View style={{ height: 10 }} />
      </Animated.View>
    </View>
  );
}
