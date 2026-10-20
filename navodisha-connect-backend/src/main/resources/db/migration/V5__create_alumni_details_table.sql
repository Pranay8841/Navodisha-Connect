-- V5__create_alumni_details_table.sql
-- Table capturing JNV alumni profile details linked to users

CREATE TABLE alumni_details (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    join_batch_year INTEGER NOT NULL,
    current_org VARCHAR(150),
    designation VARCHAR(100),
    current_city VARCHAR(100),
    bio VARCHAR(250),
    provide_mentorships_on TEXT[],
    willing_modes TEXT[],
    open_to_help BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alumni_batch ON alumni_details(join_batch_year);
CREATE INDEX idx_alumni_open_to_help ON alumni_details(open_to_help);
