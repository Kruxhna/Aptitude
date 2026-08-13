import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { colors, duo } from '../../theme';
import { useFeedback } from '../../services/FeedbackProvider';

// ─── Emoji Tab Icons (Duolingo-style flat vector approach) ───
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={[styles.iconEmoji, focused && styles.iconEmojiActive]}>
        {emoji}
      </Text>
    </View>
  );
}

/** Wrapper that fires a light haptic tap on every tab press. */
function HapticTabButton(props: any) {
  const { feedback } = useFeedback();
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        feedback.haptics.lightTap();
        props.onPress?.(e);
      }}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 2,
          borderBottomColor: colors.cardBorder,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '700',
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 2,
          borderTopColor: colors.cardBorder,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.duoBlue,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: -2,
        },
        tabBarButton: HapticTabButton,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'GATE Aptitude',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="sprint"
        options={{
          title: 'Sprint',
          headerTitle: 'Daily Sprint',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚡" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Sprint tab',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'League',
          headerTitle: 'Weekly Standings',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏆" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'League tab',
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Profile',
          headerTitle: 'Performance',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Settings tab',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: `${colors.duoBlue}18`,
  },
  iconEmoji: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconEmojiActive: {
    opacity: 1,
  },
});
