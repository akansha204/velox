import express from "express";
import cors from "cors";
import deploymentRoutes from "./routes/deploymentRoutes";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/deployments", deploymentRoutes);

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});