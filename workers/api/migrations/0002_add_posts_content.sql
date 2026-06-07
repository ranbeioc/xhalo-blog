-- Forward migration: add content column to posts_index
-- Required for environments that executed 0001_initial.sql before the content column was added.
-- If 0001_initial.sql already includes `content TEXT`, this migration will fail with
-- "duplicate column name: content" — see docs/d1-migrations.md for resolution.
ALTER TABLE posts_index ADD COLUMN content TEXT;
