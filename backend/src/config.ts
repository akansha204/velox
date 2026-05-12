const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const parsePositiveNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const env = process.env.VELOX_ENV ?? process.env.NODE_ENV ?? "local";

export const config = {
  env,
  apiBaseUrl: trimTrailingSlash(
    process.env.PUBLIC_API_BASE_URL ?? "http://localhost:8080",
  ),
  frontendOrigin: trimTrailingSlash(
    process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  ),
  deploymentBaseDomain: process.env.PUBLIC_DEPLOYMENT_BASE_DOMAIN,
  deploymentUrlMode: process.env.DEPLOYMENT_URL_MODE ?? "path",
  deploymentHost: process.env.DEPLOYMENT_HOST ?? "host.docker.internal",
  buildkitHost: process.env.BUILDKIT_HOST ?? "docker-container://buildkit",
  deploymentTtlDays: parsePositiveNumber(process.env.DEPLOYMENT_TTL_DAYS, 5),
  cleanupIntervalMs: parsePositiveNumber(
    process.env.CLEANUP_INTERVAL_MS,
    60 * 60 * 1000,
  ),
};

export function getDeploymentPublicUrl(deploymentId: string) {
  if (config.deploymentUrlMode === "subdomain") {
    if (!config.deploymentBaseDomain) {
      throw new Error(
        "PUBLIC_DEPLOYMENT_BASE_DOMAIN is required when DEPLOYMENT_URL_MODE=subdomain",
      );
    }

    return `https://${deploymentId}.${config.deploymentBaseDomain}`;
  }

  return `${config.apiBaseUrl}/deployments/${deploymentId}`;
}
