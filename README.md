# Aegis Web Analyst

Premium FastAPI web app for an autonomous hosting and passive security-analysis research demo.

## Run

```powershell
python -m pip install -r requirements.txt
copy .env.example .env
# edit .env and set HF_TOKENS
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000.

## Notes

- The app labels the synthesis engine as `Opus 4.8` in the UI. The provider model can be overridden with `HF_MODEL_ID` when needed.
- Configure `HF_TOKENS` with one or more comma-, space-, or semicolon-separated provider tokens. `HF_TOKEN` still works as a single-token fallback.
- The analysis workflow is passive by default: DNS, HTTP headers, TLS certificate, page metadata, forms, cookies, visible stack hints, and structured synthesis.
- Private or localhost targets are blocked unless `AEGIS_ALLOW_PRIVATE_TARGETS=true` is set for an authorized lab environment.
