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

## Experimental local bridge

To route the synthesis step through a local worker instead of the HF/Kimi flow:

```powershell
# terminal 1
$env:AEGIS_LLM_PROVIDER="local_bridge"
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# terminal 2
$env:AEGIS_LOCAL_WORKER_PROVIDER="codex"
python .\local_llm_worker.py
```

If the local Codex CLI cannot be launched from scripts on this machine, use
`AEGIS_LOCAL_WORKER_PROVIDER=openai` with `OPENAI_API_KEY`, or `echo` for a
queue smoke test.

## Notes

- The app labels the synthesis engine as `Opus 4.8` in the UI. The provider model can be overridden with `HF_MODEL_ID` when needed.
- Configure `HF_TOKENS` with one or more comma-, space-, or semicolon-separated provider tokens. `HF_TOKEN` still works as a single-token fallback.
- The analysis workflow is passive by default: DNS, HTTP headers, TLS certificate, page metadata, forms, cookies, visible stack hints, and structured synthesis.
- Private or localhost targets are blocked unless `AEGIS_ALLOW_PRIVATE_TARGETS=true` is set for an authorized lab environment.
