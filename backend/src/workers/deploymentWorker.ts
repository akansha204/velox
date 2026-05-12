import { spawn } from "child_process";
import path from "path";
import fs from "fs";

import { addLog } from "../services/logService";
import {
  updateDeploymentStatus,
  updateDeployment,
} from "../services/deploymentService";
import { config, getDeploymentPublicUrl } from "../config";

export function runDeployment(id: string, repoUrl: string) {
  const projectPath = path.join(__dirname, "../../tmp", id);
  const port = 4000 + Math.floor(Math.random() * 1000);

  fs.mkdirSync(projectPath, { recursive: true });

  //cloning the repo
  updateDeploymentStatus(id, "building");
  addLog(id, "Cloning repository...");

  const clone = spawn("git", ["clone", repoUrl, projectPath]);

  clone.stdout.on("data", (data) => addLog(id, data.toString()));
  clone.stderr.on("data", (data) => addLog(id, data.toString()));

  clone.on("close", (code) => {
    if (code !== 0) {
      updateDeploymentStatus(id, "failed");
      addLog(id, "Git clone failed");
      return;
    }

    //build
    addLog(id, "Building with Railpack...");

    const build = spawn("railpack", ["build", "."], {
      cwd: projectPath,
      env: {
        ...process.env,
        BUILDKIT_HOST: config.buildkitHost,
      },
    });

    build.stdout.on("data", (data) => addLog(id, data.toString()));
    build.stderr.on("data", (data) => addLog(id, data.toString()));

    build.on("close", (code) => {
      if (code !== 0) {
        updateDeploymentStatus(id, "failed");
        addLog(id, "Build failed");
        return;
      }

      //fetch img id
      addLog(id, "Fetching image...");

      const images = spawn("docker", ["images", "-q"]);

      let imageId = "";

      images.stdout.on("data", (data) => {
        imageId = data.toString().split("\n")[0]; //latest image
      });

      images.on("close", () => {
        if (!imageId) {
          updateDeploymentStatus(id, "failed");
          addLog(id, "No image found");
          return;
        }

        //running container
        updateDeploymentStatus(id, "deploying");
        addLog(id, "Starting container...");

        const run = spawn("docker", [
          "run",
          "-d",
          "-p",
          `${port}:3000`,
          "-e",
          "PORT=3000",
          imageId,
        ]);

        run.stdout.on("data", (data) => addLog(id, data.toString()));
        run.stderr.on("data", (data) => addLog(id, data.toString()));

        run.on("close", () => {
          updateDeploymentStatus(id, "running");

          updateDeployment(id, {
            imageTag: imageId,
            port,
          });

          addLog(id, `App running at ${getDeploymentPublicUrl(id)}`);
        });
      });
    });
  });
}