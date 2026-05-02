import type { Response } from "express";

import db from "../db";

const MAX_LOGS_PER_DEPLOYMENT = 1000;

const clients: Record<string, Response[]> = {};

function writeSseMessage(res: Response, message: string) {
  const lines = message.replace(/\r\n/g, "\n").split("\n");

  lines.forEach((line) => {
    res.write(`data: ${line}\n`);
  });

  res.write("\n");
}

export function addLog(deploymentId: string, message: string) {
  console.log("LOG:", message);

  db.prepare(`
    INSERT INTO deployment_logs (deploymentId, message, createdAt)
    VALUES (?, ?, ?)
  `).run(deploymentId, message, Date.now());

  db.prepare(`
    DELETE FROM deployment_logs
    WHERE deploymentId = ?
      AND id NOT IN (
        SELECT id FROM deployment_logs
        WHERE deploymentId = ?
        ORDER BY id DESC
        LIMIT ?
      )
  `).run(deploymentId, deploymentId, MAX_LOGS_PER_DEPLOYMENT);

  if (clients[deploymentId]) {
    clients[deploymentId].forEach((res) => {
      writeSseMessage(res, message);
    });
  }
}

export function getLogs(deploymentId: string): string[] {
  return db.prepare(`
    SELECT message
    FROM deployment_logs
    WHERE deploymentId = ?
    ORDER BY id ASC
  `).all(deploymentId).map((log: any) => log.message);
}

export function addClient(deploymentId: string, res: Response) {
  if (!clients[deploymentId]) {
    clients[deploymentId] = [];
  }

  clients[deploymentId].push(res);
}

export function removeClient(deploymentId: string, res: Response) {
  if (!clients[deploymentId]) return;

  clients[deploymentId] = clients[deploymentId].filter(
    (client) => client !== res
  );
}

export { writeSseMessage };
