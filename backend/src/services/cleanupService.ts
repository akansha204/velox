import db from "../db";
import { config } from "../config";
import { closeClients } from "./logService";

type ExpiredDeployment = {
  id: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getExpiredDeploymentIds(now = Date.now()) {
  const expiresBefore = now - config.deploymentTtlDays * DAY_IN_MS;

  const expiredDeployments = db.prepare(`
    SELECT id
    FROM deployments
    WHERE createdAt < ?
  `).all(expiresBefore) as ExpiredDeployment[];

  return expiredDeployments.map((deployment) => deployment.id);
}

function pruneOrphanedLogs() {
  db.prepare(`
    DELETE FROM deployment_logs
    WHERE deploymentId NOT IN (
      SELECT id FROM deployments
    )
  `).run();
}

export function cleanupExpiredDeployments(now = Date.now()) {
  const expiredDeploymentIds = getExpiredDeploymentIds(now);

  if (expiredDeploymentIds.length === 0) {
    pruneOrphanedLogs();
    return 0;
  }

  const deleteExpiredDeployments = db.transaction((deploymentIds: string[]) => {
    const deleteLogs = db.prepare(`
      DELETE FROM deployment_logs
      WHERE deploymentId = ?
    `);

    const deleteDeployment = db.prepare(`
      DELETE FROM deployments
      WHERE id = ?
    `);

    deploymentIds.forEach((deploymentId) => {
      deleteLogs.run(deploymentId);
      deleteDeployment.run(deploymentId);
    });

    pruneOrphanedLogs();
  });

  deleteExpiredDeployments(expiredDeploymentIds);
  closeClients(expiredDeploymentIds);

  console.log(
    `Cleaned up ${expiredDeploymentIds.length} expired deployment(s).`,
  );

  return expiredDeploymentIds.length;
}

export function startDeploymentCleanupScheduler() {
  cleanupExpiredDeployments();

  const interval = setInterval(() => {
    cleanupExpiredDeployments();
  }, config.cleanupIntervalMs);

  interval.unref();
}
