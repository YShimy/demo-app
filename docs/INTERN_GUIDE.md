# DevOps Internship — GitOps Track

Welcome. Over this internship you will build a complete GitOps delivery pipeline and, at the
end, **demo it live to the team**. The tools are the ones real teams use: **GitHub + GitHub
Actions**, **Harbor** (a private container registry), **minikube** (a local Kubernetes
cluster), and **ArgoCD** (GitOps continuous delivery).

You are given a small starter app — the `demo-app` shared repository. The app itself is
trivial on purpose: it just shows its own version in the browser. That is exactly what makes
it a good demo — when you deploy a new version, you can *see* the number change.

## The big picture — how it all fits together

```
   you push code to GitHub
            │
            ▼
   GitHub Actions  ──build & test──▶  Docker image
            │                              │
            │                         push │
            ▼                              ▼
   updates the k8s manifest        Harbor (private registry)
            │                              ▲
            │ commit                       │ pull (with credentials)
            ▼                              │
        ArgoCD  ──────watches the repo─────┤
            │                              │
            ▼                              │
        minikube  ◀────deploys the new image
```

The golden rule of GitOps: **Git is the single source of truth.** Nobody runs `kubectl apply`
by hand to deploy. You change Git; ArgoCD makes the cluster match Git.

---

## Ground rules

- Work on branches, never commit straight to `main`. Open a Pull Request for every change.
- One logical change per commit. Write commit messages that say **why**, not what.
- No passwords, tokens, or keys in any file — ever. They live in GitHub Secrets and Kubernetes Secrets.
- Stuck for 45 minutes? Come and ask, and bring what you already tried. Getting stuck is
  normal; staying stuck in silence is the only mistake.

---

# PROJECT 1 — Local platform: minikube + Harbor + ArgoCD
**Goal:** stand up the three pieces of infrastructure your app will live on.
**Time:** ~2 days.

### Steps
1. Install `minikube`, `kubectl`, and `helm`. Start a cluster:
   `minikube start --cpus 4 --memory 6144 --addons ingress`
2. Install **Harbor** into the cluster with Helm. Log in to its web UI and create a
   **private project** called `intern-demo`.
3. Create a Harbor **robot account** for that project (this is what the pipeline uses to push).
   Save its name and token — you'll put them in GitHub Secrets later.
4. Install **ArgoCD** into an `argocd` namespace. Reach its UI with
   `kubectl port-forward svc/argocd-server -n argocd 8080:443` and log in.

### Done when
- [ ] `kubectl get nodes` shows a Ready node.
- [ ] You can log in to the Harbor UI and see your private `intern-demo` project.
- [ ] You can log in to the ArgoCD UI.
- [ ] You can `docker login` to Harbor with the robot account from your terminal.

### Explain at review
- What is a private registry for, and why not just use Docker Hub?
- What does a Harbor *robot account* protect you from, versus using your own password?

---

# PROJECT 2 — The pipeline: GitHub Actions + branches + Harbor
**Goal:** every push builds, tests, and publishes an image to your private Harbor.
**Time:** ~2–3 days.

### Steps
1. Fork/clone the `demo-app` repo. Protect the `main` branch:
   *Settings → Branches → Add rule → require a pull request and a passing check before merge.*
2. Add these **repository secrets** (Settings → Secrets and variables → Actions):
   `HARBOR_REGISTRY`, `HARBOR_PROJECT`, `HARBOR_USERNAME`, `HARBOR_PASSWORD`.
3. The workflow is already in `.github/workflows/ci-cd.yml`. Read it line by line until you
   understand every step. Then make it pass.
4. Practise the branch flow:
   - create a branch `feature/change-color`
   - change the app's colour or version
   - open a Pull Request → watch the **test** job run
   - merge → watch the **build-and-push** job push an image to Harbor

### Done when
- [ ] A PR with a failing test **cannot** be merged (branch protection blocks it).
- [ ] Merging to `main` puts a new image in Harbor, tagged with the commit SHA.
- [ ] The build stage does **not** run on pull requests, only on pushes to `main`/`develop`.
- [ ] No secret appears in any file in the repo.

### Explain at review
- Why tag the image with the commit SHA instead of only `latest`?
- Why run tests on a PR but only push the image after merge?

---

# PROJECT 3 — GitOps delivery: ArgoCD + private repo → minikube
**Goal:** ArgoCD deploys your app automatically, straight from your private GitHub repo.
**Time:** ~3 days.

### Steps
1. In the `demo` namespace, create the **imagePullSecret** so Kubernetes can pull the private
   image from Harbor:
   ```
   kubectl create namespace demo
   kubectl create secret docker-registry harbor-creds \
     --docker-server=$HARBOR_REGISTRY \
     --docker-username=$HARBOR_USERNAME \
     --docker-password=$HARBOR_PASSWORD \
     -n demo
   ```
2. Because your GitHub repo is **private**, register its credentials with ArgoCD
   (ArgoCD UI → Settings → Repositories → Connect repo using HTTPS, with a GitHub
   personal access token). This is the step people most often miss.
3. Edit `argocd/application.yaml` — set `repoURL` to your repo. Apply it:
   `kubectl apply -f argocd/application.yaml`
4. Watch ArgoCD sync. Your app should appear in the `demo` namespace.
5. **The payoff:** change the version in the app, push through a PR, merge. The pipeline builds
   a new image, bumps the manifest, and ArgoCD deploys it — with no `kubectl` from you.
   Refresh the browser and watch the version number change.

### Done when
- [ ] ArgoCD shows the `demo-app` application as **Healthy** and **Synced**.
- [ ] The app is reachable in the browser and shows its version.
- [ ] A code change flows all the way to the cluster with **no manual kubectl**.
- [ ] `kubectl delete deployment demo-app -n demo` → ArgoCD **self-heals** it back. (Watch this happen — it's the best moment in the whole track.)
- [ ] The image was genuinely pulled from your private Harbor, not Docker Hub. Prove it.

### Explain at review
- What does "self-heal" mean, and why is it safer than deploying by hand?
- Your repo is private. What are the two *separate* places credentials were needed, and why?

---

# The final demo (after the internship)

You present for **20 minutes** to the team. Prepare a short script; rehearse it once.

**Your demo must show, live:**
1. A quick tour of the architecture — draw the diagram above from memory.
2. Open a Pull Request that changes the app's version. Show the pipeline running.
3. Merge it. Show the image landing in Harbor.
4. Switch to the ArgoCD UI. Show it detect the change and sync.
5. Refresh the browser. The new version is live. Say out loud what just happened end to end.
6. Then break it on purpose: `kubectl delete deployment demo-app -n demo`. Show ArgoCD
   healing it back.

**Be ready for these questions:**
- If someone changed the cluster by hand, what would ArgoCD do?
- Where exactly are secrets stored at each hop?
- What would you improve if you had another week?

A good demo is not "everything worked". A good demo is **you understanding and narrating
every hop** as it happens. If something breaks live, calmly debugging it in front of us is
worth more than a flawless run you can't explain.

---

## What we're assessing

| | What good looks like |
|---|---|
| **Understanding** | You can explain each hop, not just run the commands |
| **Git discipline** | Branches, PRs, clean history, meaningful messages |
| **Security instinct** | No secrets in code; you notice when something is exposed |
| **Debugging** | You read logs and errors before changing things at random |
| **Communication** | The demo is clear; you narrate what's happening and why |

The commands are the easy part and you can always look them up. Understanding the flow, and
being able to explain it calmly, is the part that makes you a DevOps engineer.

Good luck. Ask early, ask often.
