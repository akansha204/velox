import db from "../db";
import { randomUUID } from "crypto";

export function createDeployment(repoUrl: string) {
  const id = randomUUID();

  db.prepare(`
    INSERT INTO deployments (id, repoUrl, status, imageTag, port, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, repoUrl, "pending", null, null, Date.now());

  return id;
}

export function getDeployments() {
  return db.prepare(`
    SELECT * FROM deployments ORDER BY createdAt DESC
  `).all();
}

export function updateDeploymentStatus(id: string, status: string) {
  db.prepare(`
    UPDATE deployments SET status = ? WHERE id = ?
  `).run(status, id);
}