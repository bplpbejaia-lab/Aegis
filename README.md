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

- The app uses the Hugging Face Router through the OpenAI client:
  `moonshotai/Kimi-K2-Instruct-0905:novita`.
- Configure `HF_TOKENS` with one or more comma-, space-, or semicolon-separated Hugging Face Router tokens. `HF_TOKEN` still works as a single-token fallback.
- The analysis workflow is passive by default: DNS, HTTP headers, TLS certificate, page metadata, forms, cookies, visible stack hints, and LLM synthesis.
- Private or localhost targets are blocked unless `AEGIS_ALLOW_PRIVATE_TARGETS=true` is set for an authorized lab environment.
