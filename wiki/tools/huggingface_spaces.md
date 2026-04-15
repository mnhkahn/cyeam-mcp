---
title: Huggingface Spaces
type: tools
created: 2026-04-12
last_updated: 2026-04-12
related: ["[[Development Tools]]", "[[Docker]]"]
sources: ["3260a575444f"]
---

# Huggingface Spaces

Huggingface Spaces is a platform for hosting machine-learning demos and model services. In April 2026, the subject documented a complete Docker-based deployment workflow.

## Prerequisites

- A Huggingface account
- `git` and `git-lfs` installed
- Model files and application code ready

Install Git LFS for large model files:

```bash
# macOS
brew install git-lfs

# Ubuntu/Debian
sudo apt-get install git-lfs

git lfs install
```

## Creating a Space

1. Log in to Huggingface.
2. Click the user avatar → **New Space**.
3. Fill in the name, choose **Docker** as the SDK, select hardware (CPU Basic or GPU), and set visibility (Public or Private).
4. Clone the created repository locally:
   ```bash
   git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
   ```

## Required Files

| File | Purpose |
|---|---|
| `app.py` | FastAPI application entry point |
| `Dockerfile` | Docker build configuration |
| `requirements.txt` | Python dependencies |
| `README.md` | Space description with YAML frontmatter |
| Model files | `.pth`, `.bin`, `.ckpt`, etc. |

### Dockerfile Example

```dockerfile
FROM python:3.9

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app
COPY --chown=user ./requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt
COPY --chown=user . /app

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
```

Huggingface Spaces requires the service to listen on port **7860**.

### README.md Frontmatter

```yaml
---
title: Mo Ocr
emoji: ⚡
colorFrom: red
colorTo: pink
sdk: docker
pinned: false
license: apache-2.0
---
```

## Deployment

### Git Push (Recommended)

```bash
cd YOUR_SPACE_NAME
git lfs track "*.pth"
git lfs track "*.bin"
git lfs track "*.ckpt"
git add .
git add .gitattributes
git commit -m "Initial deployment"
git push
```

Huggingface automatically builds the Docker image and deploys the service.

### Huggingface CLI

```bash
pip install huggingface-hub
huggingface-cli login
huggingface-cli upload YOUR_USERNAME/YOUR_SPACE_NAME app.py app.py
```

## Environment Variables

Sensitive and non-sensitive variables are configured under Space Settings → Variables and Secrets:

| Type | Visibility | Use Case |
|---|---|---|
| Variable | Plain text | Non-sensitive config (e.g., `MODEL_NAME`) |
| Secret | Encrypted, hidden | API keys, tokens |

Read them in Python:

```python
import os
hf_token = os.getenv("HF_TOKEN")
port = os.getenv("PORT", "7860")
```

Huggingface also injects automatic variables such as `SPACE_ID` and `SPACE_REPO_NAME`.

## Common Issues

### Build or Startup Failure

- Verify Dockerfile syntax.
- Confirm the service listens on port 7860.
- Check Space → Files → Logs for build and runtime output.
- Test locally:
  ```bash
  docker build -t test-space .
  docker run -p 7860:7860 test-space
  ```

### Large Model File Push Failures

Ensure Git LFS is tracking the files:

```bash
git lfs track "*.pth"
git lfs ls-files
git lfs migrate import --include="*.pth"  # if already committed to Git
```

### Out of Memory or GPU Memory

- Use a smaller model or a quantized version.
- Implement lazy loading so the model is loaded on the first request rather than at startup:
  ```python
  model = None
  def get_model():
      global model
      if model is None:
          model = load_model()
      return model
  ```

## Free-Tier Limits

| Resource | Limit |
|---|---|
| CPU | 2 vCPU |
| Memory | 16 GB |
| Storage | 50 GB |
| Sleep | 48 hours of inactivity |
| GPU | Requires application or paid plan |
