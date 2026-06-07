-- Migration: add preview_url column to posts_index table
-- Safe forward migration. Alters posts_index to add preview_url column if it doesn't exist.
-- Rollback: ALTER TABLE posts_index DROP COLUMN preview_url;
ALTER TABLE posts_index ADD COLUMN preview_url TEXT;
