-- Create unique index on slug to prevent duplicate routes
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_index_slug ON posts_index(slug);

-- Create indexes for performance tuning on posts retrieval
CREATE INDEX IF NOT EXISTS idx_posts_index_status ON posts_index(status);
CREATE INDEX IF NOT EXISTS idx_posts_index_published_at ON posts_index(published_at);
