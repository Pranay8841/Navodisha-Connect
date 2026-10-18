-- V2__create_users_table.sql
-- Foundational users table for authentication and profile linkage

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Business constraints
    CONSTRAINT uq_users_phone_number UNIQUE (phone_number),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'ALUMNUS', 'JNV_ADMIN', 'PLATFORM_ADMIN')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'))
);

-- Indexes for high-frequency queries
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role_status ON users(role, status);
