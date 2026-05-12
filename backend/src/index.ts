import express from "express";
import cors from "cors";
import deploymentRoutes from "./routes/deploymentRoutes";
import { config } from "./config";
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

app.listen(3001, () => {
  console.log("Server running on port 3001");
});