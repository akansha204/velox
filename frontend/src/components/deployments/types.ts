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
  imageTag: string;
  status: DeploymentStatus;
  liveUrl?: string;
  logs: LogLine[];
};
