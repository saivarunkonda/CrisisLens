"use client";

import { useState } from "react";

export default function MlRetrainPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<{ configured?: boolean } | null>(null);

  async function loadConfig() {
    const res = await fetch("/api/kubeflow/retrain", { credentials: "include" });
    if (res.ok) {
      setConfig(await res.json());
    }
  }

  async function triggerRetrain() {
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/kubeflow/retrain", {
      method: "POST",
      credentials: "include",
    });
    const json = (await res.json()) as Record<string, unknown>;
    setStatus(JSON.stringify(json, null, 2));
    setLoading(false);
    await loadConfig();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">ML & Kubeflow</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Trigger a Kubeflow Pipelines run to retrain or refresh the crisis risk model (admin
          only).
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">KFP_API_BASE_URL</code>
          , <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">KFP_PIPELINE_ID</code>
          , and optional <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">KFP_BEARER_TOKEN</code>{" "}
          for a real cluster. Without them, the API returns a dry-run success for demos.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadConfig()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-600"
          >
            Check config
          </button>
          <button
            type="button"
            onClick={() => void triggerRetrain()}
            disabled={loading}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit retrain run"}
          </button>
        </div>
        {config ? (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-950">
            {JSON.stringify(config, null, 2)}
          </pre>
        ) : null}
        {status ? (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-950">
            {status}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
