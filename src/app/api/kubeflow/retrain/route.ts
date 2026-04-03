import { NextRequest, NextResponse } from 'next/server'

// POST /api/kubeflow/retrain
// Body: { manifest: string, tag?: string, image?: string, hyperparams?: object }
// Mock endpoint for ML retraining - returns job manifest for CI/CD

type Body = {
  manifest: string
  tag?: string
  image?: string
  hyperparams?: Record<string, any>
}

async function createJobManifest(body: Body) {
  const ts = Date.now()
  const tag = body.tag || `manual-${ts}`
  const jobName = `retrain-${tag}-${String(ts).slice(-6)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const image = body.image || process.env.TRAINER_IMAGE || 'ghcr.io/saivarunkonda/crisislens/ml:latest'

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
              env: [
                { name: 'MANIFEST_PATH', value: body.manifest },
                { name: 'TRAIN_TAG', value: tag }
              ],
              resources: {
                requests: {
                  cpu: '500m',
                  memory: '1Gi'
                },
                limits: {
                  cpu: '1',
                  memory: '2Gi'
                }
              }
            }
          ]
        }
      }
    }
  }

  return { jobName, job }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    if (!body || !body.manifest) {
      return NextResponse.json({ error: 'manifest is required' }, { status: 400 })
    }

    const { jobName, job } = await createJobManifest(body)

    // Return job manifest for CI/CD to apply
    return NextResponse.json({ 
      jobName, 
      manifest: job,
      message: 'Job manifest created - Kubernetes integration disabled'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export const runtime = 'nodejs'
