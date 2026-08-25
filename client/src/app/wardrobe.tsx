import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, CostumeItem } from '../api';
import { SprintyMascot } from '../components/SprintyMascot';
import { CostumeId } from '../mascot/types';
import { useMascot } from '../mascot/MascotContext';
import { useFeedback } from '../services/FeedbackProvider';
import { colors, duo } from '../theme';

export default function WardrobeScreen() {
  const router = useRouter();
  const mascot = useMascot();
  const { feedback } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [costumes, setCostumes] = useState<CostumeItem[]>([]);
  const [xpBalance, setXpBalance] = useState<number>(0);
  const [selectedPreviewCostume, setSelectedPreviewCostume] = useState<CostumeId>(
    mascot.activeCostume || 'DEFAULT'
  );
  const [purchasing, setPurchasing] = useState<boolean>(false);

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCostumeCatalog();
      if (data && Array.isArray(data.costumes)) {
        setCostumes(data.costumes);
        setXpBalance(data.xpBalance);
      }
    } catch (err) {
      console.warn('Failed to load costume catalog:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleSelectCostume = (costume: CostumeItem) => {
    feedback.haptics.selectionChange();
    setSelectedPreviewCostume(costume.id as CostumeId);
  };

  const handleEquip = async (costumeId: CostumeId) => {
    feedback.haptics.mediumTap();
    feedback.audio.buttonTap();

    const success = await mascot.equipCostume(costumeId);
    if (success) {
      feedback.haptics.successNotification();
      setCostumes((prev) =>
        prev.map((c) => ({
          ...c,
          isEquipped: c.id === costumeId,
        }))
      );
    }
  };

  const handlePurchase = async (costume: CostumeItem) => {
    if (xpBalance < costume.priceXP) {
      feedback.haptics.errorNotification();
      feedback.audio.wrong();
      Alert.alert(
        'Insufficient XP',
        `You need ${costume.priceXP} XP to unlock ${costume.name}. Complete more daily sprints to earn XP!`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setPurchasing(true);
      feedback.haptics.lightTap();
      const res = await mascot.purchaseCostume(costume.id as CostumeId);

      if (res.success) {
        feedback.haptics.correctAnswerCombo();
        feedback.audio.levelUp();
        setXpBalance((prev) => prev - costume.priceXP);
        setCostumes((prev) =>
          prev.map((c) =>
            c.id === costume.id
              ? { ...c, isUnlocked: true, isEquipped: true }
              : { ...c, isEquipped: false }
          )
        );
        Alert.alert('Unlocked! 🎉', res.message || `${costume.name} is now equipped!`);
      } else {
        feedback.haptics.errorNotification();
        Alert.alert('Purchase Failed', res.message || 'Could not unlock costume.');
      }
    } catch (err: any) {
      feedback.haptics.errorNotification();
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setPurchasing(false);
    }
  };

  const activeCostumeItem = costumes.find((c) => c.id === selectedPreviewCostume);
  const isSelectedUnlocked =
    mascot.unlockedCostumes.includes(selectedPreviewCostume) ||
    activeCostumeItem?.isUnlocked ||
    selectedPreviewCostume === 'DEFAULT';
  const isSelectedEquipped = mascot.activeCostume === selectedPreviewCostume;

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
        >
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SPRINTY Wardrobe</Text>
        <View style={styles.xpPill}>
          <Text style={styles.xpIcon}>⚡</Text>
          <Text style={styles.xpText}>{xpBalance.toLocaleString()} XP</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Live Stage Preview ── */}
        <View style={styles.stageCard}>
          <View style={styles.spotlightRing} />
          <SprintyMascot
            size="lg"
            overrideCostume={selectedPreviewCostume}
            overrideEmotion="IDLE_HOVER"
          />

          <View style={styles.stageInfo}>
            <Text style={styles.stageCostumeName}>
              {activeCostumeItem?.name || 'SPRINTY Classic'}
            </Text>
            <Text style={styles.stageCostumeDesc}>
              {activeCostumeItem?.description || 'The standard aerodynamic companion.'}
            </Text>
          </View>

          {/* Action Button for Selected Costume */}
          <View style={styles.actionRow}>
            {isSelectedEquipped ? (
              <View style={[styles.actionBtn, styles.equippedBtn]}>
                <Text style={styles.equippedBtnText}>✓ EQUIPPED</Text>
              </View>
            ) : isSelectedUnlocked ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.equipBtn]}
                onPress={() => handleEquip(selectedPreviewCostume)}
                activeOpacity={0.85}
              >
                <Text style={styles.equipBtnText}>EQUIP SKIN</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.unlockBtn,
                  purchasing && styles.disabledBtn,
                ]}
                onPress={() => activeCostumeItem && handlePurchase(activeCostumeItem)}
                disabled={purchasing}
                activeOpacity={0.85}
              >
                {purchasing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.unlockBtnText}>
                    🔓 UNLOCK ({activeCostumeItem?.priceXP || 500} XP)
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Costume Catalog Grid ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>COLLECTION</Text>
          <Text style={styles.sectionSubtitle}>
            {mascot.unlockedCostumes.length}/{costumes.length || 6} Unlocked
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.gridContainer}>
            {costumes.map((item) => {
              const isSelected = item.id === selectedPreviewCostume;
              const isUnlocked =
                mascot.unlockedCostumes.includes(item.id as CostumeId) ||
                item.isUnlocked ||
                item.id === 'DEFAULT';
              const isEquipped = mascot.activeCostume === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.costumeCard,
                    isSelected && styles.costumeCardSelected,
                    isEquipped && styles.costumeCardEquipped,
                  ]}
                  onPress={() => handleSelectCostume(item)}
                  activeOpacity={0.8}
                >
                  {/* Category Pill */}
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>

                  {/* Icon Avatar */}
                  <Text style={styles.costumeEmoji}>{item.icon}</Text>
                  <Text style={styles.costumeCardName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {/* Price / Status Tag */}
                  {isEquipped ? (
                    <View style={styles.statusBadgeEquipped}>
                      <Text style={styles.statusTextEquipped}>ACTIVE</Text>
                    </View>
                  ) : isUnlocked ? (
                    <View style={styles.statusBadgeOwned}>
                      <Text style={styles.statusTextOwned}>OWNED</Text>
                    </View>
                  ) : (
                    <View style={styles.statusBadgeLocked}>
                      <Text style={styles.statusTextLocked}>⚡ {item.priceXP}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  xpIcon: {
    fontSize: 14,
  },
  xpText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Stage ──
  stageCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 6,
    borderBottomColor: '#CBD5E1',
    alignItems: 'center',
    padding: 24,
    position: 'relative',
    marginBottom: 24,
    overflow: 'hidden',
  },
  spotlightRing: {
    position: 'absolute',
    top: 30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(203, 213, 225, 0.35)',
  },
  stageInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  stageCostumeName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
  },
  stageCostumeDesc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  actionRow: {
    marginTop: 18,
    width: '100%',
    maxWidth: 240,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equippedBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: colors.duoGreen,
  },
  equippedBtnText: {
    color: colors.duoGreenDark,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  equipBtn: {
    backgroundColor: colors.duoBlue,
    borderBottomWidth: 5,
    borderBottomColor: '#0284C7',
  },
  equipBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  unlockBtn: {
    backgroundColor: colors.duoGreen,
    borderBottomWidth: 5,
    borderBottomColor: colors.duoGreenDark,
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.6,
  },

  // ── Grid ──
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  costumeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: 4,
    borderBottomColor: colors.cardBorder,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  costumeCardSelected: {
    borderColor: colors.duoBlue,
    borderBottomColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  costumeCardEquipped: {
    borderColor: colors.duoGreen,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  costumeEmoji: {
    fontSize: 36,
    marginVertical: 8,
  },
  costumeCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 8,
  },
  statusBadgeEquipped: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextEquipped: {
    color: colors.duoGreenDark,
    fontSize: 11,
    fontWeight: '900',
  },
  statusBadgeOwned: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextOwned: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeLocked: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextLocked: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
});
