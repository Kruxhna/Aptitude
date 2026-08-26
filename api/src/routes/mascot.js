const express = require('express');
const router = express.Router();
const { User } = require('../models');

// ─── Static Costume Catalog ──────────────────────────────────────────────────
const COSTUME_CATALOG = [
  {
    id: 'DEFAULT',
    name: 'SPRINTY Classic',
    description: 'The standard aerodynamic aptitude companion.',
    priceXP: 0,
    icon: '🤖',
    category: 'HEAD',
  },
  {
    id: 'GRAD_CAP',
    name: 'Scholar SPRINTY',
    description: 'Academic graduation mortarboard with golden tassel.',
    priceXP: 500,
    icon: '🎓',
    category: 'HEAD',
  },
  {
    id: 'NERD_GLASSES',
    name: 'Brainiac SPRINTY',
    description: 'Intelligent round thick-rim frames & red bowtie.',
    priceXP: 750,
    icon: '👓',
    category: 'FACE',
  },
  {
    id: 'SUPERHERO_CAPE',
    name: 'Super SPRINTY',
    description: 'Vibrant crimson superhero cape for high-velocity problem solving.',
    priceXP: 1000,
    icon: '🦸‍♂️',
    category: 'BACK',
  },
  {
    id: 'WIZARD_HAT',
    name: 'Wizard SPRINTY',
    description: 'Mystical starry pointed hat for arithmetic sorcery.',
    priceXP: 1500,
    icon: '🧙‍♂️',
    category: 'HEAD',
  },
  {
    id: 'ASTRONAUT_HELMET',
    name: 'Astro SPRINTY',
    description: 'Deep-space pressurized helmet with polarized visor.',
    priceXP: 2000,
    icon: '🧑‍🚀',
    category: 'HEAD',
  },
];

/**
 * GET /api/mascot/costumes
 * Fetch available costume catalog and user's ownership status.
 */
router.get('/api/mascot/costumes', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const unlocked = user.mascot?.unlockedCostumes || ['DEFAULT'];
    const active = user.mascot?.activeCostume || 'DEFAULT';

    const costumes = COSTUME_CATALOG.map((item) => ({
      ...item,
      isUnlocked: unlocked.includes(item.id),
      isEquipped: active === item.id,
    }));

    res.json({
      costumes,
      activeCostume: active,
      unlockedCostumes: unlocked,
      xpBalance: user.xpTotal || 0,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mascot/costumes/purchase
 * Purchase and unlock a cosmetic costume with XP.
 * Body: { costumeId: string }
 */
router.post('/api/mascot/costumes/purchase', async (req, res, next) => {
  try {
    const { costumeId } = req.body;
    if (!costumeId) {
      return res.status(400).json({ error: 'costumeId is required' });
    }

    const item = COSTUME_CATALOG.find((c) => c.id === costumeId);
    if (!item) {
      return res.status(404).json({ error: 'Costume does not exist in catalog' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Initialize mascot subdocument if missing
    if (!user.mascot) {
      user.mascot = { activeCostume: 'DEFAULT', unlockedCostumes: ['DEFAULT'] };
    }

    if (user.mascot.unlockedCostumes.includes(costumeId)) {
      return res.status(400).json({ error: 'Costume already unlocked' });
    }

    if ((user.xpTotal || 0) < item.priceXP) {
      return res.status(400).json({
        error: `Insufficient XP. Required: ${item.priceXP}, Available: ${user.xpTotal || 0}`,
      });
    }

    // Deduct XP and unlock
    user.xpTotal -= item.priceXP;
    user.mascot.unlockedCostumes.push(costumeId);
    await user.save();

    res.json({
      success: true,
      message: `Unlocked ${item.name}!`,
      unlockedCostumes: user.mascot.unlockedCostumes,
      activeCostume: user.mascot.activeCostume,
      xpBalance: user.xpTotal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mascot/costumes/equip
 * Equip an unlocked costume.
 * Body: { costumeId: string }
 */
router.post('/api/mascot/costumes/equip', async (req, res, next) => {
  try {
    const { costumeId } = req.body;
    if (!costumeId) {
      return res.status(400).json({ error: 'costumeId is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.mascot) {
      user.mascot = { activeCostume: 'DEFAULT', unlockedCostumes: ['DEFAULT'] };
    }

    if (!user.mascot.unlockedCostumes.includes(costumeId)) {
      return res.status(403).json({ error: 'Costume has not been unlocked yet' });
    }

    user.mascot.activeCostume = costumeId;
    await user.save();

    res.json({
      success: true,
      activeCostume: costumeId,
      unlockedCostumes: user.mascot.unlockedCostumes,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.COSTUME_CATALOG = COSTUME_CATALOG;
