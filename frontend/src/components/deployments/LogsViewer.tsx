import type { LogLine } from "./types";

const logToneStyles: Record<NonNullable<LogLine["tone"]>, string> = {
  default: "text-gray-300",
  success: "text-green-400",
  error: "text-red-400",
};

type LogsViewerProps = {
  errorMessage?: string;
  logs?: LogLine[];
};

export function LogsViewer({ errorMessage, logs }: LogsViewerProps) {
  return (
    <section className="rounded-xl bg-gray-900 p-4 text-gray-200 shadow-md">
      <h2 className="mb-2 text-sm font-semibold">Logs</h2>

      {errorMessage ? (
        <p className="font-mono text-sm text-red-400">{errorMessage}</p>
      ) : logs ? (
        <div className="max-h-80 space-y-1 overflow-y-auto font-mono text-sm">
          {logs.length > 0 ? (
            logs.map((log) => (
              <p
                className={logToneStyles[log.tone ?? "default"]}
                key={log.id}
              >
                {log.message}
              </p>
            ))
          ) : (
            <p className="text-gray-400">Waiting for logs...</p>
          )}
        </div>
      ) : (
        <p className="font-mono text-sm text-gray-400">
          Select a deployment to view logs.
        </p>
      )}
    </section>
  );
}
