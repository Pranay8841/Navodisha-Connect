-- V4__create_student_details_table.sql
-- Table capturing JNV student profile details linked to users

CREATE TABLE student_details (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    join_batch_year INTEGER NOT NULL,
    class_level VARCHAR(20) NOT NULL,
    stream VARCHAR(50),
    house VARCHAR(30),
    preparing_for TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_student_class CHECK (class_level IN ('Class 10', 'Class 11', 'Class 12')),
    CONSTRAINT chk_student_stream CHECK (
        stream IS NULL OR stream IN ('Science (PCM)', 'Science (PCB)', 'Science (PCMB)', 'Commerce', 'Arts')
    ),
    CONSTRAINT chk_student_house CHECK (
        house IS NULL OR house IN ('ARAVALI', 'NILGIRI', 'SHIVALIK', 'UDAYGIRI')
    )
);

CREATE INDEX idx_student_batch ON student_details(join_batch_year);
CREATE INDEX idx_student_class ON student_details(class_level);
