export function CreateDeploymentForm() {
  return (
    <section className="space-y-4 rounded-xl bg-white p-5 shadow-md">
      <div>
        <h1 className="text-lg font-semibold text-gray-950">Create Deployment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Paste a Git repository URL to prepare a new deployment.
        </p>
      </div>

      <div className="space-y-3">
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black"
          placeholder="Enter Git repository URL"
          type="url"
        />

        <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
          Deploy
        </button>
      </div>
    </section>
  );
}
