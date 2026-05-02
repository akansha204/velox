import Database from "better-sqlite3";

const db: any = new Database("database.db");

db.prepare(`
  CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    repoUrl TEXT,
    status TEXT,
    imageTag TEXT,
    port INTEGER,
    createdAt INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS deployment_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deploymentId TEXT NOT NULL,
    message TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  )
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_deployment_logs_deployment_id
  ON deployment_logs (deploymentId, id)
`).run();

export default db;
