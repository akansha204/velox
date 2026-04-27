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

const router = Router();

router.post("/", (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "repoUrl required" });
  }

  const id = createDeployment(repoUrl);

  setTimeout(() => addLog(id, "Cloning repo..."), 1000);
  setTimeout(() => addLog(id, "Installing dependencies..."), 2000);
  setTimeout(() => addLog(id, "Building project..."), 3000);
  setTimeout(() => addLog(id, "Deployment complete!"), 4000);

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

export default router;