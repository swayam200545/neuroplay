import { Tabs } from "expo-router";
import { Home, Gamepad2, BarChart3, User } from "lucide-react-native";
import { COLORS } from "../../constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 6,
          paddingBottom: 2,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home
              color={color}
              size={focused ? 23 : 21}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          tabBarIcon: ({ color, focused }) => (
            <Gamepad2
              color={color}
              size={focused ? 23 : 21}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, focused }) => (
            <BarChart3
              color={color}
              size={focused ? 23 : 21}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <User
              color={color}
              size={focused ? 23 : 21}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
