import express from "express";
import cors from "cors";
import deploymentRoutes from "./routes/deploymentRoutes";
import { config } from "./config";
import { startDeploymentCleanupScheduler } from "./services/cleanupService";
const app = express();

app.use(
  cors({
    origin: config.frontendOrigin,
  }),
);
app.use(express.json());

app.use("/deployments", deploymentRoutes);

app.get("/", (req, res) => {
  res.send("Backend running");
});

startDeploymentCleanupScheduler();

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
