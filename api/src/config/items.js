/**
 * Dynamic Inventory Item Catalog
 * Item definitions live in configuration rather than baked into fixed schema columns.
 */

const ITEMS = {
  streak_freeze: {
    id: 'streak_freeze',
    name: 'Streak Freeze',
    description: 'Equip an extra streak freeze to protect your streak if you miss a day.',
    costGems: 50,
    category: 'STREAK',
    icon: '🧊',
    effect: {
      type: 'ADD_FREEZE',
      amount: 1,
    },
  },
  double_xp_15m: {
    id: 'double_xp_15m',
    name: 'Double XP (15 Min)',
    description: 'Earn 2x XP on all sprints completed in the next 15 minutes.',
    costGems: 40,
    category: 'BOOST',
    icon: '⚡',
    effect: {
      type: 'ACTIVE_BOOST',
      boostType: 'DOUBLE_XP',
      durationMinutes: 15,
      multiplier: 2.0,
    },
  },
  double_xp_60m: {
    id: 'double_xp_60m',
    name: 'Double XP (1 Hour)',
    description: 'Earn 2x XP on all sprints completed in the next 60 minutes.',
    costGems: 120,
    category: 'BOOST',
    icon: '🔥',
    effect: {
      type: 'ACTIVE_BOOST',
      boostType: 'DOUBLE_XP',
      durationMinutes: 60,
      multiplier: 2.0,
    },
  },
  hint_pack_5: {
    id: 'hint_pack_5',
    name: '50/50 Hint Pack (5x)',
    description: 'Gain 5 additional 50/50 hints for use in tough sprint questions.',
    costGems: 30,
    category: 'CONSUMABLE',
    icon: '💡',
    effect: {
      type: 'INVENTORY_QUANTITY',
      amount: 5,
    },
  },
  mascot_space_helmet: {
    id: 'mascot_space_helmet',
    name: 'Space Helmet',
    description: 'Equip Sprinty with an astronaut cosmic helmet.',
    costGems: 100,
    category: 'COSMETIC',
    icon: '🚀',
    effect: {
      type: 'UNLOCK_COSTUME',
      costumeId: 'SPACE_HELMET',
    },
  },
  mascot_wizard_hat: {
    id: 'mascot_wizard_hat',
    name: 'Wizard Hat',
    description: 'Equip Sprinty with an enchanted wizard hat.',
    costGems: 150,
    category: 'COSMETIC',
    icon: '🧙',
    effect: {
      type: 'UNLOCK_COSTUME',
      costumeId: 'WIZARD_HAT',
    },
  },
  mascot_golden_crown: {
    id: 'mascot_golden_crown',
    name: 'Golden Crown',
    description: 'Crown Sprinty as the champion of GATE Aptitude.',
    costGems: 300,
    category: 'COSMETIC',
    icon: '👑',
    effect: {
      type: 'UNLOCK_COSTUME',
      costumeId: 'GOLDEN_CROWN',
    },
  },
};

function getItem(itemId) {
  return ITEMS[itemId] || null;
}

function getAllItems() {
  return Object.values(ITEMS);
}

module.exports = {
  ITEMS,
  getItem,
  getAllItems,
};
