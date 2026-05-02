import { DeploymentItem } from "./DeploymentItem";
import type { Deployment } from "./types";

type DeploymentListProps = {
  deployments: Deployment[];
  errorMessage?: string;
  isLoading?: boolean;
  selectedDeploymentId?: string;
  onSelectDeployment: (deploymentId: string) => void;
};

export function DeploymentList({
  deployments,
  errorMessage,
  isLoading = false,
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

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          Loading deployments...
        </div>
      ) : errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : deployments.length > 0 ? (
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
