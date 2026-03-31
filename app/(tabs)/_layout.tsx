import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.backgroundElevated,
          borderTopColor: colors.border,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Buscar",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="search" size={size} />
        }}
      />
      <Tabs.Screen
        name="salvas"
        options={{
          title: "Salvas",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="bookmark" size={size} />
        }}
      />
    </Tabs>
  );
}
