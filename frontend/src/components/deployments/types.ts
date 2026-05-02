export type DeploymentStatus =
  | "pending"
  | "building"
  | "deploying"
  | "running"
  | "failed";

export type LogLine = {
  id: string;
  message: string;
  tone?: "default" | "success" | "error";
};

export type Deployment = {
  id: string;
  repoUrl: string;
  status: DeploymentStatus;
  imageTag: string | null;
  port: number | null;
  createdAt: number;
  liveUrl?: string;
};
