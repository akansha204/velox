import { Router } from "express";
import {
  addClient,
  removeClient,
  getLogs,
  writeSseMessage,
} from "../services/logService";
import {
  createDeployment,
  getDeploymentById,
  getDeployments,
} from "../services/deploymentService";
import { runDeployment } from "../workers/deploymentWorker";
import { createProxyMiddleware } from "http-proxy-middleware";
import db from "../db";
import { config } from "../config";
import { cleanupExpiredDeployments } from "../services/cleanupService";


const router = Router();

router.post("/", (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "repoUrl required" });
  }

  const id = createDeployment(repoUrl);

  setTimeout(() => {
    runDeployment(id, repoUrl);
  }, 2000);
  
  res.json({ id });
});

router.get("/", (req, res) => {
  const deployments = getDeployments();
  res.json(deployments);
});

//SSE logs
router.get("/:id/logs", (req, res) => {
  const { id } = req.params;

  cleanupExpiredDeployments();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  const existingLogs = getLogs(id);
  existingLogs.forEach((log) => {
    writeSseMessage(res, log);
  });

  addClient(id, res);

  req.on("close", () => {
    removeClient(id, res);
  });
});

router.delete("/reset", (req, res) => {
  db.prepare("DELETE FROM deployment_logs").run();
  db.prepare("DELETE FROM deployments").run();
  res.json({ success: true });
});


router.use("/:id", (req, res, next) => {
  const { id } = req.params;

  const deployment = getDeploymentById(id);

  if (!deployment || !deployment.port) {
    return res.status(404).send("Not running");
  }

  const proxy = createProxyMiddleware({
    target: `http://${config.deploymentHost}:${deployment.port}`,
    changeOrigin: true,

    pathRewrite: (_path, req) => {
      return req.url || "/";
    },
  });

  return proxy(req, res, next);
});

export default router;
