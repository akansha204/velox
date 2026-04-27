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

export default db;