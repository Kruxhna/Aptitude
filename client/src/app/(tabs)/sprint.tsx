import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme';
import { SkillPaths, SkillNode } from '../../components/SkillPaths';

const INITIAL_SKILL_NODES: SkillNode[] = [
  { id: '1', title: 'Numerical Aptitude', status: 'completed', x: 80, y: 50 },
  { id: '2', title: 'Spatial Aptitude', status: 'active', x: 260, y: 150 },
  { id: '3', title: 'Verbal Aptitude', status: 'locked', x: 90, y: 270 },
  { id: '4', title: 'Logical Reasoning', status: 'locked', x: 250, y: 370 },
];

export default function SprintLauncherScreen() {
  const router = useRouter();
  const [nodes, setNodes] = useState<SkillNode[]>(INITIAL_SKILL_NODES);

  const startSprint = (type: 'quick' | 'standard' | 'deep') => {
    router.push(`/sprint/${type}` as any);
  };

  const handleNodePress = (node: SkillNode) => {
    if (node.status === 'active') {
      startSprint('standard');
    }
  };

  const unlockNextNode = () => {
    setNodes((prevNodes) => {
      const activeIdx = prevNodes.findIndex((n) => n.status === 'active');
      if (activeIdx !== -1 && activeIdx + 1 < prevNodes.length) {
        const next = [...prevNodes];
        next[activeIdx] = { ...next[activeIdx], status: 'completed' };
        next[activeIdx + 1] = { ...next[activeIdx + 1], status: 'active' };
        return next;
      }
      return prevNodes;
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Daily Skill Path</Text>
      <Text style={styles.headerSubtitle}>
        Interactive path linking Numerical to Spatial Aptitude
      </Text>

      {/* Interactive Skill Path Map */}
      <View style={styles.pathSection}>
        <SkillPaths nodes={nodes} onNodePress={handleNodePress} width={340} height={440} />
        
        <TouchableOpacity style={styles.unlockDemoButton} onPress={unlockNextNode}>
          <Text style={styles.unlockDemoText}>Demo: Unlock Next Path Line (800ms Draw)</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.headerTitle, { marginTop: 24 }]}>Practice Sprint</Text>

      <View style={styles.cardContainer}>
        {/* Quick Sprint */}
        <TouchableOpacity
          style={styles.sprintCard}
          activeOpacity={0.85}
          onPress={() => startSprint('quick')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Quick Sprint</Text>
            <Text style={styles.badgeText}>5 MIN</Text>
          </View>
          <Text style={styles.cardCount}>5 Questions</Text>
          <Text style={styles.cardDescription}>
            Perfect for a quick daily check-in or brief study break.
          </Text>
        </TouchableOpacity>

        {/* Standard Sprint */}
        <TouchableOpacity
          style={[styles.sprintCard, styles.featuredCard]}
          activeOpacity={0.85}
          onPress={() => startSprint('standard')}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, styles.featuredTitle]}>
              Standard Sprint
            </Text>
            <Text style={[styles.badgeText, styles.featuredBadge]}>RECOMMENDED</Text>
          </View>
          <Text style={styles.cardCount}>10 Questions</Text>
          <Text style={styles.cardDescription}>
            Balanced workout across all GATE skill categories with XP bonus.
          </Text>
        </TouchableOpacity>

        {/* Deep Sprint */}
        <TouchableOpacity
          style={styles.sprintCard}
          activeOpacity={0.85}
          onPress={() => startSprint('deep')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Deep Sprint</Text>
            <Text style={styles.badgeText}>15 MIN</Text>
          </View>
          <Text style={styles.cardCount}>15 Questions</Text>
          <Text style={styles.cardDescription}>
            Comprehensive session designed to push your skill ELO boundaries.
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  pathSection: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unlockDemoButton: {
    backgroundColor: colors.backgroundSelected,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  unlockDemoText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  cardContainer: {
    gap: 16,
    marginTop: 16,
  },
  sprintCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
  },
  featuredCard: {
    borderColor: colors.accent,
    backgroundColor: '#151738',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  featuredTitle: {
    color: '#818CF8',
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadge: {
    color: '#818CF8',
    backgroundColor: '#312E81',
  },
  cardCount: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
});
