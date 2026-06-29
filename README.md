# Aegis Web Analyst

Premium FastAPI web app for an autonomous hosting and passive security-analysis research demo.

## Run

```powershell
python -m pip install -r requirements.txt
copy .env.example .env
# edit .env and set DATABASE_URL plus HF_TOKENS
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000.

## Database

Aegis requires PostgreSQL. There is no SQLite fallback.

On Railway:

1. Add a PostgreSQL database service to the project.
2. Open the Aegis web service variables.
3. Add `DATABASE_URL=${{Postgres.DATABASE_URL}}` as a reference variable from the PostgreSQL service.
4. Deploy the web service. On startup, `main.py` creates the required tables and indexes.

Stored data includes:

- `users`: local and Google accounts, plan, admin flag, waitlist state.
- `sessions`: login sessions and last-seen timestamps.
- `usage_counters`: quota counters.
- `analysis_runs`: scan history, summary metrics, errors, and full `report_json`.
- `visitor_events`: visits for pages/API routes with visitor cookie id, IP, user-agent, referrer, status, and linked user id when known.
- `activity_logs`: auth/account/analysis actions with redacted JSON metadata.

For local development, run PostgreSQL locally and set:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aegis
```

## Experimental local bridge

To route the synthesis step through a local worker instead of the hosted
sheepstealer flow:

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

- The hosted HF-backed engine is labeled `sheepstealer` in the UI. The provider model can be overridden with `HF_MODEL_ID` when needed.
- Configure `HF_TOKENS` with one or more comma-, space-, or semicolon-separated provider tokens. `HF_TOKEN` still works as a single-token fallback.
- The analysis workflow is passive by default: DNS, HTTP headers, TLS certificate, page metadata, forms, cookies, visible stack hints, and structured synthesis.
- Private or localhost targets are blocked unless `AEGIS_ALLOW_PRIVATE_TARGETS=true` is set for an authorized lab environment.
