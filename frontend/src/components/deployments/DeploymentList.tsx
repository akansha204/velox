import { DeploymentItem } from "./DeploymentItem";
import type { Deployment } from "./types";

type DeploymentListProps = {
  deployments: Deployment[];
  selectedDeploymentId?: string;
  onSelectDeployment: (deploymentId: string) => void;
};

export function DeploymentList({
  deployments,
  selectedDeploymentId,
  onSelectDeployment,
}: DeploymentListProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-950">Deployments</h2>
        <p className="mt-1 text-sm text-gray-500">
          Recent builds and rollout status.
        </p>
      </div>

      {deployments.length > 0 ? (
        <div className="space-y-3">
          {deployments.map((deployment) => (
            <DeploymentItem
              deployment={deployment}
              isSelected={deployment.id === selectedDeploymentId}
              key={deployment.id}
              onSelect={onSelectDeployment}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          No deployments yet. Start by creating one.
        </div>
      )}
    </section>
  );
}
