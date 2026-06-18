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
# one-time local Codex CLI install, avoids WindowsApps execution errors
D:\npm.cmd install --prefix .\.aegis-codex-cli --no-audit --fund=false @openai/codex@0.141.0

# terminal 1
$env:AEGIS_ANALYSIS_MODE="codex_direct"
$env:AEGIS_LLM_PROVIDER="local_bridge"
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# terminal 2
$env:AEGIS_LOCAL_WORKER_PROVIDER="codex"
python .\local_llm_worker.py
```

The worker prefers `.\.aegis-codex-cli\node_modules\.bin\codex.cmd` when it
exists. The default Codex worker keeps `model=gpt-5.5` and
`model_reasoning_effort=xhigh`; the prompt only constrains the final report to
be precise instead of verbose. If Codex cannot be launched from scripts on this
machine, use `AEGIS_LOCAL_WORKER_PROVIDER=openai` with `OPENAI_API_KEY`, or
`echo` for a queue smoke test.

With `AEGIS_ANALYSIS_MODE=codex_direct`, the backend bypasses the passive
collector and sends only the authorized target to Codex CLI. Codex performs the
end-to-end recon and writes the full report shown in the UI.

## Notes

- The app labels the synthesis engine as `Opus 4.8` in the UI. The provider model can be overridden with `HF_MODEL_ID` when needed.
- Configure `HF_TOKENS` with one or more comma-, space-, or semicolon-separated provider tokens. `HF_TOKEN` still works as a single-token fallback.
- The analysis workflow is passive by default: DNS, HTTP headers, TLS certificate, page metadata, forms, cookies, visible stack hints, and structured synthesis.
- Private or localhost targets are blocked unless `AEGIS_ALLOW_PRIVATE_TARGETS=true` is set for an authorized lab environment.
