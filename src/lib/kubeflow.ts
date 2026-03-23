/**
 * Kubeflow Pipelines REST API — create a run (retrain job).
 * Set KFP_API_BASE_URL to your cluster Pipeline API root, e.g.
 * https://kubeflow.example.com/pipeline
 */

export type KubeflowRetrainResult =
  | {
      ok: true;
      dryRun: true;
      message: string;
    }
  | {
      ok: true;
      dryRun: false;
      runId: string;
      runName: string;
      raw?: unknown;
    }
  | {
      ok: false;
      status: number;
      body: string;
    };

export async function triggerRetrainPipeline(runName: string): Promise<KubeflowRetrainResult> {
  const base = process.env.KFP_API_BASE_URL?.replace(/\/$/, "");
  const pipelineId = process.env.KFP_PIPELINE_ID;
  const versionId = process.env.KFP_PIPELINE_VERSION_ID;
  const token = process.env.KFP_BEARER_TOKEN;

  if (!base || !pipelineId) {
    return {
      ok: true,
      dryRun: true,
      message:
        "KFP_API_BASE_URL or KFP_PIPELINE_ID not set — dry run only. Configure env for real Kubeflow runs.",
    };
  }

  const url = `${base}/apis/v1beta1/runs`;
  const name = `${runName}-${Date.now()}`;

  const body: Record<string, unknown> = {
    name,
    description: "CrisisLens retrain triggered from web UI",
    pipeline_spec: versionId
      ? { pipeline_id: pipelineId, pipeline_version_id: versionId }
      : { pipeline_id: pipelineId },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text.slice(0, 2000) };
  }

  let parsed: { run?: { id?: string; name?: string } } = {};
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    /* ignore */
  }

  const runId = parsed.run?.id ?? "unknown";
  return {
    ok: true,
    dryRun: false,
    runId,
    runName: parsed.run?.name ?? name,
    raw: parsed,
  };
}
