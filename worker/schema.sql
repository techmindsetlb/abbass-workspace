-- Run with: npx wrangler d1 execute abbass-workspace --file schema.sql
CREATE TABLE IF NOT EXISTS workspaces (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
