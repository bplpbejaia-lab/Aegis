from __future__ import annotations

import json
import os
import shlex
import subprocess
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional convenience dependency
    load_dotenv = None


APP_DIR = Path(__file__).resolve().parent
if load_dotenv:
    load_dotenv(APP_DIR / ".env")

BRIDGE_DIR = Path(os.getenv("AEGIS_LOCAL_BRIDGE_DIR", APP_DIR / ".aegis-local-llm"))
PENDING_DIR = BRIDGE_DIR / "pending"
RUNNING_DIR = BRIDGE_DIR / "running"
DONE_DIR = BRIDGE_DIR / "done"
FAILED_DIR = BRIDGE_DIR / "failed"
WORKER_PROVIDER = os.getenv("AEGIS_LOCAL_WORKER_PROVIDER", "codex").strip().lower()
POLL_SECONDS = float(os.getenv("AEGIS_LOCAL_WORKER_POLL_SECONDS", "1"))


def main() -> None:
    for directory in (PENDING_DIR, RUNNING_DIR, DONE_DIR, FAILED_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    if "--once" in sys.argv:
        processed = process_next_job()
        print(f"[aegis-worker] once processed={processed}", flush=True)
        return

    print(
        f"[aegis-worker] watching {PENDING_DIR} with provider={WORKER_PROVIDER}",
        flush=True,
    )
    while True:
        processed = process_next_job()
        if not processed:
            time.sleep(POLL_SECONDS)


def process_next_job() -> bool:
    for pending_path in sorted(PENDING_DIR.glob("*.json")):
        running_path = RUNNING_DIR / pending_path.name
        try:
            pending_path.replace(running_path)
        except FileNotFoundError:
            continue
        except PermissionError:
            continue

        print(f"[aegis-worker] claimed {running_path.name}", flush=True)
        try:
            job = read_json(running_path)
            content, model = run_provider(job, running_path)
            write_result(
                DONE_DIR / running_path.name,
                {
                    "id": job["id"],
                    "provider": WORKER_PROVIDER,
                    "model": model,
                    "content": content,
                    "completed_at": now_iso(),
                    "attempts": 1,
                },
            )
            running_path.unlink(missing_ok=True)
            print(f"[aegis-worker] completed {running_path.name}", flush=True)
        except Exception as exc:
            error = f"{exc.__class__.__name__}: {exc}"
            write_result(
                FAILED_DIR / running_path.name,
                {
                    "provider": WORKER_PROVIDER,
                    "model": provider_model_label(),
                    "error": error,
                    "traceback": traceback.format_exc(),
                    "completed_at": now_iso(),
                    "attempts": 1,
                },
            )
            running_path.unlink(missing_ok=True)
            print(f"[aegis-worker] failed {running_path.name}: {error}", flush=True)
        return True
    return False


def run_provider(job: dict[str, Any], job_path: Path) -> tuple[str, str]:
    prompt = str(job.get("prompt") or "")
    if not prompt.strip():
        raise ValueError("Job does not contain a prompt.")

    if WORKER_PROVIDER == "codex":
        return run_codex(prompt, job_path), provider_model_label()
    if WORKER_PROVIDER == "openai":
        return run_openai(prompt), provider_model_label()
    if WORKER_PROVIDER == "echo":
        return (
            "Local bridge echo mode is running. Switch AEGIS_LOCAL_WORKER_PROVIDER "
            "to codex or openai for real synthesis.",
            "echo",
        )

    raise ValueError(
        "Unsupported AEGIS_LOCAL_WORKER_PROVIDER. Use codex, openai, or echo."
    )


def run_codex(prompt: str, job_path: Path) -> str:
    command = shlex.split(
        os.getenv("AEGIS_CODEX_COMMAND", "codex"),
        posix=os.name != "nt",
    )
    args = shlex.split(
        os.getenv("AEGIS_CODEX_ARGS", "exec"),
        posix=os.name != "nt",
    )
    timeout = float(os.getenv("AEGIS_CODEX_TIMEOUT_SECONDS", "900"))
    prompt_mode = os.getenv("AEGIS_CODEX_PROMPT_MODE", "stdin").strip().lower()
    prompt_path = job_path.with_suffix(".prompt.txt")

    if prompt_mode == "file":
        prompt_path.write_text(prompt, encoding="utf-8")

    replacements = {
        "{job_file}": str(job_path),
        "{prompt_file}": str(prompt_path),
        "{prompt}": prompt,
    }
    argv = [replace_tokens(part, replacements) for part in command + args]
    if prompt_mode == "arg" and "{prompt}" not in " ".join(command + args):
        argv.append(prompt)

    completed = subprocess.run(
        argv,
        input=prompt if prompt_mode == "stdin" else None,
        cwd=APP_DIR,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )
    stdout = completed.stdout.strip()
    stderr = completed.stderr.strip()
    if completed.returncode != 0:
        detail = stderr or stdout or f"exit code {completed.returncode}"
        raise RuntimeError(f"Codex command failed: {detail}")
    return stdout or stderr


def run_openai(prompt: str) -> str:
    from openai import OpenAI

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required for openai worker mode.")

    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    client = OpenAI(api_key=api_key, timeout=float(os.getenv("OPENAI_TIMEOUT_SECONDS", "120")))
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=int(os.getenv("OPENAI_MAX_TOKENS", "1200")),
        temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.2")),
    )
    message = response.choices[0].message
    return message.content or str(message)


def provider_model_label() -> str:
    if WORKER_PROVIDER == "codex":
        return os.getenv("AEGIS_CODEX_MODEL_LABEL", "Local Codex CLI")
    if WORKER_PROVIDER == "openai":
        return os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    return WORKER_PROVIDER


def replace_tokens(value: str, replacements: dict[str, str]) -> str:
    for token, replacement in replacements.items():
        value = value.replace(token, replacement)
    return value


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_result(path: Path, payload: dict[str, Any]) -> None:
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    temp_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temp_path.replace(path)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


if __name__ == "__main__":
    main()
