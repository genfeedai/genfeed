import Database from 'better-sqlite3';
import type { StorageConfig } from '../../factory/storage.constants';

export function createSqliteDatabase(config: StorageConfig): Database.Database {
  const db = new Database(config.sqlitePath!, {
    verbose: config.debug ? console.log : undefined,
  });

  db.pragma('journal_mode = WAL');

  initializeTables(db);

  return db;
}

function initializeTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      version INTEGER DEFAULT 1,
      nodes TEXT DEFAULT '[]',
      edges TEXT DEFAULT '[]',
      edge_style TEXT DEFAULT 'smoothstep',
      groups TEXT DEFAULT '[]',
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_workflows_deleted ON workflows(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_workflows_name ON workflows(name);

    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      started_at TEXT,
      completed_at TEXT,
      total_cost REAL DEFAULT 0,
      cost_summary TEXT DEFAULT '{}',
      node_results TEXT DEFAULT '[]',
      error TEXT,
      is_deleted INTEGER DEFAULT 0,
      execution_mode TEXT DEFAULT 'sync',
      queue_job_ids TEXT DEFAULT '[]',
      resumed_from TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workflow_id) REFERENCES workflows(id)
    );

    CREATE INDEX IF NOT EXISTS idx_executions_workflow ON executions(workflow_id, is_deleted);
    CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'custom',
      nodes TEXT DEFAULT '[]',
      edges TEXT DEFAULT '[]',
      thumbnail TEXT,
      is_system INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category, is_deleted);

    CREATE TABLE IF NOT EXISTS prompt_library (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      prompt_text TEXT NOT NULL,
      style_settings TEXT DEFAULT '{}',
      aspect_ratio TEXT DEFAULT '1:1',
      preferred_model TEXT,
      category TEXT DEFAULT 'general',
      tags TEXT DEFAULT '[]',
      use_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      thumbnail TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompt_library(category, is_deleted);
    CREATE INDEX IF NOT EXISTS idx_prompts_featured ON prompt_library(is_featured, is_deleted);
  `);
}
