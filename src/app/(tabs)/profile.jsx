import React, { useRef, useState } from "react";
import {
  View,
  Animated,
  Modal,
  TextInput,
  Text,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Check } from "lucide-react-native";
import { COLORS } from "@/constants/theme";
import useGameStore from "@/store/gameStore";
import { ProfileHeader } from "@/components/Profile/ProfileHeader";
import { SectionNavigator } from "@/components/Profile/SectionNavigator";
import { StatsSection } from "@/components/Profile/StatsSection";
import { AchievementsSection } from "@/components/Profile/AchievementsSection";
import { RoadmapSection } from "@/components/Profile/RoadmapSection";
import { SettingsSection } from "@/components/Profile/SettingsSection";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const hydrated = useGameStore((s) => s.hydrated);
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const totalGamesPlayed = useGameStore((s) => s.totalGamesPlayed);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const getLevelInfo = useGameStore((s) => s.getLevelInfo);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const userName = useGameStore((s) => s.userName);
  const setUserName = useGameStore((s) => s.setUserName);

  const [activeSection, setActiveSection] = useState("stats");
  const [showNameModal, setShowNameModal] = useState(false);
  const [editingName, setEditingName] = useState("");
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const switchSection = (id) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveSection(id);
  };

  const openNameEditor = () => {
    setEditingName(userName || "");
    setShowNameModal(true);
  };

  const saveName = () => {
    const trimmed = editingName.trim();
    setUserName(trimmed);
    setShowNameModal(false);
  };

  if (!hydrated)
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;

  const levelInfo = getLevelInfo();
  const unlockedCount = unlockedAchievements.length;

  const renderSection = () => {
    switch (activeSection) {
      case "stats":
        return (
          <StatsSection
            levelInfo={levelInfo}
            xp={xp}
            streak={streak}
            totalGamesPlayed={totalGamesPlayed}
            unlockedCount={unlockedCount}
            userName={userName}
            onEditName={openNameEditor}
          />
        );

      case "achievements":
        return (
          <AchievementsSection unlockedAchievements={unlockedAchievements} />
        );

      case "roadmap":
        return <RoadmapSection levelInfo={levelInfo} xp={xp} />;

      case "settings":
        return <SettingsSection resetProgress={resetProgress} />;

      default:
        return null;
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: insets.top,
      }}
    >
      <ProfileHeader
        levelInfo={levelInfo}
        xp={xp}
        userName={userName}
        onEditName={openNameEditor}
      />

      <SectionNavigator
        activeSection={activeSection}
        onSectionChange={switchSection}
      />

      {/* Content */}
      <Animated.View
        style={{ flex: 1, paddingHorizontal: 20, opacity: fadeAnim }}
      >
        {renderSection()}
      </Animated.View>

      {/* Edit Name Modal */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 24,
              padding: 28,
              width: "100%",
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{ color: COLORS.text, fontSize: 20, fontWeight: "800" }}
              >
                Your Name
              </Text>
              <TouchableOpacity onPress={() => setShowNameModal(false)}>
                <X color={COLORS.textSecondary} size={22} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={editingName}
              onChangeText={setEditingName}
              placeholder="Enter your name..."
              placeholderTextColor={COLORS.textSecondary + "60"}
              maxLength={20}
              autoFocus
              style={{
                backgroundColor: COLORS.background,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 18,
                fontWeight: "600",
                color: COLORS.text,
                borderWidth: 1.5,
                borderColor: COLORS.primary + "50",
              }}
            />
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 11,
                marginTop: 8,
                textAlign: "right",
              }}
            >
              {editingName.length}/20
            </Text>
            <TouchableOpacity
              onPress={saveName}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 16,
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Check color="#fff" size={18} />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
