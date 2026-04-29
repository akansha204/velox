import { Router } from "express";
import {
  addClient,
  removeClient,
  getLogs,
  addLog,
} from "../services/logService";
import {
  createDeployment,
  getDeployments,
} from "../services/deploymentService";
import { runDeployment } from "../workers/deploymentWorker";
import db from "../db";


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

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  const existingLogs = getLogs(id);
  existingLogs.forEach((log) => {
    res.write(`data: ${log}\n\n`);
  });

  addClient(id, res);

  req.on("close", () => {
    removeClient(id, res);
  });
});

router.delete("/reset", (req, res) => {
  db.prepare("DELETE FROM deployments").run();
  res.json({ success: true });
});

router.get("/:id/proxy", (req, res) => {
  const { id } = req.params;

  const deployments = getDeployments();
  const deployment = deployments.find((d: any) => d.id === id);

  if (!deployment || !deployment.port) {
    return res.status(404).send("Not running");
  }

  
  res.redirect(`http://localhost:${deployment.port}`);
});

export default router;