import type { LogLine } from "./types";

const logToneStyles: Record<NonNullable<LogLine["tone"]>, string> = {
  default: "text-gray-300",
  success: "text-green-400",
  error: "text-red-400",
};

type LogsViewerProps = {
  logs?: LogLine[];
};

export function LogsViewer({ logs }: LogsViewerProps) {
  return (
    <section className="rounded-xl bg-gray-900 p-4 text-gray-200 shadow-md">
      <h2 className="mb-2 text-sm font-semibold">Logs</h2>

      {logs ? (
        <div className="max-h-80 space-y-1 overflow-y-auto font-mono text-sm">
          {logs.map((log) => (
            <p
              className={logToneStyles[log.tone ?? "default"]}
              key={log.id}
            >
              {log.message}
            </p>
          ))}
        </div>
      ) : (
        <p className="font-mono text-sm text-gray-400">
          Select a deployment to view logs.
        </p>
      )}
    </section>
  );
}
