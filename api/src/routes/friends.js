const express = require('express');
const router = express.Router();
const { User, Friend } = require('../models');
const leagueService = require('../services/leagueService');

/**
 * POST /api/friends/add
 * Send a friend request by email or username (displayName).
 * Body: { identifier: string } — email or displayName
 */
router.post('/api/friends/add', async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'identifier (email or username) is required' });
    }

    // Find the target user by displayName (case-insensitive)
    const targetUser = await User.findOne({
      displayName: { $regex: new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      _id: { $ne: req.userId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if a friendship already exists (in either direction)
    const existing = await Friend.findOne({
      $or: [
        { userId: req.userId, friendId: targetUser._id },
        { userId: targetUser._id, friendId: req.userId },
      ],
    });

    if (existing) {
      if (existing.status === 'blocked') {
        return res.status(403).json({ error: 'Unable to send request' });
      }
      if (existing.status === 'accepted') {
        return res.status(409).json({ error: 'Already friends' });
      }
      return res.status(409).json({ error: 'Friend request already pending' });
    }

    const friendDoc = await Friend.create({
      userId: req.userId,
      friendId: targetUser._id,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Friend request sent',
      friendRequest: {
        id: friendDoc._id,
        friendId: targetUser._id,
        displayName: targetUser.displayName,
        status: 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/friends/accept
 * Accept a pending friend request.
 * Body: { friendRequestId: string }
 */
router.post('/api/friends/accept', async (req, res, next) => {
  try {
    const { friendRequestId } = req.body;
    if (!friendRequestId) {
      return res.status(400).json({ error: 'friendRequestId is required' });
    }

    const friendDoc = await Friend.findById(friendRequestId);
    if (!friendDoc) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Only the recipient can accept
    if (friendDoc.friendId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to accept this request' });
    }

    if (friendDoc.status !== 'pending') {
      return res.status(409).json({ error: `Request is already ${friendDoc.status}` });
    }

    friendDoc.status = 'accepted';
    await friendDoc.save();

    res.json({ message: 'Friend request accepted', status: 'accepted' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/friends/:friendId
 * Remove a friend or cancel/decline a request.
 */
router.delete('/api/friends/:friendId', async (req, res, next) => {
  try {
    const { friendId } = req.params;

    const result = await Friend.findOneAndDelete({
      $or: [
        { userId: req.userId, friendId },
        { userId: friendId, friendId: req.userId },
      ],
    });

    if (!result) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    res.json({ message: 'Friend removed' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/friends/list
 * Fetch accepted friends with weekly XP and streak info.
 */
router.get('/api/friends/list', async (req, res, next) => {
  try {
    const friendDocs = await Friend.find({
      $or: [
        { userId: req.userId, status: 'accepted' },
        { friendId: req.userId, status: 'accepted' },
      ],
    });

    // Extract friend user IDs
    const friendUserIds = friendDocs.map(f =>
      f.userId.toString() === req.userId.toString() ? f.friendId : f.userId
    );

    const friends = await User.find(
      { _id: { $in: friendUserIds } },
      'displayName xpTotal weeklyXP streak.current currentLeague socialOptOut.friendLeaderboard'
    );

    const friendList = friends.map(f => ({
      userId: f._id,
      displayName: f.displayName,
      xpTotal: f.xpTotal,
      weeklyXP: f.weeklyXP || 0,
      streak: f.streak?.current || 0,
      currentLeague: f.currentLeague || 'Bronze',
      optedOut: f.socialOptOut?.friendLeaderboard || false,
    }));

    res.json({ friends: friendList });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/friends/requests
 * Fetch pending friend requests (incoming).
 */
router.get('/api/friends/requests', async (req, res, next) => {
  try {
    const incoming = await Friend.find({
      friendId: req.userId,
      status: 'pending',
    });

    const senderIds = incoming.map(f => f.userId);
    const senders = await User.find(
      { _id: { $in: senderIds } },
      'displayName currentLeague'
    );
    const senderMap = {};
    senders.forEach(s => { senderMap[s._id.toString()] = s; });

    const requests = incoming.map(f => {
      const sender = senderMap[f.userId.toString()] || {};
      return {
        id: f._id,
        userId: f.userId,
        displayName: sender.displayName || 'Unknown',
        currentLeague: sender.currentLeague || 'Bronze',
        createdAt: f.createdAt,
      };
    });

    res.json({ requests });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/friends/leaderboard
 * Friends' weekly XP sorted (from Redis ZSET).
 * Respects socialOptOut.friendLeaderboard — opted-out users are excluded.
 */
router.get('/api/friends/leaderboard', async (req, res, next) => {
  try {
    // Check if requesting user has opted out
    const requestingUser = await User.findById(req.userId, 'socialOptOut');
    if (requestingUser?.socialOptOut?.friendLeaderboard) {
      return res.json({
        leaderboard: [],
        optedOut: true,
        message: 'You have opted out of friend leaderboards. Enable in Settings.',
      });
    }

    const entries = await leagueService.getFriendLeaderboard(req.userId);

    if (entries.length === 0) {
      return res.json({ leaderboard: [] });
    }

    // Populate display names and filter opted-out friends
    const userIds = entries.map(e => e.userId);
    const users = await User.find(
      { _id: { $in: userIds } },
      'displayName currentLeague socialOptOut.friendLeaderboard'
    );
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const leaderboard = entries
      .map((e, index) => {
        const u = userMap[e.userId] || {};
        // Filter out opted-out users
        if (u.socialOptOut?.friendLeaderboard) return null;
        return {
          rank: index + 1,
          userId: e.userId,
          displayName: u.displayName || 'Anonymous',
          weeklyXP: e.weeklyXP,
          currentLeague: u.currentLeague || 'Bronze',
          isYou: e.userId === req.userId.toString(),
        };
      })
      .filter(Boolean);

    // Re-rank after filtering
    leaderboard.forEach((entry, i) => { entry.rank = i + 1; });

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
