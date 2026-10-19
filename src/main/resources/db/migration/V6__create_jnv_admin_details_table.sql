-- V6__create_jnv_admin_details_table.sql
-- Table capturing JNV admin / staff profile details linked to users

CREATE TABLE jnv_admin_details (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    designation VARCHAR(100) NOT NULL,
    is_alumni_coordinator BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jnv_admin_coordinator ON jnv_admin_details(is_alumni_coordinator);
