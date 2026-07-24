import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { theme } from '../../src/theme';
import { SymbolView } from 'expo-symbols';
import { SkillBadge } from '../../src/components/SkillBadge';
import { ProgressRing } from '../../src/components/ProgressRing';
import axios from 'axios';
import { Platform } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data (mock user for v1)
        const API_URL = __DEV__ 
          ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api')
          : 'https://production-api.example.com/api';
        
        // Mock user endpoints aren't explicitly defined in api.ts so we fetch directly
        const [userRes, progressRes] = await Promise.all([
          axios.get(`${API_URL}/users/me`).catch(() => ({ data: { streak: 5, totalXP: 2450 }})),
          api.getProgress()
        ]);
        
        setUserData(userRes.data);
        setProgressData(progressRes);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const handleLaunchSprint = (type: string) => {
    router.push(`/sprint/${type}`);
  };

  const skills = ['verbal', 'quantitative', 'logical', 'spatial'] as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.username}>Student</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <SymbolView name="flame.fill" tintColor={theme.colors.error} size={20} />
            <Text style={styles.statText}>{userData?.streak || 0}</Text>
          </View>
          <View style={styles.statBadge}>
            <SymbolView name="star.fill" tintColor="#FFD700" size={20} />
            <Text style={styles.statText}>{userData?.totalXP || 0}</Text>
          </View>
        </View>
      </View>

      {/* Hero Banner */}
      <TouchableOpacity 
        style={styles.heroCard}
        onPress={() => handleLaunchSprint('standard')}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Daily Sprint</Text>
          <Text style={styles.heroSubtitle}>Your personalized 10-question workout</Text>
          <View style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Start Now</Text>
            <SymbolView name="chevron.right" tintColor="#FFF" size={16} />
          </View>
        </View>
        <SymbolView name="bolt.fill" tintColor="rgba(255,255,255,0.2)" size={100} style={styles.heroIcon} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => handleLaunchSprint('quick')}>
          <SymbolView name="timer" tintColor={theme.colors.primary} size={28} />
          <Text style={styles.actionText}>Quick (5q)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => handleLaunchSprint('deep')}>
          <SymbolView name="brain" tintColor={theme.skillGradients.verbal[0]} size={28} />
          <Text style={styles.actionText}>Deep (15q)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Skill Overview</Text>
      <View style={styles.skillsGrid}>
        {skills.map(skill => (
          <View key={skill} style={styles.skillCard}>
            <ProgressRing
              score={progressData?.skills?.[skill]?.normalizedScore || 0}
              skill={skill}
              size={60}
              strokeWidth={6}
            />
            <View style={styles.skillInfo}>
              <SkillBadge skill={skill} />
              <TouchableOpacity 
                style={styles.practiceButton}
                onPress={() => handleLaunchSprint('standard')} // In real app, launch specific skill
              >
                <Text style={styles.practiceText}>Practice</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 80,
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  greeting: {
    color: theme.colors.textMuted,
    fontSize: 16,
  },
  username: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  statText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 24,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  heroButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  heroIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    zIndex: 1,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  actionText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  skillsGrid: {
    gap: 16,
  },
  skillCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 16,
  },
  skillInfo: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 12,
  },
  practiceButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  practiceText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
});
