import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import validator from 'validator';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;

// ============ SIGNUP ============
export const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validation
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Email, password, and first name are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userId = uuidv4();
    const result = await query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, subscription_tier, free_scans_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, first_name, last_name, subscription_tier, created_at`,
      [userId, email.toLowerCase(), passwordHash, firstName, lastName || null, phone || null, 'free', 3]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, false);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const tokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    // Log in admin logs
    await query(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'user_signup', 'users', user.id, 'New user registration']
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        subscriptionTier: user.subscription_tier,
        freeScansLimit: 3,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
};

// ============ SIGNIN ============
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const userResult = await query(
      `SELECT id, email, password_hash, first_name, last_name, is_admin, subscription_tier, 
              is_active, free_scans_used, free_scans_limit, premium_expires_at
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query(
      `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.is_admin);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const tokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    // Check if premium subscription has expired
    let subscriptionTier = user.subscription_tier;
    if (user.subscription_tier === 'premium' && user.premium_expires_at && new Date(user.premium_expires_at) < new Date()) {
      subscriptionTier = 'free';
      // Reset to free tier if expired
      await query(
        `UPDATE users SET subscription_tier = 'free', free_scans_used = 0 WHERE id = $1`,
        [user.id]
      );
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin,
        subscriptionTier,
        freeScansUsed: user.free_scans_used,
        freeScansLimit: user.free_scans_limit,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ============ REFRESH TOKEN ============
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user
    const userResult = await query(
      `SELECT id, email, is_admin FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const newAccessToken = generateAccessToken(user.id, user.email, user.is_admin);

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

// ============ GET CURRENT USER ============
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await query(
      `SELECT id, email, first_name, last_name, phone, subscription_tier, 
              free_scans_used, free_scans_limit, total_scans, premium_expires_at,
              profile_image_url, bio, country, city, created_at, is_admin
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

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
        profileImageUrl: user.profile_image_url,
        bio: user.bio,
        country: user.country,
        city: user.city,
        createdAt: user.created_at,
        isAdmin: user.is_admin,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

// ============ UPDATE PROFILE ============
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone, bio, country, city, profileImageUrl } = req.body;

    const updateQuery = `
      UPDATE users 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone = COALESCE($3, phone),
          bio = COALESCE($4, bio),
          country = COALESCE($5, country),
          city = COALESCE($6, city),
          profile_image_url = COALESCE($7, profile_image_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, email, first_name, last_name, phone, bio, country, city, profile_image_url
    `;

    const result = await query(updateQuery, [
      firstName, lastName, phone, bio, country, city, profileImageUrl, userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        bio: user.bio,
        country: user.country,
        city: user.city,
        profileImageUrl: user.profile_image_url,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ============ CHANGE PASSWORD ============
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get user
    const userResult = await query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newPasswordHash, userId]
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export default {
  signup,
  signin,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  changePassword,
};
