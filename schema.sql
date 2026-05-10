-- Supabase Schema for Dashboard Cards Table

CREATE TABLE dashboard_cards (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    state TEXT CHECK (state IN ('Draft', 'Ready', 'In Progress', 'Done')) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_state ON dashboard_cards(state);

-- Enable Row Level Security
ALTER TABLE dashboard_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY select_policy ON dashboard_cards
    FOR SELECT
    USING (state = 'Ready' OR state = 'In Progress');

CREATE POLICY update_policy ON dashboard_cards
    FOR UPDATE
    USING (state = 'In Progress');

CREATE POLICY delete_policy ON dashboard_cards
    FOR DELETE
    USING (state = 'Done');