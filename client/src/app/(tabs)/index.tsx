import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { api, UserMeResponse, ProgressResponse } from '../../api';
import { colors } from '../../theme';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserMeResponse | null>(null);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [user, prog] = await Promise.all([
        api.getUserMe(),
        api.getProgress(),
      ]);
      setUserData(user);
      setProgressData(prog);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Card: TECH BOOST & Mascot & Daily Goal */}
      <View style={styles.topHeaderCard}>
        <View style={styles.headerTopRow}>
          <Text style={styles.techBoostTitle}>TECH BOOST</Text>
          <TouchableOpacity style={styles.bellButton}>
            <SymbolView name="bell.fill" size={20} tintColor="#1E293B" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroRow}>
          {/* SPRINTY Mascot Floating */}
          <View style={styles.mascotContainer}>
            <Image
              source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>

          {/* Radial Progress Ring Widget */}
          <View style={styles.goalWidget}>
            <Text style={styles.goalLabel}>Daily Goal</Text>
            <View style={styles.ringCircle}>
              <Text style={styles.ringPercentage}>60%</Text>
              <Text style={styles.ringSubtext}>COMPLETE</Text>
              <Text style={styles.xpFraction}>(36/60 XP)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Skill Paths Section Title */}
      <Text style={styles.sectionHeaderTitle}>SKILL PATHS</Text>

      {/* Main Grid & Path Line Layout */}
      <View style={styles.pathGridWrapper}>
        {/* 2x2 Skill Modules */}
        <View style={styles.gridContainer}>
          {/* Data Structures */}
          <TouchableOpacity
            style={[styles.skillSquare, { backgroundColor: '#EC4899' }]}
            activeOpacity={0.85}
            onPress={() => router.push('/sprint/standard' as any)}
          >
            <SymbolView name="flowchart.fill" size={36} tintColor="#FFFFFF" />
            <Text style={styles.skillCardTitle}>DATA{"\n"}STRUCTURES</Text>
          </TouchableOpacity>

          {/* System Design */}
          <TouchableOpacity
            style={[styles.skillSquare, { backgroundColor: '#3B82F6' }]}
            activeOpacity={0.85}
            onPress={() => router.push('/sprint/standard' as any)}
          >
            <SymbolView name="square.grid.3x3.fill" size={36} tintColor="#FFFFFF" />
            <Text style={styles.skillCardTitle}>SYSTEM{"\n"}DESIGN</Text>
          </TouchableOpacity>

          {/* Network Security */}
          <TouchableOpacity
            style={[styles.skillSquare, { backgroundColor: '#8B5CF6' }]}
            activeOpacity={0.85}
            onPress={() => router.push('/sprint/standard' as any)}
          >
            <SymbolView name="lock.shield.fill" size={36} tintColor="#FFFFFF" />
            <Text style={styles.skillCardTitle}>NETWORK{"\n"}SECURITY</Text>
          </TouchableOpacity>

          {/* Operating Systems */}
          <TouchableOpacity
            style={[styles.skillSquare, { backgroundColor: '#00C4B4' }]}
            activeOpacity={0.85}
            onPress={() => router.push('/sprint/standard' as any)}
          >
            <SymbolView name="gearshape.2.fill" size={36} tintColor="#FFFFFF" />
            <Text style={styles.skillCardTitle}>OPERATING{"\n"}SYSTEMS</Text>
          </TouchableOpacity>
        </View>

        {/* Vertical Path Connection Nodes */}
        <View style={styles.pathConnectorTrack}>
          <View style={styles.connectorLine} />

          {/* Node 1 - Completed */}
          <View style={[styles.pathNode, styles.nodeCompleted]}>
            <SymbolView name="checkmark" size={14} tintColor="#FFFFFF" />
          </View>

          {/* Node 2 - Active Glowing Ring */}
          <View style={[styles.pathNode, styles.nodeActive]}>
            <View style={styles.activeCoreDot} />
          </View>

          {/* Node 3 - Completed */}
          <View style={[styles.pathNode, styles.nodeCompleted]}>
            <SymbolView name="checkmark" size={14} tintColor="#FFFFFF" />
          </View>

          {/* Node 4 - Locked */}
          <View style={[styles.pathNode, styles.nodeLocked]}>
            <SymbolView name="lock.fill" size={12} tintColor="#94A3B8" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF2F7',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topHeaderCard: {
    backgroundColor: '#E0F2FE',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  techBoostTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mascotContainer: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotImage: {
    width: 100,
    height: 100,
  },
  goalWidget: {
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  ringCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 6,
    borderColor: '#00C4B4',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPercentage: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  ringSubtext: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    marginTop: -2,
  },
  xpFraction: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00C4B4',
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 14,
  },
  pathGridWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillSquare: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  skillCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 12,
  },
  pathConnectorTrack: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    position: 'relative',
    marginLeft: 8,
  },
  connectorLine: {
    position: 'absolute',
    top: 20,
    bottom: 20,
    width: 4,
    backgroundColor: '#CBD5E1',
    zIndex: 1,
  },
  pathNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    marginVertical: 24,
  },
  nodeCompleted: {
    backgroundColor: '#10B981',
  },
  nodeActive: {
    backgroundColor: '#00C4B4',
    borderWidth: 4,
    borderColor: '#E0F2FE',
    shadowColor: '#00C4B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  activeCoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  nodeLocked: {
    backgroundColor: '#E2E8F0',
  },
});
