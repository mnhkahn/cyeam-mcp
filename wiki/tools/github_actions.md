---
title: GitHub Actions
type: tools
created: 2024-10-30
last_updated: 2024-10-30
related: ["[[Go Tooling]]", "[[Linux Shell Commands]]"]
sources: ["152135be9539"]
---

# GitHub Actions

In October 2024, the subject documented a continuous-deployment pipeline using GitHub Actions to deploy a Go application to Fly.io and send status notifications to enterprise messaging platforms.

## Fly.io Deployment

A workflow triggered on every push to the `master` branch checks out the repository, installs the Fly.io CLI, and runs a remote deployment:

```yaml
name: Fly Deploy
on:
  push:
    branches:
      - master
jobs:
  deploy:
    name: Deploy app
    runs-on: ubuntu-latest
    concurrency: deploy-group
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

The `FLY_API_TOKEN` secret is generated with `fly tokens create deploy -x 999999h` and stored in the repository's GitHub Secrets settings.

## Notification Workflows

A second workflow listens for the completion of the deployment workflow and posts the result to WeChat Work or Lark via webhook.

### WeChat Work

The workflow uses the `chf007/action-wechat-work` action to send a markdown message containing the repository name, commit author, branch mapping, conclusion emoji (sun or rain), and a link back to the repository.

### Lark

For Lark, the workflow constructs a JSON payload with `jq` and sends it via `curl` to the Lark bot webhook. The payload uses the `post` message type with a Chinese-language card that mirrors the WeChat Work content.
