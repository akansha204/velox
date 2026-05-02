import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api/deployments";
import type { LogLine } from "../components/deployments/types";

type DeploymentLogsState = {
  deploymentId?: string;
  errorMessage?: string;
  logs: LogLine[];
};

function getLogTone(message: string): LogLine["tone"] {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("failed") || normalizedMessage.includes("error")) {
    return "error";
  }

  if (
    normalizedMessage.includes("successful") ||
    normalizedMessage.includes("running at")
  ) {
    return "success";
  }

  return "default";
}

export function useDeploymentLogs(deploymentId?: string) {
  const [logsState, setLogsState] = useState<DeploymentLogsState>({
    logs: [],
  });

  useEffect(() => {
    if (!deploymentId) {
      return;
    }

    const eventSource = new EventSource(
      `${API_BASE_URL}/deployments/${deploymentId}/logs`,
    );

    eventSource.onmessage = (event) => {
      const message = event.data;

      setLogsState((currentState) => {
        const currentLogs =
          currentState.deploymentId === deploymentId ? currentState.logs : [];

        return {
          deploymentId,
          logs: [
            ...currentLogs,
            {
              id: `${Date.now()}-${currentLogs.length}`,
              message,
              tone: getLogTone(message),
            },
          ],
        };
      });
    };

    eventSource.onerror = () => {
      setLogsState({
        deploymentId,
        errorMessage: "Could not connect to deployment logs.",
        logs: [],
      });
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [deploymentId]);

  const isCurrentDeployment = logsState.deploymentId === deploymentId;

  return {
    errorMessage: isCurrentDeployment ? logsState.errorMessage : undefined,
    logs: deploymentId ? (isCurrentDeployment ? logsState.logs : []) : undefined,
  };
}
