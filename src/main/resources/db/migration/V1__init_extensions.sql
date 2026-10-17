-- V1__init_extensions.sql
-- Enable pgcrypto extension for UUID generation (gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
