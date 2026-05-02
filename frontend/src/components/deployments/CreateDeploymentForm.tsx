import { useState, type FormEvent } from "react";

type CreateDeploymentFormProps = {
  errorMessage?: string;
  isSubmitting?: boolean;
  onCreateDeployment: (repoUrl: string) => void;
};

export function CreateDeploymentForm({
  errorMessage,
  isSubmitting = false,
  onCreateDeployment,
}: CreateDeploymentFormProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const canSubmit = repoUrl.trim().length > 0 && !isSubmitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedRepoUrl = repoUrl.trim();
    if (!trimmedRepoUrl || isSubmitting) return;

    onCreateDeployment(trimmedRepoUrl);
    setRepoUrl("");
  }

  return (
    <form
      className="space-y-4 rounded-xl bg-white p-5 shadow-md"
      onSubmit={handleSubmit}
    >
      <div>
        <h1 className="text-lg font-semibold text-gray-950">Create Deployment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Paste a Git repository URL to prepare a new deployment.
        </p>
      </div>

      <div className="space-y-3">
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black"
          onChange={(event) => setRepoUrl(event.target.value)}
          placeholder="Enter Git repository URL"
          type="url"
          value={repoUrl}
        />

        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : null}

        <button
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          disabled={!canSubmit}
          type="submit"
        >
          {isSubmitting ? "Deploying..." : "Deploy"}
        </button>
      </div>
    </form>
  );
}
