import { query } from '../config/database.js';

// ============ GET DASHBOARD STATS ============
export const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const usersResult = await query(`SELECT COUNT(*) as total FROM users`);
    const totalUsers = parseInt(usersResult.rows[0].total);

    // Premium users
    const premiumResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE subscription_tier = 'premium' AND premium_expires_at > CURRENT_TIMESTAMP`
    );
    const premiumUsers = parseInt(premiumResult.rows[0].total);

    // Free users
    const freeResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE subscription_tier = 'free'`
    );
    const freeUsers = parseInt(freeResult.rows[0].total);

    // Total scans
    const scansResult = await query(`SELECT COUNT(*) as total FROM scans`);
    const totalScans = parseInt(scansResult.rows[0].total);

    // Scans today
    const scansFromTodayResult = await query(
      `SELECT COUNT(*) as total FROM scans WHERE DATE(created_at) = CURRENT_DATE`
    );
    const scansFromToday = parseInt(scansFromTodayResult.rows[0].total);

    // Revenue (from premium subscriptions)
    const revenueResult = await query(
      `SELECT SUM(amount_paid) as total FROM subscriptions WHERE status = 'active'`
    );
    const revenue = parseFloat(revenueResult.rows[0].total || 0);

    // High-risk scans
    const highRiskResult = await query(
      `SELECT COUNT(*) as total FROM scans WHERE risk_level = 'high'`
    );
    const highRiskScans = parseInt(highRiskResult.rows[0].total);

    // Active sessions (users who logged in today)
    const activeSessionsResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE DATE(last_login_at) = CURRENT_DATE`
    );
    const activeSessions = parseInt(activeSessionsResult.rows[0].total);

    res.status(200).json({
      stats: {
        totalUsers,
        premiumUsers,
        freeUsers,
        totalScans,
        scansFromToday,
        revenue,
        highRiskScans,
        activeSessions,
        conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// ============ GET ALL USERS ============
export const getAllUsers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = parseInt(req.query.offset) || 0;
    const subscription_tier = req.query.tier || null;

    let queryText = `
      SELECT id, email, first_name, last_name, phone, subscription_tier, 
             free_scans_used, free_scans_limit, total_scans, premium_expires_at,
             is_active, is_admin, created_at, last_login_at
      FROM users
    `;
    const params = [];

    if (subscription_tier && ['free', 'premium'].includes(subscription_tier)) {
      queryText += ` WHERE subscription_tier = $1`;
      params.push(subscription_tier);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const usersResult = await query(queryText, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users`;
    if (subscription_tier && ['free', 'premium'].includes(subscription_tier)) {
      countQuery += ` WHERE subscription_tier = $1`;
    }

    const countParams = subscription_tier && ['free', 'premium'].includes(subscription_tier) 
      ? [subscription_tier] 
      : [];
    const countResult = await query(countQuery, countParams);

    const users = usersResult.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      subscriptionTier: user.subscription_tier,
      freeScansUsed: user.free_scans_used,
      freeScansLimit: user.free_scans_limit,
      totalScans: user.total_scans,
      premiumExpiresAt: user.premium_expires_at,
      isActive: user.is_active,
      isAdmin: user.is_admin,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    }));

    res.status(200).json({
      users,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ============ GET USER DETAILS ============
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const userResult = await query(
      `SELECT id, email, first_name, last_name, phone, subscription_tier, 
              free_scans_used, free_scans_limit, total_scans, premium_expires_at,
              is_active, is_admin, profile_image_url, bio, country, city, created_at, 
              updated_at, last_login_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get recent scans
    const scansResult = await query(
      `SELECT id, scan_type, result_status, risk_level, created_at
       FROM scans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    // Get subscriptions
    const subsResult = await query(
      `SELECT id, plan_name, status, billing_cycle, started_at, ends_at, amount_paid
       FROM subscriptions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 5`,
      [userId]
    );

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        subscriptionTier: user.subscription_tier,
        freeScansUsed: user.free_scans_used,
        freeScansLimit: user.free_scans_limit,
        totalScans: user.total_scans,
        premiumExpiresAt: user.premium_expires_at,
        isActive: user.is_active,
        isAdmin: user.is_admin,
        profileImageUrl: user.profile_image_url,
        bio: user.bio,
        country: user.country,
        city: user.city,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at,
      },
      recentScans: scansResult.rows.map(scan => ({
        id: scan.id,
        scanType: scan.scan_type,
        resultStatus: scan.result_status,
        riskLevel: scan.risk_level,
        createdAt: scan.created_at,
      })),
      subscriptions: subsResult.rows.map(sub => ({
        id: sub.id,
        planName: sub.plan_name,
        status: sub.status,
        billingCycle: sub.billing_cycle,
        startedAt: sub.started_at,
        endsAt: sub.ends_at,
        amountPaid: sub.amount_paid,
      })),
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

// ============ UPGRADE USER TO PREMIUM (Admin) ============
export const upgradeUserPremium = async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration } = req.body; // 'monthly', 'yearly'
    const adminId = req.user.userId;

    if (!['monthly', 'yearly'].includes(duration)) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    // Verify user exists
    const userResult = await query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    if (duration === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Update user tier
    await query(
      `UPDATE users 
       SET subscription_tier = 'premium', 
           premium_expires_at = $1,
           free_scans_used = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [expiresAt, userId]
    );

    // Log admin action
    await query(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, changes, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        adminId,
        'manual_premium_upgrade',
        'users',
        userId,
        JSON.stringify({ duration, expiresAt }),
        'Admin manually upgraded user to premium',
      ]
    );

    res.status(200).json({
      message: 'User upgraded to premium successfully',
      premiumExpiresAt: expiresAt,
    });
  } catch (error) {
    console.error('Upgrade user premium error:', error);
    res.status(500).json({ error: 'Failed to upgrade user' });
  }
};

// ============ DEACTIVATE USER ============
export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    // Verify user exists
    const userResult = await query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Deactivate user
    await query(
      `UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId]
    );

    // Log admin action
    await query(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'user_deactivated', 'users', userId, reason || 'User deactivated by admin']
    );

    res.status(200).json({
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

// ============ GET ADMIN LOGS ============
export const getAdminLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    const logsResult = await query(
      `SELECT al.id, al.admin_id, u.email as admin_email, al.action, al.entity_type, 
              al.entity_id, al.reason, al.created_at
       FROM admin_logs al
       LEFT JOIN users u ON al.admin_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(`SELECT COUNT(*) as total FROM admin_logs`);

    const logs = logsResult.rows.map(log => ({
      id: log.id,
      adminId: log.admin_id,
      adminEmail: log.admin_email,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      reason: log.reason,
      createdAt: log.created_at,
    }));

    res.status(200).json({
      logs,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
};

// ============ GET SCAN ANALYTICS ============
export const getScanAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    // Scans by type
    const scanTypeResult = await query(
      `SELECT scan_type, COUNT(*) as count, AVG(risk_score) as avg_risk
       FROM scans 
       WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
       GROUP BY scan_type`
    );

    // Scans by risk level
    const riskLevelResult = await query(
      `SELECT risk_level, COUNT(*) as count
       FROM scans 
       WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
       GROUP BY risk_level`
    );

    // Daily scan count
    const dailyScansResult = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM scans 
       WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    res.status(200).json({
      scansByType: scanTypeResult.rows.map(row => ({
        type: row.scan_type,
        count: parseInt(row.count),
        averageRisk: parseFloat(row.avg_risk || 0),
      })),
      scansByRiskLevel: riskLevelResult.rows.map(row => ({
        riskLevel: row.risk_level,
        count: parseInt(row.count),
      })),
      dailyScans: dailyScansResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count),
      })),
    });
  } catch (error) {
    console.error('Get scan analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch scan analytics' });
  }
};

export default {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  upgradeUserPremium,
  deactivateUser,
  getAdminLogs,
  getScanAnalytics,
};
