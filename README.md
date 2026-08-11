# demo-app

A tiny app for the DevOps internship GitOps demo. It renders its own version in the browser,
so deployments are visible at a glance. Full exercise instructions are in
[`docs/INTERN_GUIDE.md`](docs/INTERN_GUIDE.md).

## Run it locally

```bash
npm install
npm start          # http://localhost:3000
npm test           # run the tests
```

Set `APP_VERSION` and `APP_COLOR` to change what it shows:

```bash
APP_VERSION=2.0.0 APP_COLOR="#16a34a" npm start
```

## Build the image

```bash
docker build -t demo-app:local .
docker run -p 3000:3000 -e APP_VERSION=local demo-app:local
```

## Endpoints

| Path | Purpose |
|------|---------|
| `/` | The page showing the version (and which pod served it) |
| `/healthz` | Liveness probe — is the process alive |
| `/readyz` | Readiness probe — is it ready for traffic |
| `/api/version` | JSON, used by the pipeline smoke test |

## Repo layout

```
app/                  the application + tests
Dockerfile            multi-stage, non-root, with a healthcheck
.github/workflows/    the GitHub Actions CI/CD pipeline
k8s/                  Kubernetes manifests (what ArgoCD deploys)
argocd/               the ArgoCD Application definition
docs/INTERN_GUIDE.md  the exercise, start here
```

## The flow in one sentence

Push to GitHub → Actions builds & tests → image pushed to **Harbor** → manifest bumped →
**ArgoCD** deploys it to **minikube**.




