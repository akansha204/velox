import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  API_BASE_URL,
  createDeployment,
  getDeployments,
} from "../../api/deployments";
import { useDeploymentLogs } from "../../hooks/useDeploymentLogs";
import { CreateDeploymentForm } from "./CreateDeploymentForm";
import { DeploymentList } from "./DeploymentList";
import { LogsViewer } from "./LogsViewer";
import { PlatformSupportSection } from "./PlatformSupportSection";
import type { Deployment, DeploymentStatus } from "./types";

const activeStatuses: DeploymentStatus[] = ["pending", "building", "deploying"];

function hasActiveDeployment(deployments?: Deployment[]) {
  return deployments?.some((deployment) =>
    activeStatuses.includes(deployment.status),
  );
}

export function DeploymentDashboard() {
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>();
  const queryClient = useQueryClient();
  const deploymentsQuery = useQuery({
    queryKey: ["deployments"],
    queryFn: getDeployments,
    refetchInterval: (query) =>
      hasActiveDeployment(query.state.data) ? 2_000 : false,
  });
  const createDeploymentMutation = useMutation({
    mutationFn: createDeployment,
    onSuccess: (createdDeployment) => {
      setSelectedDeploymentId(createdDeployment.id);
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });

  const deployments: Deployment[] = useMemo(
    () =>
      (deploymentsQuery.data ?? []).map((deployment) => ({
        ...deployment,
        liveUrl:
          deployment.status === "running"
            ? `${API_BASE_URL}/deployments/${deployment.id}`
            : undefined,
      })),
    [deploymentsQuery.data],
  );

  const deploymentLogs = useDeploymentLogs(selectedDeploymentId);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <PlatformSupportSection />
      <CreateDeploymentForm
        errorMessage={
          createDeploymentMutation.isError
            ? createDeploymentMutation.error.message
            : undefined
        }
        isSubmitting={createDeploymentMutation.isPending}
        onCreateDeployment={(repoUrl) =>
          createDeploymentMutation.mutate({ repoUrl })
        }
      />
      <DeploymentList
        deployments={deployments}
        errorMessage={
          deploymentsQuery.isError
            ? "Could not load deployments. Check that the backend and Caddy are running."
            : undefined
        }
        isLoading={deploymentsQuery.isLoading}
        onSelectDeployment={setSelectedDeploymentId}
        selectedDeploymentId={selectedDeploymentId}
      />
      <LogsViewer
        errorMessage={deploymentLogs.errorMessage}
        logs={selectedDeploymentId ? deploymentLogs.logs : undefined}
      />
    </main>
  );
}
