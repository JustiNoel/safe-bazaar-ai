import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// ============ GET SUBSCRIPTION STATUS ============
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subResult = await query(
      `SELECT s.id, s.plan_name, s.status, s.billing_cycle, s.started_at, s.ends_at, 
              s.amount_paid, s.auto_renewal, u.premium_expires_at
       FROM subscriptions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1 AND s.status IN ('active', 'pending')
       ORDER BY s.started_at DESC
       LIMIT 1`,
      [userId]
    );

    if (subResult.rows.length === 0) {
      return res.status(200).json({
        message: 'No active subscription',
        subscription: null,
        tier: 'free',
      });
    }

    const subscription = subResult.rows[0];

    res.status(200).json({
      subscription: {
        id: subscription.id,
        planName: subscription.plan_name,
        status: subscription.status,
        billingCycle: subscription.billing_cycle,
        startedAt: subscription.started_at,
        endsAt: subscription.ends_at,
        amountPaid: subscription.amount_paid,
        autoRenewal: subscription.auto_renewal,
        premiumExpiresAt: subscription.premium_expires_at,
      },
      tier: subscription.plan_name === 'free' ? 'free' : 'premium',
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
};

// ============ UPGRADE TO PREMIUM ============
export const upgradeToPremium = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { billingCycle, paymentMethod, paymentReference } = req.body;

    if (!billingCycle || !paymentMethod) {
      return res.status(400).json({ error: 'Billing cycle and payment method are required' });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    // Get user
    const userResult = await query(
      `SELECT id, subscription_tier FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Calculate expiration date
    const expiresAt = new Date();
    if (billingCycle === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Determine amount based on billing cycle
    const amount = billingCycle === 'monthly' ? 9.99 : 99.99;

    // Create subscription record
    const subscriptionId = uuidv4();
    const subResult = await query(
      `INSERT INTO subscriptions (
        id, user_id, plan_name, status, billing_cycle, amount_paid, 
        payment_method, payment_reference, starts_at, ends_at, auto_renewal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, $10)
       RETURNING id, starts_at, ends_at`,
      [
        subscriptionId,
        userId,
        'premium',
        'active',
        billingCycle,
        amount,
        paymentMethod,
        paymentReference || null,
        expiresAt,
        true,
      ]
    );

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

    // Log the action
    await query(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, changes, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'premium_upgrade',
        'subscriptions',
        subscriptionId,
        JSON.stringify({ 
          billingCycle, 
          amount, 
          expiresAt: expiresAt.toISOString(),
          paymentMethod 
        }),
        'User upgraded to premium subscription',
      ]
    );

    const subscription = subResult.rows[0];

    res.status(201).json({
      message: 'Successfully upgraded to premium',
      subscription: {
        id: subscription.id,
        planName: 'premium',
        status: 'active',
        billingCycle,
        startsAt: subscription.starts_at,
        endsAt: subscription.ends_at,
        amountPaid: amount,
      },
      expiresAt,
    });
  } catch (error) {
    console.error('Upgrade to premium error:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
};

// ============ CANCEL SUBSCRIPTION ============
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reason } = req.body;

    const subResult = await query(
      `UPDATE subscriptions 
       SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND status = 'active'
       RETURNING id`,
      [userId]
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Downgrade user to free tier
    await query(
      `UPDATE users 
       SET subscription_tier = 'free', 
           premium_expires_at = NULL,
           free_scans_used = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );

    // Log the cancellation
    await query(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'subscription_cancelled', 'subscriptions', subResult.rows[0].id, reason || null]
    );

    res.status(200).json({
      message: 'Subscription cancelled successfully',
      cancelledAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// ============ GET PRICING PLANS ============
export const getPricingPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        price: 0,
        currency: 'USD',
        scansPerMonth: 3,
        features: [
          '3 scans per month',
          'Basic fraud detection',
          'Community support',
          'Limited results history',
        ],
      },
      {
        id: 'premium-monthly',
        name: 'Premium Monthly',
        description: 'For serious marketplace users',
        price: 9.99,
        currency: 'USD',
        billingCycle: 'monthly',
        scansPerMonth: -1, // unlimited
        features: [
          'Unlimited scans',
          'Advanced AI fraud detection',
          'Priority email support',
          'Full results history',
          'Risk analytics dashboard',
          'API access',
          'Early access to new features',
        ],
      },
      {
        id: 'premium-yearly',
        name: 'Premium Yearly',
        description: 'Best value for power users',
        price: 99.99,
        currency: 'USD',
        billingCycle: 'yearly',
        scansPerMonth: -1, // unlimited
        features: [
          'Unlimited scans',
          'Advanced AI fraud detection',
          'Priority email & phone support',
          'Full results history',
          'Risk analytics dashboard',
          'API access with higher limits',
          'Early access to new features',
          'Save 16% vs monthly',
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Custom solutions for large organizations',
        price: 'Custom',
        currency: 'USD',
        scansPerMonth: -1, // unlimited
        features: [
          'Unlimited scans & users',
          'Enterprise-grade security',
          'Dedicated account manager',
          'Custom integration support',
          'SLA guarantee',
          'Advanced analytics & reporting',
          'On-premise deployment option',
        ],
      },
    ];

    res.status(200).json({
      plans,
    });
  } catch (error) {
    console.error('Get pricing plans error:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
};

export default {
  getSubscriptionStatus,
  upgradeToPremium,
  cancelSubscription,
  getPricingPlans,
};
