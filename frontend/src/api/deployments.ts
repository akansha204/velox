import type { DeploymentStatus } from "../components/deployments/types";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type BackendDeployment = {
  id: string;
  repoUrl: string;
  status: DeploymentStatus;
  imageTag: string | null;
  port: number | null;
  createdAt: number;
};

export type CreateDeploymentInput = {
  repoUrl: string;
};

export type CreateDeploymentResponse = {
  id: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : "Request failed";

    throw new Error(message);
  }

  return data as T;
}

export async function getDeployments(): Promise<BackendDeployment[]> {
  const response = await fetch(`${API_BASE_URL}/deployments`);

  return parseJsonResponse<BackendDeployment[]>(response);
}

export async function createDeployment({
  repoUrl,
}: CreateDeploymentInput): Promise<CreateDeploymentResponse> {
  const response = await fetch(`${API_BASE_URL}/deployments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repoUrl }),
  });

  return parseJsonResponse<CreateDeploymentResponse>(response);
}
