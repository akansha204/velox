type SupportCategory = {
  title: string;
  status: "stable" | "experimental" | "limited";
  items: string[];
  description?: string;
};

const supportCategories: SupportCategory[] = [
  {
    title: "Stable Support",
    status: "stable",
    description: "Optimized for conventional HTTP services exposing a PORT.",
    items: [
      "Node.js backend services",
      "Express applications",
      "Fastify services",
      "Hono APIs",
      "Go backend services",
    ],
  },
  {
    title: "Experimental Support",
    status: "experimental",
    description: "May work but can encounter runtime issues with asset routing and environment variables.",
    items: [
      "React/Vite applications",
      "Next.js applications",
      "Static frontend deployments",
    ],
  },
  {
    title: "Limited Support",
    status: "limited",
    description: "Require custom configuration or explicit runtime setup beyond the platform's current scope.",
    items: [
      "Rust services",
      "Python applications",
      "Java applications",
      "Monorepos and workspaces",
      "Custom runtime applications",
    ],
  },
];

const statusStyles = {
  stable: {
    badge: "bg-green-50 text-green-700 border-green-200",
    heading: "text-green-900",
    icon: "checkmark",
  },
  experimental: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    heading: "text-amber-900",
    icon: "warning",
  },
  limited: {
    badge: "bg-red-50 text-red-700 border-red-200",
    heading: "text-red-900",
    icon: "dash",
  },
};

function getStatusIcon(status: string) {
  switch (status) {
    case "stable":
      return "✓";
    case "experimental":
      return "⚠";
    case "limited":
      return "—";
    default:
      return "•";
  }
}

export function PlatformSupportSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-950">Platform Support</h2>
        <p className="text-gray-600">
          Velox is a learning-focused deployment platform. Runtime support is currently selective and evolving incrementally.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {supportCategories.map((category) => {
          const styles = statusStyles[category.status];
          return (
            <div
              key={category.title}
              className={`rounded-lg border ${styles.badge} p-5`}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xl font-bold">{getStatusIcon(category.status)}</span>
                <h3 className={`font-semibold ${styles.heading}`}>
                  {category.title}
                </h3>
              </div>

              {category.description && (
                <p className="mb-4 text-xs text-gray-600">
                  {category.description}
                </p>
              )}

              <ul className="space-y-2">
                {category.items.map((item) => (
                  <li key={item} className="text-sm text-gray-700">
                    <span className="mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs text-gray-600">
          <span className="font-medium">Note:</span> This platform prioritizes learning and experimentation around deployment infrastructure. Successful builds don't always guarantee successful runtime behavior. Check deployment logs for detailed error information.
        </p>
      </div>
    </section>
  );
}
