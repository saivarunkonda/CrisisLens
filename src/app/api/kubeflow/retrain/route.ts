import { NextRequest, NextResponse } from 'next/server'

// POST /api/kubeflow/retrain
// Body: { manifest: string, tag?: string, image?: string, hyperparams?: object }
// Tries to submit a Kubernetes Job using in-cluster or kubeconfig credentials via @kubernetes/client-node.
// If Kubernetes access is not available, returns a Job manifest that CI can apply.

type Body = {
  manifest: string
  tag?: string
  image?: string
  hyperparams?: Record<string, any>
  crd?: string
}

async function createJobManifest(body: Body) {
  const ts = Date.now()
  const tag = body.tag || `manual-${ts}`
  const jobName = `retrain-${tag}-${String(ts).slice(-6)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const image = body.image || process.env.TRAINER_IMAGE || 'ghcr.io/yourorg/crisislens-trainer:latest'

  const env: Record<string, string> = {
    MANIFEST_PATH: body.manifest,
    TRAIN_TAG: tag,
    // the service role key must be provided via Kubernetes Secret mounted as env var in cluster
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  }

  const containerEnv = Object.entries(env)
    .filter(([, v]) => v !== '')
    .map(([name, value]) => ({ name, value }))

  const job = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: { name: jobName },
    spec: {
      template: {
        spec: {
          restartPolicy: 'Never',
              containers: [
            {
              name: 'trainer',
              image,
              env: containerEnv,
              // pass hyperparams as an env var if provided
              args: body.hyperparams ? ['--hyperparams', JSON.stringify(body.hyperparams)] : [],
              resources: {
                requests: {
                  cpu: body.hyperparams?.cpu || '500m',
                  memory: body.hyperparams?.memory || '1Gi',
                  ...(body.hyperparams?.gpu ? { 'nvidia.com/gpu': String(body.hyperparams.gpu) } : {}),
                },
                limits: {
                  cpu: body.hyperparams?.cpu_limit || body.hyperparams?.cpu || '1',
                  memory: body.hyperparams?.memory_limit || body.hyperparams?.memory || '2Gi',
                  ...(body.hyperparams?.gpu ? { 'nvidia.com/gpu': String(body.hyperparams.gpu) } : {}),
                },
              },
            },
          ],
        },
      },
    },
  }

  return { jobName, job }
}

async function createTFJobManifest(body: Body) {
  const ts = Date.now()
  const tag = body.tag || `manual-${ts}`
  const name = `tfjob-${tag}-${String(ts).slice(-6)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const image = body.image || process.env.TRAINER_IMAGE || 'ghcr.io/yourorg/crisislens-trainer:latest'

  const tfjob = {
    apiVersion: 'kubeflow.org/v1',
    kind: 'TFJob',
    metadata: { name },
    spec: {
      tfReplicaSpecs: {
        Chief: {
          replicas: 1,
          restartPolicy: 'Never',
          template: {
            spec: {
              containers: [
                {
                  name: 'tensorflow',
                  image,
                  args: body.hyperparams ? ['--hyperparams', JSON.stringify(body.hyperparams)] : [],
                  env: [{ name: 'MANIFEST_PATH', value: body.manifest }],
                  resources: {
                    requests: {
                      cpu: body.hyperparams?.cpu || '1000m',
                      memory: body.hyperparams?.memory || '2Gi',
                      ...(body.hyperparams?.gpu ? { 'nvidia.com/gpu': String(body.hyperparams.gpu) } : {}),
                    },
                    limits: {
                      cpu: body.hyperparams?.cpu_limit || body.hyperparams?.cpu || '2',
                      memory: body.hyperparams?.memory_limit || body.hyperparams?.memory || '4Gi',
                      ...(body.hyperparams?.gpu ? { 'nvidia.com/gpu': String(body.hyperparams.gpu) } : {}),
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  }
  return { jobName: name, job: tfjob }
}

async function createPyTorchJobManifest(body: Body) {
  const ts = Date.now()
  const tag = body.tag || `manual-${ts}`
  const name = `pytorchjob-${tag}-${String(ts).slice(-6)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const image = body.image || process.env.TRAINER_IMAGE || 'ghcr.io/yourorg/crisislens-trainer:latest'
  const workerReplicas = (body.hyperparams && body.hyperparams.workers) || 1

  const pytorch = {
    apiVersion: 'kubeflow.org/v1',
    kind: 'PyTorchJob',
    metadata: { name },
    spec: {
      pytorchReplicaSpecs: {
        Master: {
          replicas: 1,
          template: {
            spec: {
              restartPolicy: 'Never',
              containers: [
                { name: 'pytorch', image, args: body.hyperparams ? ['--hyperparams', JSON.stringify(body.hyperparams)] : [], env: [{ name: 'MANIFEST_PATH', value: body.manifest }], resources: {
                  requests: { cpu: body.hyperparams?.cpu || '1000m', memory: body.hyperparams?.memory || '2Gi', ...(body.hyperparams?.gpu ? { 'nvidia.com/gpu': String(body.hyperparams.gpu) } : {}) },
                  limits: { cpu: body.hyperparams?.cpu_limit || body.hyperparams?.cpu || '2', memory: body.hyperparams?.memory_limit || body.hyperparams?.memory || '4Gi', ...(body.hyperparams?.gpu ? { 'nvidia.com/gpu': String(body.hyperparams.gpu) } : {}) },
                } },
              ],
            },
          },
        },
        Worker: {
          replicas: workerReplicas,
          template: {
            spec: {
              restartPolicy: 'Never',
              containers: [
                { name: 'pytorch', image, args: body.hyperparams ? ['--hyperparams', JSON.stringify(body.hyperparams)] : [], env: [{ name: 'MANIFEST_PATH', value: body.manifest }] },
              ],
            },
          },
        },
      },
    },
  }
  return { jobName: name, job: pytorch }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    if (!body || !body.manifest) return NextResponse.json({ error: 'manifest is required' }, { status: 400 })

    const { jobName, job } = await createJobManifest(body)

    // Try to submit to Kubernetes if available. If USE_KUBEFLOW=true, submit a TFJob CRD.
    try {
      // dynamic import to avoid requiring the package on platforms without it
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const k8s = require('@kubernetes/client-node')
      const kc = new k8s.KubeConfig()
      try { kc.loadFromDefault() } catch (e) { /* ignore */ }

      const namespace = process.env.K8S_NAMESPACE || 'default'

      if (process.env.USE_KUBEFLOW === 'true') {
        const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi)
        const group = 'kubeflow.org'
        const version = 'v1'
        if (body.crd === 'pytorch' || process.env.USE_PYTORCH === 'true') {
          const { jobName: pyName, job: pyjob } = await createPyTorchJobManifest(body)
          const res = await k8sApi.createNamespacedCustomObject(group, version, namespace, 'pytorchjobs', pyjob)
          return NextResponse.json({ jobName: pyName, kubeResponse: res.body })
        }
        const { jobName: tfName, job: tfjob } = await createTFJobManifest(body)
        const res = await k8sApi.createNamespacedCustomObject(group, version, namespace, 'tfjobs', tfjob)
        return NextResponse.json({ jobName: tfName, kubeResponse: res.body })
      }

      const batchApi = kc.makeApiClient(k8s.BatchV1Api)
      const res = await batchApi.createNamespacedJob(namespace, job)
      return NextResponse.json({ jobName, kubeResponse: res.body })
    } catch (kerr) {
      // If kube client not present or not configured, return the manifest for CI to apply
      return NextResponse.json({ jobName, manifest: job, warning: 'Kubernetes submit unavailable; returning manifest' })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}


export const runtime = 'nodejs';
