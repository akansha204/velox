import db from "../db";
import { randomUUID } from "crypto";
import { getDeploymentPublicUrl } from "../config";
import { cleanupExpiredDeployments } from "./cleanupService";

export type DeploymentRecord = {
  id: string;
  repoUrl: string;
  status: string;
  imageTag: string | null;
  port: number | null;
  createdAt: number;
};

export type DeploymentResponse = DeploymentRecord & {
  liveUrl?: string;
};

export function createDeployment(repoUrl: string) {
  const id = randomUUID();

  db.prepare(`
    INSERT INTO deployments (id, repoUrl, status, imageTag, port, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, repoUrl, "pending", null, null, Date.now());

  return id;
}

export function getDeployments() {
  cleanupExpiredDeployments();

  const deployments = db.prepare(`
    SELECT * FROM deployments ORDER BY createdAt DESC
  `).all() as DeploymentRecord[];

  return deployments.map((deployment) => ({
    ...deployment,
    liveUrl:
      deployment.status === "running"
        ? getDeploymentPublicUrl(deployment.id)
        : undefined,
  }));
}

export function getDeploymentById(id: string) {
  cleanupExpiredDeployments();

  return db.prepare(`
    SELECT * FROM deployments WHERE id = ?
  `).get(id) as DeploymentRecord | undefined;
}

export function updateDeployment(id: string, data: any) {
  db.prepare(`
    UPDATE deployments 
    SET imageTag = ?, port = ? 
    WHERE id = ?
  `).run(data.imageTag, data.port, id);
}

export function updateDeploymentStatus(id: string, status: string) {
  db.prepare(`
    UPDATE deployments SET status = ? WHERE id = ?
  `).run(status, id);
}