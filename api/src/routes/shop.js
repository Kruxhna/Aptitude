const express = require('express');
const router = express.Router();
const { User, GemTransaction } = require('../models');
const { getItem, getAllItems } = require('../config/items');
const { shopPurchaseLimiter } = require('../middleware/rateLimiter');
const { requireIdempotency } = require('../middleware/idempotency');

/**
 * GET /api/shop/catalog
 * Retrieve shop catalog, item costs, user's current gems, inventory, and active boosts.
 */
router.get('/api/shop/catalog', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Clean up expired boosts
    const now = new Date();
    const activeBoosts = (user.activeBoosts || []).filter((b) => new Date(b.expiresAt) > now);

    res.json({
      gems: user.gems || 0,
      items: getAllItems(),
      inventory: user.inventory || [],
      activeBoosts,
      freezesAvailable: user.streak?.freezesAvailable || 0,
      unlockedCostumes: user.mascot?.unlockedCostumes || ['DEFAULT'],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/shop/buy-item
 * Transactional, atomic item purchase.
 * Prevents double-spend via atomic query: { _id: userId, gems: { $gte: cost } }
 * Records an immutable GemTransaction audit log row.
 */
router.post(
  '/api/shop/buy-item',
  shopPurchaseLimiter,
  requireIdempotency(86400),
  async (req, res, next) => {
    try {
      const { itemId } = req.body;
      if (!itemId) {
        return res.status(400).json({ error: 'itemId is required' });
      }

      const itemDef = getItem(itemId);
      if (!itemDef) {
        return res.status(404).json({ error: `Item '${itemId}' not found in catalog` });
      }

      const cost = itemDef.costGems;

      // 1. Atomic conditional deduction: Reject if balance is insufficient
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.userId, gems: { $gte: cost } },
        { $inc: { gems: -cost } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(400).json({
          error: 'Insufficient gems for this purchase',
          required: cost,
        });
      }

      // 2. Apply item effect
      const effect = itemDef.effect;

      if (effect.type === 'ADD_FREEZE') {
        updatedUser.streak.freezesAvailable = (updatedUser.streak.freezesAvailable || 0) + effect.amount;
      } else if (effect.type === 'UNLOCK_COSTUME') {
        if (!updatedUser.mascot.unlockedCostumes.includes(effect.costumeId)) {
          updatedUser.mascot.unlockedCostumes.push(effect.costumeId);
        }
      } else if (effect.type === 'ACTIVE_BOOST') {
        // Stacking rule: If boost already active, extend duration!
        const existingBoostIndex = updatedUser.activeBoosts.findIndex(
          (b) => b.boostType === effect.boostType && new Date(b.expiresAt) > new Date()
        );

        const durationMs = effect.durationMinutes * 60 * 1000;

        if (existingBoostIndex >= 0) {
          const currentExpiry = new Date(updatedUser.activeBoosts[existingBoostIndex].expiresAt).getTime();
          updatedUser.activeBoosts[existingBoostIndex].expiresAt = new Date(currentExpiry + durationMs);
        } else {
          updatedUser.activeBoosts.push({
            boostType: effect.boostType,
            expiresAt: new Date(Date.now() + durationMs),
            multiplier: effect.multiplier,
          });
        }
      } else if (effect.type === 'INVENTORY_QUANTITY') {
        const invItem = updatedUser.inventory.find((i) => i.itemId === itemId);
        if (invItem) {
          invItem.quantity += effect.amount;
        } else {
          updatedUser.inventory.push({ itemId, quantity: effect.amount });
        }
      }

      await updatedUser.save();

      // 3. Write immutable audit log row in GemTransaction
      await GemTransaction.create({
        userId: req.userId,
        delta: -cost,
        reason: 'PURCHASE',
        refId: itemId,
        balanceAfter: updatedUser.gems,
      });

      res.json({
        success: true,
        message: `Successfully purchased ${itemDef.name}`,
        item: itemDef,
        gems: updatedUser.gems,
        inventory: updatedUser.inventory,
        activeBoosts: updatedUser.activeBoosts,
        freezesAvailable: updatedUser.streak.freezesAvailable,
        unlockedCostumes: updatedUser.mascot.unlockedCostumes,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/shop/activate-boost
 * Activate a boost from inventory.
 */
router.post('/api/shop/activate-boost', requireIdempotency(86400), async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const itemDef = getItem(itemId);

    if (!itemDef || itemDef.effect.type !== 'ACTIVE_BOOST') {
      return res.status(400).json({ error: 'Invalid boost item' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Stacking rule: Extend expiration if already running
    const durationMs = itemDef.effect.durationMinutes * 60 * 1000;
    const existingIndex = user.activeBoosts.findIndex(
      (b) => b.boostType === itemDef.effect.boostType && new Date(b.expiresAt) > new Date()
    );

    if (existingIndex >= 0) {
      const currentExpiry = new Date(user.activeBoosts[existingIndex].expiresAt).getTime();
      user.activeBoosts[existingIndex].expiresAt = new Date(currentExpiry + durationMs);
    } else {
      user.activeBoosts.push({
        boostType: itemDef.effect.boostType,
        expiresAt: new Date(Date.now() + durationMs),
        multiplier: itemDef.effect.multiplier,
      });
    }

    await user.save();

    res.json({
      success: true,
      message: `Activated ${itemDef.name}`,
      activeBoosts: user.activeBoosts,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
