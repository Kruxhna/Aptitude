import { Tabs } from 'expo-router';
import { colors } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.cardBorder,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'GATE Aptitude',
        }}
      />
      <Tabs.Screen
        name="sprint"
        options={{
          title: 'Sprint',
          headerTitle: 'Daily Practice Sprint',
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'Performance Analytics',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          headerTitle: 'Weekly Standings',
        }}
      />
    </Tabs>
  );
}
