-- V3__add_jnv_name_to_users.sql
-- Add JNV school identity to users table (common to students, alumni, and JNV admins)

ALTER TABLE users 
ADD COLUMN jnv_name VARCHAR(150);

-- Index for searching users by JNV school
CREATE INDEX idx_users_jnv_name ON users(jnv_name);
