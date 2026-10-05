-- CardaLink IAM Authentication & Authorization Database Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('FARMER', 'TRADER', 'EXPORTER', 'ADMIN')),
    password_hash VARCHAR(255) NOT NULL,
    avatar TEXT DEFAULT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')) DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Identity provider table for Google OAuth 2.0 / SSO
CREATE TABLE IF NOT EXISTS user_identities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_provider_user UNIQUE (provider, provider_user_id)
);

-- Security & Activity Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_identities_user ON user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

CREATE TABLE IF NOT EXISTS marketplace_listings (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variety VARCHAR(100) NOT NULL,
    available_quantity_kg NUMERIC(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'KG',
    price_per_kg NUMERIC(10,2) DEFAULT 0.00,
    grade VARCHAR(50) DEFAULT '8mm Bold',
    plantation_id INTEGER REFERENCES plantations(id) ON DELETE SET NULL,
    harvest_record_id INTEGER REFERENCES harvest_records(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'AVAILABLE',
    available_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_requests (
    id SERIAL PRIMARY KEY,
    trader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marketplace_listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE SET NULL,
    variety VARCHAR(100) NOT NULL,
    available_quantity_kg NUMERIC(10,2) DEFAULT 0.00,
    requested_quantity_kg NUMERIC(10,2) NOT NULL,
    price_per_kg NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS export_supply_requests (
    id SERIAL PRIMARY KEY,
    trader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    variety VARCHAR(100) NOT NULL,
    quantity_kg NUMERIC(10,2) NOT NULL,
    price_per_kg NUMERIC(10,2) DEFAULT 0.00,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


