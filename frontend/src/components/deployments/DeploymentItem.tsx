import type { Deployment, DeploymentStatus } from "./types";

const statusStyles: Record<DeploymentStatus, string> = {
  pending: "bg-gray-200 text-gray-700",
  building: "bg-yellow-100 text-yellow-700",
  deploying: "bg-blue-100 text-blue-700",
  running: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

type DeploymentItemProps = {
  deployment: Deployment;
  isSelected: boolean;
  onSelect: (deploymentId: string) => void;
};

export function DeploymentItem({
  deployment,
  isSelected,
  onSelect,
}: DeploymentItemProps) {
  return (
    <div
      className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 text-left transition hover:bg-gray-50 ${
        isSelected ? "border-black bg-gray-100" : "border-gray-200 bg-white"
      }`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(deployment.id);
        }
      }}
      onClick={() => onSelect(deployment.id)}
      role="button"
      tabIndex={0}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm text-gray-500">{deployment.id}</p>
        <p className="truncate text-sm font-medium text-gray-950">
          {deployment.imageTag ?? deployment.repoUrl}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {deployment.liveUrl ? (
          <a
            className="text-sm font-medium text-gray-700 underline-offset-4 hover:text-black hover:underline"
            href={deployment.liveUrl}
            onClick={(event) => event.stopPropagation()}
            rel="noreferrer"
            target="_blank"
          >
            Live
          </a>
        ) : null}
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[deployment.status]}`}
        >
          {deployment.status}
        </span>
      </div>
    </div>
  );
}
