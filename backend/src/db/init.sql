-- Safe Bazaar AI Database Schema
-- Comprehensive schema for user management, subscriptions, and scanning

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  
  -- Subscription & Tier Information
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Scan Quota
  free_scans_used INT DEFAULT 0,
  free_scans_limit INT DEFAULT 3,
  total_scans INT DEFAULT 0,
  
  -- Account Status
  email_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional Profile Info
  profile_image_url TEXT,
  bio TEXT,
  country VARCHAR(100),
  city VARCHAR(100)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- ============ SUBSCRIPTIONS TABLE ============
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  plan_name VARCHAR(50) NOT NULL CHECK (plan_name IN ('free', 'premium', 'enterprise')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  
  -- Pricing & Billing
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Dates
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP WITH TIME ZONE,
  renewed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment Info
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  auto_renewal BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_ends_at ON subscriptions(ends_at);

-- ============ SCANS TABLE ============
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Scan Details
  scan_type VARCHAR(50) NOT NULL DEFAULT 'fraud_check' CHECK (
    scan_type IN ('fraud_check', 'product_verification', 'seller_verification', 'general_security')
  ),
  
  -- What was scanned
  scanned_data JSONB DEFAULT '{}',
  scan_query TEXT,
  
  -- Results
  result_status VARCHAR(20) DEFAULT 'pending' CHECK (
    result_status IN ('pending', 'completed', 'failed', 'error')
  ),
  result_data JSONB DEFAULT '{}',
  risk_score INT DEFAULT 0,
  risk_level VARCHAR(20) DEFAULT 'unknown' CHECK (
    risk_level IN ('low', 'medium', 'high', 'unknown')
  ),
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT
);

CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_created_at ON scans(created_at);
CREATE INDEX idx_scans_result_status ON scans(result_status);
CREATE INDEX idx_scans_risk_level ON scans(risk_level);

-- ============ SCAN QUOTA HISTORY ============
CREATE TABLE IF NOT EXISTS scan_quota_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  action VARCHAR(50) NOT NULL CHECK (
    action IN ('scan_used', 'quota_reset', 'premium_upgrade', 'subscription_expired', 'manual_adjustment')
  ),
  
  scans_before INT,
  scans_after INT,
  scans_change INT,
  
  reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_quota_history_user_id ON scan_quota_history(user_id);

-- ============ ADMIN LOGS TABLE ============
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  
  changes JSONB DEFAULT '{}',
  reason TEXT,
  ip_address VARCHAR(45),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);

-- ============ ANALYTICS TABLE ============
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC,
  
  date_recorded DATE NOT NULL,
  time_recorded TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  dimensions JSONB DEFAULT '{}', -- Additional contextual data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_metric_name ON analytics(metric_name);
CREATE INDEX idx_analytics_date_recorded ON analytics(date_recorded);

-- ============ SECURITY/BLACKLIST TABLE ============
CREATE TABLE IF NOT EXISTS ip_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  reason VARCHAR(255),
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  unblock_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_ip_blacklist_is_active ON ip_blacklist(is_active);

-- ============ EMAIL VERIFICATION TOKENS ============
CREATE TABLE IF NOT EXISTS email_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('email_verification', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_tokens_user_id ON email_tokens(user_id);
CREATE INDEX idx_email_tokens_token ON email_tokens(token);

-- ============ REFRESH TOKENS ============
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============ SAMPLE DATA FOR TESTING ============
-- Insert a test admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, subscription_tier, is_admin, is_active, email_verified)
VALUES (
  'admin@safebazaar.com',
  '$2b$10$YourHashedPasswordHere', -- Will be replaced with actual hash during setup
  'Admin',
  'User',
  'premium',
  TRUE,
  TRUE,
  TRUE
) ON CONFLICT DO NOTHING;

-- Insert sample free user (password: user123)
INSERT INTO users (email, password_hash, first_name, last_name, subscription_tier, is_active, email_verified)
VALUES (
  'user@example.com',
  '$2b$10$YourHashedPasswordHere',
  'Test',
  'User',
  'free',
  TRUE,
  TRUE
) ON CONFLICT DO NOTHING;
