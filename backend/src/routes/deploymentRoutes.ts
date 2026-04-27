import { Router } from "express";
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

  res.json({ id });
});

router.get("/", (req, res) => {
  const deployments = getDeployments();
  res.json(deployments);
});

export default router;