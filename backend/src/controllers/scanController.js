import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// ============ CHECK SCAN QUOTA ============
export const checkScanQuota = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await query(
      `SELECT subscription_tier, free_scans_used, free_scans_limit, premium_expires_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if premium subscription has expired
    let subscriptionTier = user.subscription_tier;
    let canScan = false;
    let scansRemaining = 0;

    if (user.subscription_tier === 'premium') {
      if (user.premium_expires_at && new Date(user.premium_expires_at) < new Date()) {
        // Premium has expired, downgrade to free
        subscriptionTier = 'free';
        await query(
          `UPDATE users SET subscription_tier = 'free', free_scans_used = 0 WHERE id = $1`,
          [userId]
        );
        scansRemaining = user.free_scans_limit - 0;
        canScan = scansRemaining > 0;
      } else {
        // Premium is active, unlimited scans
        canScan = true;
        scansRemaining = -1; // -1 indicates unlimited
      }
    } else {
      // Free tier
      scansRemaining = user.free_scans_limit - user.free_scans_used;
      canScan = scansRemaining > 0;
    }

    res.status(200).json({
      canScan,
      subscriptionTier,
      scansRemaining,
      freeScansUsed: user.free_scans_used,
      freeScansLimit: user.free_scans_limit,
      premiumExpiresAt: user.premium_expires_at,
    });
  } catch (error) {
    console.error('Check scan quota error:', error);
    res.status(500).json({ error: 'Failed to check scan quota' });
  }
};

// ============ PERFORM SCAN ============
export const performScan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { scanType, scanQuery, scannedData, ipAddress, userAgent } = req.body;

    if (!scanType || !scanQuery) {
      return res.status(400).json({ error: 'Scan type and query are required' });
    }

    // Check quota first
    const userResult = await query(
      `SELECT subscription_tier, free_scans_used, free_scans_limit, premium_expires_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if can scan
    let canScan = false;
    if (user.subscription_tier === 'premium') {
      if (!user.premium_expires_at || new Date(user.premium_expires_at) >= new Date()) {
        canScan = true;
      } else {
        // Expired premium
        return res.status(403).json({ error: 'Premium subscription expired. Please upgrade.' });
      }
    } else {
      if (user.free_scans_used < user.free_scans_limit) {
        canScan = true;
      }
    }

    if (!canScan) {
      return res.status(403).json({
        error: 'Scan quota exceeded. Please upgrade to premium for unlimited scans.',
        scansRemaining: 0,
      });
    }

    // Perform the scan (simplified AI fraud detection simulation)
    const scanId = uuidv4();
    const riskScore = Math.floor(Math.random() * 100); // Simulate risk score
    const riskLevel = riskScore < 30 ? 'low' : riskScore < 70 ? 'medium' : 'high';

    // Insert scan record
    const scanResult = await query(
      `INSERT INTO scans (
        id, user_id, scan_type, scan_query, scanned_data, 
        result_status, risk_score, risk_level, ip_address, user_agent, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
       RETURNING id, created_at, completed_at`,
      [
        scanId,
        userId,
        scanType,
        scanQuery,
        JSON.stringify(scannedData || {}),
        'completed',
        riskScore,
        riskLevel,
        ipAddress || null,
        userAgent || null,
      ]
    );

    // Increment scan count
    if (user.subscription_tier === 'free') {
      await query(
        `UPDATE users 
         SET free_scans_used = free_scans_used + 1, 
             total_scans = total_scans + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [userId]
      );

      // Log quota change
      await query(
        `INSERT INTO scan_quota_history (user_id, action, scans_before, scans_after, scans_change, reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, 'scan_used', user.free_scans_used, user.free_scans_used + 1, 1, `Scan performed: ${scanType}`]
      );
    } else {
      // Premium user
      await query(
        `UPDATE users 
         SET total_scans = total_scans + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [userId]
      );
    }

    const scan = scanResult.rows[0];

    res.status(201).json({
      message: 'Scan completed successfully',
      scan: {
        id: scan.id,
        scanType,
        riskScore,
        riskLevel,
        createdAt: scan.created_at,
        completedAt: scan.completed_at,
      },
      remainingScans: user.subscription_tier === 'free' 
        ? user.free_scans_limit - user.free_scans_used - 1 
        : -1,
    });
  } catch (error) {
    console.error('Perform scan error:', error);
    res.status(500).json({ error: 'Failed to perform scan' });
  }
};

// ============ GET SCAN HISTORY ============
export const getScanHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const scansResult = await query(
      `SELECT id, scan_type, scan_query, result_status, risk_score, risk_level, created_at, completed_at
       FROM scans 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM scans WHERE user_id = $1`,
      [userId]
    );

    const scans = scansResult.rows.map(scan => ({
      id: scan.id,
      scanType: scan.scan_type,
      scanQuery: scan.scan_query,
      resultStatus: scan.result_status,
      riskScore: scan.risk_score,
      riskLevel: scan.risk_level,
      createdAt: scan.created_at,
      completedAt: scan.completed_at,
    }));

    res.status(200).json({
      scans,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
};

// ============ GET SCAN DETAILS ============
export const getScanDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { scanId } = req.params;

    const scanResult = await query(
      `SELECT id, scan_type, scan_query, scanned_data, result_status, 
              risk_score, risk_level, result_data, created_at, completed_at, is_flagged, flagged_reason
       FROM scans 
       WHERE id = $1 AND user_id = $2`,
      [scanId, userId]
    );

    if (scanResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const scan = scanResult.rows[0];

    res.status(200).json({
      scan: {
        id: scan.id,
        scanType: scan.scan_type,
        scanQuery: scan.scan_query,
        scannedData: scan.scanned_data,
        resultStatus: scan.result_status,
        riskScore: scan.risk_score,
        riskLevel: scan.risk_level,
        resultData: scan.result_data,
        createdAt: scan.created_at,
        completedAt: scan.completed_at,
        isFlagged: scan.is_flagged,
        flaggedReason: scan.flagged_reason,
      },
    });
  } catch (error) {
    console.error('Get scan details error:', error);
    res.status(500).json({ error: 'Failed to fetch scan details' });
  }
};

export default {
  checkScanQuota,
  performScan,
  getScanHistory,
  getScanDetails,
};
