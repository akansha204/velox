import { useMemo, useState } from "react";
import { CreateDeploymentForm } from "./CreateDeploymentForm";
import { DeploymentList } from "./DeploymentList";
import { LogsViewer } from "./LogsViewer";
import type { Deployment } from "./types";

const deployments: Deployment[] = [];

export function DeploymentDashboard() {
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>();

  const selectedDeployment = useMemo(
    () =>
      deployments.find((deployment) => deployment.id === selectedDeploymentId),
    [selectedDeploymentId],
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <CreateDeploymentForm />
      <DeploymentList
        deployments={deployments}
        onSelectDeployment={setSelectedDeploymentId}
        selectedDeploymentId={selectedDeploymentId}
      />
      <LogsViewer logs={selectedDeployment?.logs} />
    </main>
  );
}
