from __future__ import annotations

import asyncio
import concurrent.futures
import ipaddress
import json
import os
import re
import socket
import ssl
import threading
import time
import uuid
from datetime import datetime, timezone
from html.parser import HTMLParser
from typing import Any
from urllib.parse import urljoin, urlparse, urlunparse

import httpx
from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional convenience dependency
    load_dotenv = None


APP_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(APP_DIR, "static")
if load_dotenv:
    load_dotenv(os.path.join(APP_DIR, ".env"))

MAX_BODY_BYTES = 1_200_000
PUBLIC_MODEL_LABEL = "Opus 4.8"
ANALYSIS_MODE = os.getenv("AEGIS_ANALYSIS_MODE", "passive").strip().lower()
HF_MODEL_ID = os.getenv("HF_MODEL_ID", "moonshotai/Kimi-K2-Instruct-0905:novita")
HF_BASE_URL = "https://router.huggingface.co/v1"
HF_ROUTER_HOST = "router.huggingface.co"
HF_MAX_ATTEMPTS = 3
HF_TOKEN_LOCK = threading.Lock()
HF_TOKEN_CURSOR = 0
LLM_PROVIDER = os.getenv("AEGIS_LLM_PROVIDER", "hf").strip().lower()
LOCAL_BRIDGE_DIR = os.getenv(
    "AEGIS_LOCAL_BRIDGE_DIR",
    os.path.join(APP_DIR, ".aegis-local-llm"),
)
LOCAL_BRIDGE_TIMEOUT_SECONDS = int(os.getenv("AEGIS_LOCAL_BRIDGE_TIMEOUT_SECONDS", "1800"))
DOH_ENDPOINTS = [
    ("https://8.8.8.8/resolve", {}),
    ("https://cloudflare-dns.com/dns-query", {"accept": "application/dns-json"}),
    ("https://1.1.1.1/dns-query", {"accept": "application/dns-json"}),
]
LLM_BASE_PROMPT = (
    ' analyze this overall "website given  by the user" and propose a better '
    "hosting solutions, and analyze it's full security layers and discover any "
    'vulnerability classifying it in critical/high/medium/low".'
)


class AnalysisRequest(BaseModel):
    target: str = Field(..., min_length=3, max_length=2048)
    authorized: bool = False


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title_parts: list[str] = []
        self.in_title = False
        self.description = ""
        self.generator = ""
        self.forms: list[dict[str, Any]] = []
        self.current_form: dict[str, Any] | None = None
        self.inputs: list[dict[str, str]] = []
        self.scripts: list[str] = []
        self.script_details: list[dict[str, str]] = []
        self.stylesheets: list[str] = []
        self.stylesheet_details: list[dict[str, str]] = []
        self.images: list[str] = []
        self.links: list[str] = []
        self.meta_refresh = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attr = {key.lower(): value or "" for key, value in attrs}

        if tag == "title":
            self.in_title = True
        elif tag == "meta":
            name = attr.get("name", "").lower()
            equiv = attr.get("http-equiv", "").lower()
            if name == "description":
                self.description = attr.get("content", "")
            if name == "generator":
                self.generator = attr.get("content", "")
            if equiv == "refresh":
                self.meta_refresh = True
        elif tag == "form":
            self.current_form = {
                "method": (attr.get("method") or "get").upper(),
                "action": attr.get("action", ""),
                "inputs": [],
            }
            self.forms.append(self.current_form)
        elif tag == "input":
            item = {
                "type": (attr.get("type") or "text").lower(),
                "name": attr.get("name", ""),
                "autocomplete": attr.get("autocomplete", ""),
            }
            self.inputs.append(item)
            if self.current_form is not None:
                self.current_form["inputs"].append(item)
        elif tag == "script" and attr.get("src"):
            self.scripts.append(attr["src"])
            self.script_details.append(
                {
                    "src": attr["src"],
                    "integrity": attr.get("integrity", ""),
                    "crossorigin": attr.get("crossorigin", ""),
                }
            )
        elif tag == "link":
            rel = attr.get("rel", "").lower()
            href = attr.get("href", "")
            if href:
                if "stylesheet" in rel:
                    self.stylesheets.append(href)
                    self.stylesheet_details.append(
                        {
                            "href": href,
                            "integrity": attr.get("integrity", ""),
                            "crossorigin": attr.get("crossorigin", ""),
                        }
                    )
                else:
                    self.links.append(href)
        elif tag == "img" and attr.get("src"):
            self.images.append(attr["src"])
        elif tag == "a" and attr.get("href"):
            self.links.append(attr["href"])

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False
        elif tag.lower() == "form":
            self.current_form = None

    def handle_data(self, data: str) -> None:
        if self.in_title and data.strip():
            self.title_parts.append(data.strip())

    @property
    def title(self) -> str:
        return " ".join(self.title_parts).strip()


app = FastAPI(title="Aegis Autonomous Hosting & Security Analyst")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(payload: AnalysisRequest) -> StreamingResponse:
    return StreamingResponse(
        run_analysis(payload),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache"},
    )


async def run_analysis(payload: AnalysisRequest):
    started_at = time.perf_counter()
    steps: list[dict[str, Any]] = []

    def record_step(
        step_id: str,
        title: str,
        tool: str,
        status: str,
        detail: str = "",
        result: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        step = {
            "id": step_id,
            "title": title,
            "tool": tool,
            "status": status,
            "detail": detail,
            "result": result or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        steps.append(step)
        return step

    try:
        if not payload.authorized:
            yield event(
                "error",
                {
                    "message": (
                        "Authorization confirmation is required before analyzing a target."
                    )
                },
            )
            return

        step = record_step(
            "scope",
            "Scope and authorization gate",
            "scope_guard",
            "running",
            "Normalizing the submitted target and enforcing HTTP/HTTPS scope.",
        )
        yield event("step", step)
        target_url = await asyncio.to_thread(normalize_target, payload.target)
        step.update(
            {
                "status": "complete",
                "detail": f"Target accepted as {target_url}.",
                "result": {"target_url": target_url},
            }
        )
        yield event("step", step)

        if ANALYSIS_MODE in {"codex_direct", "direct_codex", "direct"}:
            step = record_step(
                "codex_direct",
                "Codex direct pentest",
                "codex_cli",
                "running",
                "Passing the authorized target directly to local Codex for end-to-end analysis.",
            )
            yield event("step", step)
            llm_context = await asyncio.to_thread(call_codex_direct_pentest, target_url)
            step.update(
                {
                    "status": "complete",
                    "detail": build_llm_step_detail(llm_context),
                    "result": {
                        "model": llm_context.get("model", "Local Codex CLI"),
                        "skipped": llm_context.get("skipped", False),
                        "preview": llm_preview(llm_context.get("content", "")),
                    },
                }
            )
            yield event("step", step)

            elapsed_ms = int((time.perf_counter() - started_at) * 1000)
            direct_report = build_codex_direct_report(
                target_url,
                llm_context,
                steps,
                elapsed_ms,
            )
            yield event("metrics", direct_report["summary"])
            yield event("report", direct_report)
            yield event("done", {"duration_ms": elapsed_ms})
            return

        step = record_step(
            "dns",
            "DNS and network boundary check",
            "dns_resolver",
            "running",
            "Resolving the hostname and checking private-address policy.",
        )
        yield event("step", step)
        dns_context = await asyncio.to_thread(resolve_target, target_url)
        step.update(
            {
                "status": "complete",
                "detail": f"Resolved {dns_context['hostname']} to {len(dns_context['ips'])} address(es).",
                "result": dns_context,
            }
        )
        yield event("step", step)

        step = record_step(
            "http",
            "HTTP fingerprint",
            "httpx_fingerprint",
            "running",
            "Fetching headers and a bounded page sample without exploit payloads.",
        )
        yield event("step", step)
        http_context = await asyncio.to_thread(fetch_site, target_url, dns_context)
        step.update(
            {
                "status": "complete",
                "detail": (
                    f"Received HTTP {http_context['status_code']} from "
                    f"{http_context['final_url']}."
                ),
                "result": {
                    "status_code": http_context["status_code"],
                    "final_url": http_context["final_url"],
                    "elapsed_ms": http_context["elapsed_ms"],
                    "server": http_context["headers"].get("server", ""),
                },
            }
        )
        yield event("step", step)

        tls_context: dict[str, Any] = {"enabled": False, "skipped": True}
        parsed_final = urlparse(http_context["final_url"])
        if parsed_final.scheme == "https":
            step = record_step(
                "tls",
                "TLS certificate probe",
                "ssl_socket",
                "running",
                "Inspecting certificate validity and negotiated protocol.",
            )
            yield event("step", step)
            tls_hostname = parsed_final.hostname or dns_context["hostname"]
            tls_connect_host = (
                dns_context["ips"][0]
                if dns_context.get("resolver") != "system" and dns_context.get("ips")
                else None
            )
            tls_context = await asyncio.to_thread(
                probe_tls,
                tls_hostname,
                parsed_final.port or 443,
                tls_connect_host,
            )
            detail = tls_context.get("error") or (
                f"Negotiated {tls_context.get('version', 'unknown TLS version')}."
            )
            step.update({"status": "complete", "detail": detail, "result": tls_context})
            yield event("step", step)

        step = record_step(
            "surface",
            "WordPress and DNS surface probes",
            "passive_surface_mapper",
            "running",
            "Checking DNS records, robots.txt, WordPress endpoints, visible components, and client asset integrity.",
        )
        yield event("step", step)
        surface_context = await asyncio.to_thread(
            passive_surface_checks, target_url, dns_context, http_context
        )
        wordpress_context = surface_context.get("wordpress", {})
        step.update(
            {
                "status": "complete",
                "detail": (
                    "Surface probes complete: "
                    f"WordPress={'yes' if wordpress_context.get('detected') else 'no'}, "
                    f"{len(surface_context.get('external_assets_without_sri', []))} external asset(s) without SRI."
                ),
                "result": {
                    "wordpress": wordpress_context,
                    "dns_records": surface_context.get("dns_records", {}),
                },
            }
        )
        yield event("step", step)

        step = record_step(
            "headers",
            "Security layer audit",
            "header_and_html_analyzer",
            "running",
            "Checking headers, cookies, forms, client resources, and passive findings.",
        )
        yield event("step", step)
        local_report = await asyncio.to_thread(
            build_local_report,
            target_url,
            dns_context,
            http_context,
            tls_context,
            surface_context,
        )
        step.update(
            {
                "status": "complete",
                "detail": (
                    f"Classified {len(local_report['vulnerabilities'])} passive finding(s)."
                ),
                "result": {
                    "score": local_report["score"],
                    "severity_counts": local_report["severity_counts"],
                },
            }
        )
        yield event("step", step)
        yield event("metrics", local_report["summary"])

        step = record_step(
            "llm",
            "Opus synthesis",
            "reasoning_synthesizer",
            "running",
            "Building the evidence matrix, risk ranking, and remediation plan.",
        )
        yield event("step", step)
        llm_context = await asyncio.to_thread(call_llm, target_url, local_report)
        llm_detail = build_llm_step_detail(llm_context)
        llm_summary = llm_preview(llm_context.get("content", ""))
        step.update(
            {
                "status": "complete",
                "detail": llm_detail,
                "result": {
                    "model": PUBLIC_MODEL_LABEL,
                    "skipped": llm_context.get("skipped", False),
                    "credential_count": llm_context.get("credential_count", 0),
                    "preview": llm_summary,
                },
            }
        )
        yield event("step", step)

        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        local_report["llm"] = llm_context
        local_report["steps"] = steps
        local_report["duration_ms"] = elapsed_ms
        yield event("report", local_report)
        yield event("done", {"duration_ms": elapsed_ms})

    except Exception as exc:
        yield event("error", {"message": str(exc)})


def event(kind: str, data: dict[str, Any]) -> str:
    return json.dumps({"type": kind, "data": data}, default=str) + "\n"


def normalize_target(raw_target: str) -> str:
    target = raw_target.strip()
    target = re.sub(r"^(https?):/{3,}", r"\1://", target, flags=re.IGNORECASE)
    if not re.match(r"^https?://", target, re.IGNORECASE):
        target = target.lstrip("/")
        target = f"https://{target}"

    parsed = urlparse(target)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only http:// and https:// targets are supported.")
    if not parsed.hostname:
        raise ValueError("The target must include a valid hostname.")

    normalized = parsed._replace(fragment="")
    path = normalized.path or "/"
    return urlunparse(
        (
            normalized.scheme.lower(),
            normalized.netloc,
            path,
            normalized.params,
            normalized.query,
            "",
        )
    )


def resolve_target(target_url: str) -> dict[str, Any]:
    parsed = urlparse(target_url)
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Unable to resolve an empty hostname.")

    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    local_dns_error = ""
    try:
        ipaddress.ip_address(hostname)
        ips = [hostname]
        resolver = "literal"
    except ValueError:
        ips = []
        resolver = ""

    if not ips and hostname.lower() in {"localhost"}:
        try:
            infos = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
            ips = sorted({info[4][0] for info in infos})
            resolver = "system"
        except socket.gaierror as exc:
            local_dns_error = str(exc)

    if not ips:
        ips = resolve_with_cloudflare_doh(hostname)
        resolver = "cloudflare_doh"
        if not ips:
            raise ValueError(
                f"DNS lookup failed for {hostname}. Check the domain name or public DNS records."
            )
    private_ips = [ip for ip in ips if is_private_ip(ip)]
    allow_private = os.getenv("AEGIS_ALLOW_PRIVATE_TARGETS", "").lower() in {
        "1",
        "true",
        "yes",
    }
    if private_ips and not allow_private:
        raise ValueError(
            "The hostname resolves to private or local network addresses. "
            "Set AEGIS_ALLOW_PRIVATE_TARGETS=true only for an authorized local lab."
        )

    return {
        "hostname": hostname,
        "port": port,
        "ips": ips,
        "private_ips": private_ips,
        "private_targets_allowed": allow_private,
        "resolver": resolver,
        "local_dns_error": local_dns_error,
    }


def getaddrinfo_with_timeout(
    hostname: str, port: int
) -> list[tuple[Any, ...]]:
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    try:
        future = executor.submit(
            socket.getaddrinfo, hostname, port, 0, socket.SOCK_STREAM
        )
        return future.result(timeout=4.0)
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def resolve_with_cloudflare_doh(hostname: str) -> list[str]:
    answers: list[str] = []
    for record_type in ("A", "AAAA"):
        for value in resolve_dns_records(hostname, record_type):
            try:
                ipaddress.ip_address(value)
            except ValueError:
                continue
            answers.append(value)
        if answers:
            return sorted(set(answers))

    return sorted(set(answers))


def resolve_dns_records(hostname: str, record_type: str) -> list[str]:
    records: list[str] = []
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=len(DOH_ENDPOINTS))
    futures = [
        executor.submit(query_doh_endpoint, endpoint, headers, hostname, record_type)
        for endpoint, headers in DOH_ENDPOINTS
    ]
    try:
        for future in concurrent.futures.as_completed(futures, timeout=5.5):
            payload = future.result()
            if not payload or payload.get("Status") != 0:
                continue
            for item in payload.get("Answer", []):
                value = str(item.get("data", "")).strip()
                if value:
                    records.append(value)
            if records or record_type.upper() not in {"A", "AAAA"}:
                return sorted(set(records))
    except concurrent.futures.TimeoutError:
        return sorted(set(records))
    finally:
        executor.shutdown(wait=False, cancel_futures=True)
    return sorted(set(records))


def query_doh_endpoint(
    endpoint: str,
    headers: dict[str, str],
    hostname: str,
    record_type: str,
) -> dict[str, Any]:
    try:
        response = httpx.get(
            endpoint,
            params={"name": hostname, "type": record_type},
            headers=headers,
            timeout=httpx.Timeout(4.0, connect=2.0),
        )
        response.raise_for_status()
        return response.json()
    except Exception:
        return {}


def is_private_ip(value: str) -> bool:
    ip = ipaddress.ip_address(value)
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def fetch_site(target_url: str, dns_context: dict[str, Any] | None = None) -> dict[str, Any]:
    started_at = time.perf_counter()
    if (
        dns_context
        and dns_context.get("ips")
        and dns_context.get("resolver") not in {"system", "literal"}
    ):
        return fetch_site_via_resolved_ip(target_url, dns_context, started_at)

    headers = {
        "User-Agent": "AegisResearchAudit/1.0 (+passive-security-analysis)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    try:
        with httpx.Client(
            headers=headers,
            follow_redirects=True,
            timeout=httpx.Timeout(12.0, connect=6.0),
            verify=True,
        ) as client:
            with client.stream("GET", target_url) as response:
                body = bytearray()
                for chunk in response.iter_bytes():
                    if not chunk:
                        continue
                    remaining = MAX_BODY_BYTES - len(body)
                    if remaining <= 0:
                        break
                    body.extend(chunk[:remaining])

                encoding = response.encoding or "utf-8"
                text = bytes(body).decode(encoding, errors="replace")
                header_dict = {
                    key.lower(): value for key, value in response.headers.multi_items()
                }
                set_cookies = response.headers.get_list("set-cookie")

                return {
                    "status_code": response.status_code,
                    "reason_phrase": response.reason_phrase,
                    "final_url": str(response.url),
                    "history": [str(item.url) for item in response.history],
                    "headers": header_dict,
                    "set_cookies": set_cookies,
                    "body_sample": text,
                    "body_bytes_read": len(body),
                    "elapsed_ms": int((time.perf_counter() - started_at) * 1000),
                    "transport": "httpx",
                }
    except httpx.RequestError:
        if not dns_context or not dns_context.get("ips"):
            raise
        return fetch_site_via_resolved_ip(target_url, dns_context, started_at)


def fetch_site_via_resolved_ip(
    target_url: str,
    dns_context: dict[str, Any],
    started_at: float,
    connect_timeout: float = 8.0,
    read_timeout: float = 8.0,
    max_body_bytes: int = MAX_BODY_BYTES,
) -> dict[str, Any]:
    parsed = urlparse(target_url)
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Unable to fetch a target without a hostname.")

    scheme = parsed.scheme.lower()
    port = parsed.port or (443 if scheme == "https" else 80)
    path = urlunparse(("", "", parsed.path or "/", parsed.params, parsed.query, ""))
    host_header = hostname
    if parsed.port and parsed.port not in {80, 443}:
        host_header = f"{hostname}:{parsed.port}"

    raw = b""
    last_error: Exception | None = None
    for ip in dns_context.get("ips", []):
        try:
            with socket.create_connection((ip, port), timeout=connect_timeout) as sock:
                if scheme == "https":
                    context = ssl.create_default_context()
                    conn: socket.socket | ssl.SSLSocket = context.wrap_socket(
                        sock, server_hostname=hostname
                    )
                else:
                    conn = sock
                with conn:
                    conn.settimeout(read_timeout)
                    request = (
                        f"GET {path} HTTP/1.1\r\n"
                        f"Host: {host_header}\r\n"
                        "User-Agent: AegisResearchAudit/1.0 (+passive-security-analysis)\r\n"
                        "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n"
                        "Accept-Encoding: identity\r\n"
                        "Connection: close\r\n\r\n"
                    )
                    conn.sendall(request.encode("ascii"))
                    while len(raw) < max_body_bytes + 80_000:
                        try:
                            chunk = conn.recv(16384)
                        except socket.timeout:
                            if raw:
                                break
                            raise
                        if not chunk:
                            break
                        raw += chunk
                break
        except Exception as exc:
            last_error = exc
            raw = b""
            continue

    if not raw:
        raise ValueError(
            f"Unable to fetch {hostname} through DNS fallback: {last_error}"
        )

    header_bytes, _, body = raw.partition(b"\r\n\r\n")
    header_text = header_bytes.decode("iso-8859-1", errors="replace")
    lines = header_text.split("\r\n")
    status_line = lines[0] if lines else "HTTP/1.1 0 Unknown"
    parts = status_line.split(" ", 2)
    status_code = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    reason_phrase = parts[2] if len(parts) > 2 else ""

    headers: dict[str, str] = {}
    set_cookies: list[str] = []
    for line in lines[1:]:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        lowered = key.strip().lower()
        clean_value = value.strip()
        headers[lowered] = clean_value
        if lowered == "set-cookie":
            set_cookies.append(clean_value)

    if headers.get("transfer-encoding", "").lower() == "chunked":
        body = decode_chunked_body(body)
    body = body[:max_body_bytes]
    text = body.decode(encoding_from_content_type(headers.get("content-type", "")), errors="replace")

    return {
        "status_code": status_code,
        "reason_phrase": reason_phrase,
        "final_url": target_url,
        "history": [],
        "headers": headers,
        "set_cookies": set_cookies,
        "body_sample": text,
        "body_bytes_read": len(body),
        "elapsed_ms": int((time.perf_counter() - started_at) * 1000),
        "transport": "resolved_ip_sni",
    }


def decode_chunked_body(body: bytes) -> bytes:
    decoded = bytearray()
    position = 0
    while position < len(body):
        line_end = body.find(b"\r\n", position)
        if line_end == -1:
            break
        size_text = body[position:line_end].split(b";", 1)[0]
        try:
            size = int(size_text.strip(), 16)
        except ValueError:
            break
        position = line_end + 2
        if size == 0:
            break
        decoded.extend(body[position : position + size])
        position += size + 2
    return bytes(decoded)


def encoding_from_content_type(content_type: str) -> str:
    match = re.search(r"charset=([^;\s]+)", content_type, re.I)
    return match.group(1).strip("\"'") if match else "utf-8"


def probe_tls(hostname: str, port: int, connect_host: str | None = None) -> dict[str, Any]:
    context = ssl.create_default_context()
    try:
        with socket.create_connection((connect_host or hostname, port), timeout=6.0) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as tls_sock:
                cert = tls_sock.getpeercert()
                not_after = cert.get("notAfter")
                expires_at = parse_cert_time(not_after) if not_after else None
                days_remaining = None
                if expires_at:
                    days_remaining = (expires_at - datetime.now(timezone.utc)).days
                issuer = flatten_cert_name(cert.get("issuer", ()))
                subject = flatten_cert_name(cert.get("subject", ()))
                return {
                    "enabled": True,
                    "hostname": hostname,
                    "version": tls_sock.version(),
                    "cipher": tls_sock.cipher()[0] if tls_sock.cipher() else "",
                    "issuer": issuer,
                    "subject": subject,
                    "not_after": not_after,
                    "days_remaining": days_remaining,
                    "error": "",
                }
    except Exception as exc:
        return {"enabled": False, "hostname": hostname, "error": str(exc)}


def parse_cert_time(value: str) -> datetime:
    parsed = datetime.strptime(value, "%b %d %H:%M:%S %Y %Z")
    return parsed.replace(tzinfo=timezone.utc)


def flatten_cert_name(parts: tuple[Any, ...]) -> dict[str, str]:
    flattened: dict[str, str] = {}
    for group in parts:
        for key, value in group:
            flattened[key] = value
    return flattened


def build_local_report(
    target_url: str,
    dns_context: dict[str, Any],
    http_context: dict[str, Any],
    tls_context: dict[str, Any],
    surface_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    parser = PageParser()
    parser.feed(http_context["body_sample"])

    final_url = http_context["final_url"]
    parsed_final = urlparse(final_url)
    headers = http_context["headers"]
    surface_context = surface_context or {}
    resources = collect_resources(final_url, parser)
    vulnerabilities = classify_findings(
        headers,
        parser,
        resources,
        parsed_final,
        tls_context,
        surface_context,
        http_context.get("set_cookies", []),
    )
    severity_counts = count_severities(vulnerabilities)
    score = calculate_score(vulnerabilities)
    technologies = infer_technologies(headers, parser, surface_context)
    recommendations = hosting_recommendations(
        parsed_final, headers, parser, vulnerabilities, technologies, surface_context
    )

    return {
        "target": target_url,
        "final_url": final_url,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "score": score,
        "posture": posture_label(score),
        "severity_counts": severity_counts,
        "summary": {
            "score": score,
            "posture": posture_label(score),
            "critical": severity_counts["critical"],
            "high": severity_counts["high"],
            "medium": severity_counts["medium"],
            "low": severity_counts["low"],
            "light": severity_counts["low"],
            "final_url": final_url,
            "status_code": http_context["status_code"],
        },
        "network": dns_context,
        "http": {
            "status_code": http_context["status_code"],
            "reason_phrase": http_context["reason_phrase"],
            "final_url": final_url,
            "redirect_chain": http_context["history"],
            "elapsed_ms": http_context["elapsed_ms"],
            "body_bytes_read": http_context["body_bytes_read"],
            "transport": http_context.get("transport", ""),
            "headers": public_header_subset(headers),
        },
        "tls": tls_context,
        "surface": surface_context,
        "dns_records": surface_context.get("dns_records", {}),
        "wordpress": surface_context.get("wordpress", {}),
        "page": {
            "title": parser.title,
            "description": parser.description,
            "generator": parser.generator,
            "forms_count": len(parser.forms),
            "password_inputs": sum(1 for item in parser.inputs if item["type"] == "password"),
            "scripts_count": len(parser.scripts),
            "stylesheets_count": len(parser.stylesheets),
            "images_count": len(parser.images),
            "external_hosts": sorted(resources["external_hosts"])[:20],
            "mixed_content": resources["mixed_content"][:20],
        },
        "technologies": technologies,
        "vulnerabilities": vulnerabilities,
        "hosting_recommendations": recommendations,
    }


def collect_resources(final_url: str, parser: PageParser) -> dict[str, Any]:
    base_host = urlparse(final_url).hostname or ""
    resource_values = parser.scripts + parser.stylesheets + parser.images
    external_hosts: set[str] = set()
    mixed_content: list[str] = []
    for value in resource_values:
        absolute = urljoin(final_url, value)
        parsed = urlparse(absolute)
        if parsed.hostname and parsed.hostname != base_host:
            external_hosts.add(parsed.hostname)
        if urlparse(final_url).scheme == "https" and parsed.scheme == "http":
            mixed_content.append(absolute)
    return {"external_hosts": external_hosts, "mixed_content": mixed_content}


def passive_surface_checks(
    target_url: str,
    dns_context: dict[str, Any],
    http_context: dict[str, Any],
) -> dict[str, Any]:
    parser = PageParser()
    parser.feed(http_context.get("body_sample", ""))

    base_url = http_context.get("final_url") or target_url
    parsed_base = urlparse(base_url)
    hostname = parsed_base.hostname or dns_context.get("hostname", "")
    probe_dns_context = dns_context
    if hostname and hostname != dns_context.get("hostname"):
        try:
            probe_dns_context = resolve_target(base_url)
        except Exception:
            probe_dns_context = dns_context

    dns_records = {
        "caa": resolve_dns_records(hostname, "CAA")[:10] if hostname else [],
        "ds": resolve_dns_records(hostname, "DS")[:10] if hostname else [],
        "ns": resolve_dns_records(hostname, "NS")[:10] if hostname else [],
        "mx": resolve_dns_records(hostname, "MX")[:10] if hostname else [],
    }

    probe_specs = [
        ("robots_txt", "/robots.txt"),
        ("wp_json", "/wp-json/"),
        ("wp_users", "/wp-json/wp/v2/users?per_page=5"),
        ("xmlrpc", "/xmlrpc.php"),
        ("wp_login", "/wp-login.php"),
        ("author_1", "/?author=1"),
        ("debug_log", "/wp-content/debug.log"),
        ("uploads_root", "/wp-content/uploads/"),
    ]
    for index, path in enumerate(upload_probe_paths(base_url, parser)[:2], start=1):
        probe_specs.append((f"uploads_sample_{index}", path))

    probes = {
        name: fetch_passive_probe(base_url, probe_dns_context, path)
        for name, path in probe_specs
    }
    visible_components = detect_visible_wp_components(base_url, parser)
    wordpress = summarize_wordpress_surface(
        base_url,
        parser,
        probes,
        visible_components,
        http_context.get("body_sample", ""),
    )

    return {
        "hostname": hostname,
        "dns_records": dns_records,
        "probes": probes,
        "wordpress": wordpress,
        "external_assets_without_sri": external_assets_without_sri(base_url, parser)[:25],
    }


def fetch_passive_probe(
    base_url: str,
    dns_context: dict[str, Any],
    path_with_query: str,
) -> dict[str, Any]:
    probe_url = build_probe_url(base_url, path_with_query)
    try:
        if (
            dns_context
            and dns_context.get("ips")
            and dns_context.get("resolver") not in {"system", "literal"}
        ):
            context = fetch_site_via_resolved_ip(
                probe_url,
                dns_context,
                time.perf_counter(),
                connect_timeout=3.0,
                read_timeout=4.0,
                max_body_bytes=160_000,
            )
        else:
            context = fetch_site(probe_url, dns_context)
    except Exception as exc:
        return {
            "url": probe_url,
            "path": path_with_query,
            "ok": False,
            "error": str(exc)[:240],
        }

    body = context.get("body_sample", "")
    headers = context.get("headers", {})
    return {
        "url": probe_url,
        "path": path_with_query,
        "ok": True,
        "status_code": context.get("status_code", 0),
        "reason_phrase": context.get("reason_phrase", ""),
        "final_url": context.get("final_url", probe_url),
        "location": headers.get("location", ""),
        "content_type": headers.get("content-type", ""),
        "server": headers.get("server", ""),
        "body_excerpt": compact_text(body, 900),
        "body_bytes_read": context.get("body_bytes_read", 0),
        "elapsed_ms": context.get("elapsed_ms", 0),
        "transport": context.get("transport", ""),
    }


def build_probe_url(base_url: str, path_with_query: str) -> str:
    parsed = urlparse(base_url)
    path, _, query = path_with_query.partition("?")
    return urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            path or "/",
            "",
            query,
            "",
        )
    )


def compact_text(value: str, limit: int) -> str:
    compacted = re.sub(r"\s+", " ", value).strip()
    if len(compacted) > limit:
        return f"{compacted[:limit]}..."
    return compacted


def upload_probe_paths(final_url: str, parser: PageParser) -> list[str]:
    paths: set[str] = set()
    for value in parser.scripts + parser.stylesheets + parser.images + parser.links:
        absolute = urljoin(final_url, value)
        parsed = urlparse(absolute)
        match = re.search(r"/wp-content/uploads/(\d{4}/\d{2})/", parsed.path, re.I)
        if match:
            paths.add(f"/wp-content/uploads/{match.group(1)}/")
    return sorted(paths)


def detect_visible_wp_components(final_url: str, parser: PageParser) -> dict[str, Any]:
    plugins: set[str] = set()
    themes: set[str] = set()
    version_hints: set[str] = set()
    resource_values = parser.scripts + parser.stylesheets + parser.images + parser.links

    for value in resource_values:
        absolute = urljoin(final_url, value)
        parsed = urlparse(absolute)
        plugin_match = re.search(r"/wp-content/plugins/([^/]+)/", parsed.path, re.I)
        theme_match = re.search(r"/wp-content/themes/([^/]+)/", parsed.path, re.I)
        if plugin_match:
            plugins.add(plugin_match.group(1))
        if theme_match:
            themes.add(theme_match.group(1))
        for version in re.findall(r"(?:^|[?&])ver=([0-9][0-9A-Za-z._-]{1,24})", parsed.query):
            version_hints.add(version)

    core_version = ""
    generator_match = re.search(r"WordPress\s+([0-9][0-9.]+)", parser.generator, re.I)
    if generator_match:
        core_version = generator_match.group(1)

    return {
        "plugins": sorted(plugins)[:25],
        "themes": sorted(themes)[:10],
        "core_version": core_version,
        "version_hints": sorted(version_hints)[:25],
    }


def summarize_wordpress_surface(
    final_url: str,
    parser: PageParser,
    probes: dict[str, dict[str, Any]],
    visible_components: dict[str, Any],
    homepage_body: str,
) -> dict[str, Any]:
    homepage_text = homepage_body.lower()
    resources_text = " ".join(
        parser.scripts + parser.stylesheets + parser.images + parser.links
    ).lower()
    signals = []
    if "wp-content" in homepage_text or "wp-content" in resources_text:
        signals.append("wp-content resource paths")
    if "wp-includes" in homepage_text or "wp-includes" in resources_text:
        signals.append("wp-includes resource paths")
    if parser.generator and "wordpress" in parser.generator.lower():
        signals.append(f"generator meta: {parser.generator}")
    if probe_status(probes.get("wp_login")) in range(200, 500):
        signals.append("wp-login.php reachable")
    if probe_status(probes.get("wp_json")) == 200:
        signals.append("wp-json reachable")

    robots_excerpt = probes.get("robots_txt", {}).get("body_excerpt", "")
    robots_wp_lines = [
        line.strip()
        for line in robots_excerpt.split(" ")
        if "wp-" in line.lower()
    ][:10]

    return {
        "detected": bool(signals or visible_components["plugins"] or visible_components["themes"]),
        "signals": signals[:10],
        "components": visible_components,
        "rest_api_public": probe_status(probes.get("wp_json")) == 200,
        "users_endpoint_public": wordpress_users_endpoint_public(probes.get("wp_users")),
        "xmlrpc_reachable": wordpress_xmlrpc_reachable(probes.get("xmlrpc")),
        "login_reachable": wordpress_login_reachable(probes.get("wp_login")),
        "author_enumeration_signal": wordpress_author_signal(probes.get("author_1")),
        "debug_log_public": wordpress_debug_log_public(probes.get("debug_log")),
        "uploads_listing_signal": wordpress_upload_listing_signal(probes),
        "robots_wp_lines": robots_wp_lines,
        "base_url": final_url,
    }


def external_assets_without_sri(final_url: str, parser: PageParser) -> list[dict[str, str]]:
    base_host = urlparse(final_url).hostname or ""
    assets: list[dict[str, str]] = []
    for item in parser.script_details:
        absolute = urljoin(final_url, item["src"])
        parsed = urlparse(absolute)
        if parsed.hostname and parsed.hostname != base_host and not item.get("integrity"):
            assets.append({"type": "script", "host": parsed.hostname, "url": absolute})
    for item in parser.stylesheet_details:
        absolute = urljoin(final_url, item["href"])
        parsed = urlparse(absolute)
        if parsed.hostname and parsed.hostname != base_host and not item.get("integrity"):
            assets.append({"type": "stylesheet", "host": parsed.hostname, "url": absolute})
    return assets


def probe_status(probe: dict[str, Any] | None) -> int:
    if not probe or not probe.get("ok"):
        return 0
    return int(probe.get("status_code") or 0)


def wordpress_users_endpoint_public(probe: dict[str, Any] | None) -> bool:
    if probe_status(probe) != 200:
        return False
    body = probe.get("body_excerpt", "").lower()
    return '"slug"' in body or '"name"' in body or "/wp/v2/users/" in body


def wordpress_xmlrpc_reachable(probe: dict[str, Any] | None) -> bool:
    status = probe_status(probe)
    if status not in {200, 405}:
        return False
    body = probe.get("body_excerpt", "").lower()
    return "xml-rpc" in body or "xmlrpc" in body or "post requests only" in body


def wordpress_login_reachable(probe: dict[str, Any] | None) -> bool:
    status = probe_status(probe)
    if status not in range(200, 500):
        return False
    body = probe.get("body_excerpt", "").lower()
    return "wp-login" in body or "wp-submit" in body or "wordpress" in body


def wordpress_author_signal(probe: dict[str, Any] | None) -> bool:
    if not probe or not probe.get("ok"):
        return False
    location = probe.get("location", "").lower()
    final_url = probe.get("final_url", "").lower()
    body = probe.get("body_excerpt", "").lower()
    return "/author/" in location or "/author/" in final_url or "/author/" in body


def wordpress_debug_log_public(probe: dict[str, Any] | None) -> bool:
    if probe_status(probe) != 200:
        return False
    body = probe.get("body_excerpt", "").lower()
    return any(marker in body for marker in ["php warning", "php fatal", "wordpress", "stack trace"])


def wordpress_upload_listing_signal(probes: dict[str, dict[str, Any]]) -> bool:
    for name, probe in probes.items():
        if not name.startswith("uploads") or probe_status(probe) != 200:
            continue
        body = probe.get("body_excerpt", "").lower()
        if "index of" in body or "parent directory" in body:
            return True
    return False


def classify_findings(
    headers: dict[str, str],
    parser: PageParser,
    resources: dict[str, Any],
    final_url: Any,
    tls_context: dict[str, Any],
    surface_context: dict[str, Any],
    set_cookies: list[str],
) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    probes = surface_context.get("probes", {})
    wordpress = surface_context.get("wordpress", {})
    dns_records = surface_context.get("dns_records", {})

    def add(
        severity: str,
        title: str,
        evidence: str,
        recommendation: str,
        category: str,
    ) -> None:
        findings.append(
            {
                "severity": severity,
                "title": title,
                "category": category,
                "evidence": evidence,
                "recommendation": recommendation,
            }
        )

    def probe_evidence(name: str, max_excerpt: int = 180) -> str:
        probe = probes.get(name, {})
        if not probe:
            return f"{name} was not probed."
        if not probe.get("ok"):
            return f"{probe.get('path', name)} probe failed: {probe.get('error', 'unknown error')}"
        status = probe.get("status_code", 0)
        location = probe.get("location", "")
        excerpt = probe.get("body_excerpt", "")
        detail = f"{probe.get('path', name)} returned HTTP {status}"
        if location:
            detail += f" with Location: {location}"
        if excerpt:
            detail += f". Excerpt: {compact_text(excerpt, max_excerpt)}"
        return detail

    def sample(values: list[Any], limit: int = 5) -> str:
        cleaned = [str(value) for value in values if str(value)]
        if not cleaned:
            return "none"
        suffix = "" if len(cleaned) <= limit else f", +{len(cleaned) - limit} more"
        return ", ".join(cleaned[:limit]) + suffix

    is_https = final_url.scheme == "https"
    has_password = any(item["type"] == "password" for item in parser.inputs)

    if not is_https:
        add(
            "critical" if has_password else "high",
            "Plain HTTP transport",
            "The final URL is not served over HTTPS.",
            "Serve the application only over HTTPS and redirect HTTP to HTTPS at the edge.",
            "Transport security",
        )

    if is_https and not headers.get("strict-transport-security"):
        add(
            "medium",
            "Missing HSTS",
            "Strict-Transport-Security is absent on an HTTPS response.",
            "Set an HSTS policy after confirming all subdomains support HTTPS.",
            "Transport security",
        )

    csp = headers.get("content-security-policy", "")
    if not csp:
        add(
            "medium",
            "Missing Content Security Policy",
            "Content-Security-Policy is absent.",
            "Deploy a CSP that restricts scripts, styles, frames, images, and connect destinations.",
            "Browser hardening",
        )

    if not headers.get("x-frame-options") and "frame-ancestors" not in csp.lower():
        add(
            "medium",
            "Clickjacking controls not visible",
            "No X-Frame-Options header or CSP frame-ancestors directive was observed.",
            "Add CSP frame-ancestors or X-Frame-Options to prevent unwanted framing.",
            "Browser hardening",
        )

    if not headers.get("x-content-type-options"):
        add(
            "low",
            "Missing MIME sniffing protection",
            "X-Content-Type-Options is absent.",
            "Set X-Content-Type-Options: nosniff.",
            "Browser hardening",
        )

    if not headers.get("referrer-policy"):
        add(
            "low",
            "Missing Referrer Policy",
            "Referrer-Policy is absent.",
            "Set a restrictive Referrer-Policy such as strict-origin-when-cross-origin.",
            "Privacy",
        )

    if not headers.get("permissions-policy"):
        add(
            "low",
            "Missing Permissions Policy",
            "Permissions-Policy is absent.",
            "Disable unused browser features with a Permissions-Policy header.",
            "Browser hardening",
        )

    server = headers.get("server", "")
    if server and re.search(r"\d+(?:\.\d+)+", server):
        add(
            "low",
            "Verbose server banner",
            f"Server header discloses: {server}",
            "Minimize version disclosure in server and upstream proxy headers.",
            "Information exposure",
        )

    if parser.generator:
        add(
            "low",
            "Generator metadata exposed",
            f"Generator meta tag discloses: {parser.generator}",
            "Remove framework or CMS generator metadata in production.",
            "Information exposure",
        )

    if parser.meta_refresh:
        add(
            "low",
            "Meta refresh detected",
            "The page includes an HTML meta refresh directive.",
            "Prefer explicit HTTP redirects or application routing over meta refresh.",
            "Application behavior",
        )

    if resources["mixed_content"]:
        add(
            "medium",
            "Mixed content resources",
            f"{len(resources['mixed_content'])} HTTP resource(s) were referenced from HTTPS.",
            "Load all scripts, styles, images, and API calls over HTTPS.",
            "Transport security",
        )

    csrf_like_inputs = [
        item
        for item in parser.inputs
        if re.search(r"csrf|token|nonce|authenticity", item.get("name", ""), re.I)
    ]
    post_forms = [form for form in parser.forms if form.get("method") == "POST"]
    if post_forms and not csrf_like_inputs:
        add(
            "medium",
            "POST forms without visible anti-CSRF token",
            "No token-like input name was observed in fetched POST forms.",
            "Confirm server-side CSRF defenses and include per-request tokens on state-changing forms.",
            "Application security",
        )

    for cookie_finding in cookie_findings(headers, set_cookies, is_https):
        findings.append(cookie_finding)

    jquery_versions = detect_jquery_versions(parser.scripts)
    for version, source in jquery_versions:
        if version_tuple(version) < (3, 5, 0):
            add(
                "medium",
                "Potentially outdated jQuery",
                f"Detected jQuery {version} in {source}.",
                "Upgrade jQuery and review plugins for known client-side vulnerabilities.",
                "Dependency hygiene",
            )

    if tls_context.get("enabled"):
        days = tls_context.get("days_remaining")
        if isinstance(days, int) and days < 0:
            add(
                "critical",
                "Expired TLS certificate",
                f"The certificate expired {-days} day(s) ago.",
                "Renew and automate certificate rotation.",
                "Transport security",
            )
        elif isinstance(days, int) and days < 14:
            add(
                "medium",
                "TLS certificate close to expiry",
                f"The certificate expires in {days} day(s).",
                "Renew the certificate or verify automated renewal.",
                "Transport security",
            )
    elif is_https:
        add(
            "medium",
            "TLS probe failed",
            tls_context.get("error", "The TLS certificate probe did not complete."),
            "Verify certificate chain, hostname coverage, and TLS termination configuration.",
            "Transport security",
        )

    if "Index of /" in parser.title:
        add(
            "medium",
            "Directory listing likely enabled",
            "The page title resembles a web server directory index.",
            "Disable auto-indexing and serve explicit index pages.",
            "Server configuration",
        )

    if is_https and not dns_records.get("caa"):
        add(
            "medium",
            "CAA records not observed",
            "No CAA records were returned by public DoH resolvers for the audited hostname.",
            "Publish CAA records that authorize only the certificate authorities you use.",
            "DNS hardening",
        )

    if is_https and not dns_records.get("ds"):
        add(
            "low",
            "DNSSEC delegation not observed",
            "No DS records were returned by public DoH resolvers for the audited hostname.",
            "Enable DNSSEC at the registrar/DNS provider or document why it is not used.",
            "DNS hardening",
        )

    if wordpress.get("detected"):
        components = wordpress.get("components", {})
        plugins = components.get("plugins", [])
        themes = components.get("themes", [])
        if plugins or themes:
            add(
                "low",
                "WordPress components visible from public assets",
                f"Visible plugin slugs: {sample(plugins)}. Visible theme slugs: {sample(themes)}.",
                "Keep visible plugins/themes patched and run authenticated SCA or WPScan to map exact versions and CVEs.",
                "WordPress exposure",
            )

        core_version = components.get("core_version")
        if core_version:
            add(
                "low",
                "WordPress core version exposed",
                f"Public generator metadata reveals WordPress {core_version}.",
                "Remove generator metadata and keep WordPress core on the current supported release.",
                "Information exposure",
            )

        if wordpress.get("xmlrpc_reachable"):
            add(
                "high",
                "WordPress XML-RPC endpoint reachable",
                probe_evidence("xmlrpc"),
                "Disable XML-RPC if unused, or restrict it with WAF rules and rate limits.",
                "WordPress attack surface",
            )

        if wordpress.get("rest_api_public"):
            add(
                "medium",
                "WordPress REST API is public",
                probe_evidence("wp_json"),
                "Keep REST routes minimal and restrict sensitive custom routes with authentication and authorization checks.",
                "WordPress attack surface",
            )

        if wordpress.get("users_endpoint_public"):
            add(
                "high",
                "WordPress users endpoint exposes author data",
                probe_evidence("wp_users"),
                "Block unauthenticated user enumeration routes or minimize returned author metadata.",
                "WordPress attack surface",
            )

        if wordpress.get("author_enumeration_signal"):
            add(
                "high",
                "WordPress author enumeration signal",
                probe_evidence("author_1"),
                "Disable author archives or rewrite numeric author probes to prevent username discovery.",
                "WordPress attack surface",
            )

        if wordpress.get("login_reachable"):
            add(
                "medium",
                "WordPress login endpoint publicly reachable",
                probe_evidence("wp_login"),
                "Protect wp-login.php with MFA, rate limiting, bot rules, and alerting for failed login bursts.",
                "Authentication exposure",
            )

        if wordpress.get("debug_log_public"):
            add(
                "critical",
                "WordPress debug log appears public",
                probe_evidence("debug_log"),
                "Move logs outside the web root and block direct access to debug.log immediately.",
                "Sensitive data exposure",
            )

        if wordpress.get("uploads_listing_signal"):
            add(
                "high",
                "WordPress uploads directory listing signal",
                "At least one /wp-content/uploads/ probe returned an index-like page.",
                "Disable auto-indexing for uploads and verify no backup or private files are stored under the web root.",
                "Server configuration",
            )

        robots_wp_lines = wordpress.get("robots_wp_lines", [])
        if robots_wp_lines:
            add(
                "low",
                "robots.txt exposes WordPress path hints",
                f"robots.txt includes WordPress-looking tokens: {sample(robots_wp_lines)}.",
                "Keep robots.txt minimal; do not rely on it to hide sensitive locations.",
                "Information exposure",
            )

    no_sri_assets = surface_context.get("external_assets_without_sri", [])
    if no_sri_assets:
        hosts = sorted({item.get("host", "") for item in no_sri_assets if item.get("host")})
        add(
            "medium",
            "External assets lack Subresource Integrity",
            f"{len(no_sri_assets)} external script/style asset(s) without integrity. Hosts: {sample(hosts)}.",
            "Add SRI to static third-party assets or self-host/pin them through a trusted build pipeline.",
            "Client-side supply chain",
        )

    return findings


def cookie_findings(
    headers: dict[str, str],
    set_cookies: list[str],
    is_https: bool,
) -> list[dict[str, str]]:
    raw_cookies = set_cookies[:8]
    if not raw_cookies and headers.get("set-cookie", ""):
        raw_cookies = re.split(r", (?=[^;,=]+?=)", headers["set-cookie"])[:8]
    if not raw_cookies:
        return []

    findings: list[dict[str, str]] = []
    for raw_cookie in raw_cookies:
        name = raw_cookie.split("=", 1)[0].strip()
        lower = raw_cookie.lower()
        if is_https and "secure" not in lower:
            findings.append(
                {
                    "severity": "medium",
                    "title": "Cookie missing Secure flag",
                    "category": "Session hardening",
                    "evidence": f"Cookie {name} does not visibly include Secure.",
                    "recommendation": "Set Secure on session and sensitive cookies.",
                }
            )
        if "httponly" not in lower:
            findings.append(
                {
                    "severity": "low",
                    "title": "Cookie missing HttpOnly flag",
                    "category": "Session hardening",
                    "evidence": f"Cookie {name} does not visibly include HttpOnly.",
                    "recommendation": "Set HttpOnly on cookies that do not need JavaScript access.",
                }
            )
        if "samesite" not in lower:
            findings.append(
                {
                    "severity": "low",
                    "title": "Cookie missing SameSite attribute",
                    "category": "Session hardening",
                    "evidence": f"Cookie {name} does not visibly include SameSite.",
                    "recommendation": "Set SameSite=Lax or SameSite=Strict where compatible.",
                }
            )
    return findings


def detect_jquery_versions(scripts: list[str]) -> list[tuple[str, str]]:
    versions: list[tuple[str, str]] = []
    for source in scripts:
        match = re.search(r"jquery[-.]([0-9]+\.[0-9]+(?:\.[0-9]+)?)", source, re.I)
        if match:
            versions.append((match.group(1), source))
    return versions


def version_tuple(value: str) -> tuple[int, ...]:
    return tuple(int(part) for part in re.findall(r"\d+", value))


def count_severities(findings: list[dict[str, str]]) -> dict[str, int]:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for finding in findings:
        severity = finding.get("severity", "low")
        if severity == "light":
            severity = "low"
        if severity not in counts:
            severity = "low"
        counts[severity] += 1
    return counts


def calculate_score(findings: list[dict[str, str]]) -> int:
    penalty = 0
    for finding in findings:
        severity = finding.get("severity", "low")
        if severity == "light":
            severity = "low"
        penalty += {"critical": 30, "high": 18, "medium": 9, "low": 3}.get(severity, 3)
    return max(0, 100 - penalty)


def posture_label(score: int) -> str:
    if score >= 86:
        return "Strong"
    if score >= 70:
        return "Good with gaps"
    if score >= 45:
        return "Needs hardening"
    return "High risk"


def infer_technologies(
    headers: dict[str, str],
    parser: PageParser,
    surface_context: dict[str, Any] | None = None,
) -> list[str]:
    tech: set[str] = set()
    surface_context = surface_context or {}
    server = headers.get("server", "")
    powered_by = headers.get("x-powered-by", "")
    if server:
        tech.add(server)
    if powered_by:
        tech.add(powered_by)
    if parser.generator:
        tech.add(parser.generator)

    script_text = " ".join(parser.scripts).lower()
    hints = {
        "React": ["react"],
        "Next.js": ["_next/"],
        "Vue": ["vue"],
        "Nuxt": ["_nuxt/"],
        "Angular": ["angular"],
        "jQuery": ["jquery"],
        "WordPress": ["wp-content", "wp-includes"],
        "Shopify": ["cdn.shopify.com"],
    }
    for name, markers in hints.items():
        if any(marker in script_text for marker in markers):
            tech.add(name)
    wordpress = surface_context.get("wordpress", {})
    if wordpress.get("detected"):
        tech.add("WordPress")
        components = wordpress.get("components", {})
        for plugin in components.get("plugins", [])[:8]:
            tech.add(f"WP plugin: {plugin}")
        for theme in components.get("themes", [])[:3]:
            tech.add(f"WP theme: {theme}")
    return sorted(tech)


def hosting_recommendations(
    final_url: Any,
    headers: dict[str, str],
    parser: PageParser,
    findings: list[dict[str, str]],
    technologies: list[str],
    surface_context: dict[str, Any] | None = None,
) -> list[dict[str, str]]:
    surface_context = surface_context or {}
    has_forms = bool(parser.forms)
    missing_csp = any(item["title"] == "Missing Content Security Policy" for item in findings)
    missing_hsts = any(item["title"] == "Missing HSTS" for item in findings)
    mixed_content = any(item["title"] == "Mixed content resources" for item in findings)
    wordpress = surface_context.get("wordpress", {})

    recommendations = [
        {
            "title": "Put the site behind a managed edge layer",
            "priority": "Critical" if final_url.scheme != "https" else "Medium",
            "detail": (
                "Use Cloudflare, Fastly, or CloudFront for managed TLS, HTTP to HTTPS "
                "redirects, DDoS protection, caching, and WAF rules."
            ),
        }
    ]

    if has_forms:
        recommendations.append(
            {
                "title": "Host dynamic workloads on an isolated app platform",
                "priority": "Medium",
                "detail": (
                    "Use Fly.io, Render, AWS App Runner, ECS Fargate, or Kubernetes with "
                    "least-privilege secrets, private networking, and audit logging."
                ),
            }
        )
    else:
        recommendations.append(
            {
                "title": "Consider a static-first deployment path",
                "priority": "Medium",
                "detail": (
                    "If the site is mostly static, Cloudflare Pages, Vercel, or Netlify "
                    "can reduce server patching burden and simplify global delivery."
                ),
            }
        )

    if missing_csp or missing_hsts:
        recommendations.append(
            {
                "title": "Move security headers to the edge",
                "priority": "Medium",
                "detail": (
                    "Define HSTS, CSP, Referrer-Policy, X-Content-Type-Options, and "
                    "Permissions-Policy in the reverse proxy or hosting platform."
                ),
            }
        )

    if mixed_content:
        recommendations.append(
            {
                "title": "Normalize asset delivery",
                "priority": "Medium",
                "detail": (
                    "Serve third-party and first-party assets through HTTPS-only origins "
                    "and monitor for regressions in CI."
                ),
            }
        )

    recommendations.append(
        {
            "title": "Add production observability",
            "priority": "Low",
            "detail": (
                "Capture access logs, WAF events, uptime checks, TLS expiry alerts, "
                "dependency scans, and structured application errors in one dashboard."
            ),
        }
    )

    if wordpress.get("detected"):
        recommendations.append(
            {
                "title": "Harden the WordPress edge",
                "priority": "High"
                if wordpress.get("xmlrpc_reachable") or wordpress.get("users_endpoint_public")
                else "Medium",
                "detail": (
                    "Put WordPress behind Cloudflare WAF/Bot Fight rules, restrict xmlrpc.php, "
                    "rate-limit wp-login.php, block user enumeration, and schedule plugin/theme SCA."
                ),
            }
        )

    if technologies:
        recommendations.append(
            {
                "title": "Patch visible platform components",
                "priority": "Low",
                "detail": (
                    "Keep exposed frameworks and server components current. Visible stack "
                    f"hints: {', '.join(technologies[:5])}."
                ),
            }
        )

    return recommendations


def public_header_subset(headers: dict[str, str]) -> dict[str, str]:
    interesting = [
        "server",
        "x-powered-by",
        "content-type",
        "strict-transport-security",
        "content-security-policy",
        "x-frame-options",
        "x-content-type-options",
        "referrer-policy",
        "permissions-policy",
        "cache-control",
        "set-cookie",
    ]
    return {name: headers[name] for name in interesting if name in headers}


def call_llm(target_url: str, report: dict[str, Any]) -> dict[str, Any]:
    if LLM_PROVIDER in {"local", "local_bridge", "codex"}:
        return call_local_bridge(target_url, report)

    token_choices = rotated_hf_tokens()
    if not token_choices:
        return {
            "skipped": True,
            "model": PUBLIC_MODEL_LABEL,
            "credential_count": 0,
            "content": (
                "HF_TOKENS or HF_TOKEN is not configured. The UI is showing the "
                "deterministic passive analysis report; set one of those variables and "
                "restart the server to enable structured synthesis."
            ),
        }

    prompt = build_llm_prompt(target_url, report)
    all_tokens = [token for _, token in token_choices]
    errors: list[str] = []

    for token_index, token in token_choices[:HF_MAX_ATTEMPTS]:
        try:
            content = create_hf_chat_completion(token, prompt)
            return {
                "skipped": False,
                "model": PUBLIC_MODEL_LABEL,
                "content": content,
                "prompt_preview": prompt[:900],
                "credential_count": len(token_choices),
                "credential_index": token_index + 1,
                "attempts": len(errors) + 1,
            }
        except Exception as exc:  # Keep the passive report available if HF fails.
            errors.append(redact_llm_error(exc, all_tokens))

    last_error = errors[-1] if errors else "Unknown inference error."
    return {
        "skipped": True,
        "model": PUBLIC_MODEL_LABEL,
        "credential_count": len(token_choices),
        "attempts": len(errors),
        "error": "all_hf_credentials_failed",
        "content": (
            "Structured synthesis failed after trying the configured credential(s). "
            "The deterministic passive analysis report is still available. "
            f"Last error: {last_error}"
        ),
    }


def call_local_bridge(target_url: str, report: dict[str, Any]) -> dict[str, Any]:
    prompt = build_llm_prompt(target_url, report)
    return call_local_bridge_prompt(target_url, prompt)


def call_local_bridge_prompt(target_url: str, prompt: str) -> dict[str, Any]:
    job_id = f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}-{uuid.uuid4().hex}"
    pending_dir = os.path.join(LOCAL_BRIDGE_DIR, "pending")
    done_dir = os.path.join(LOCAL_BRIDGE_DIR, "done")
    failed_dir = os.path.join(LOCAL_BRIDGE_DIR, "failed")
    for directory in (pending_dir, done_dir, failed_dir):
        os.makedirs(directory, exist_ok=True)

    pending_path = os.path.join(pending_dir, f"{job_id}.json")
    pending_tmp_path = f"{pending_path}.tmp"
    done_path = os.path.join(done_dir, f"{job_id}.json")
    failed_path = os.path.join(failed_dir, f"{job_id}.json")
    job = {
        "id": job_id,
        "target_url": target_url,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "prompt": prompt,
    }
    with open(pending_tmp_path, "w", encoding="utf-8") as handle:
        json.dump(job, handle, ensure_ascii=False, indent=2)
    os.replace(pending_tmp_path, pending_path)

    deadline = time.monotonic() + LOCAL_BRIDGE_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        if os.path.exists(done_path):
            with open(done_path, "r", encoding="utf-8") as handle:
                result = json.load(handle)
            return {
                "skipped": False,
                "model": result.get("model") or "Local Codex bridge",
                "content": result.get("content", ""),
                "prompt_preview": prompt[:900],
                "credential_count": 1,
                "attempts": int(result.get("attempts") or 1),
                "bridge_job_id": job_id,
                "bridge_provider": result.get("provider", "local"),
            }
        if os.path.exists(failed_path):
            with open(failed_path, "r", encoding="utf-8") as handle:
                result = json.load(handle)
            error = str(result.get("error") or "Local bridge worker failed.")
            return {
                "skipped": True,
                "model": result.get("model") or "Local Codex bridge",
                "content": (
                    "Local Codex bridge failed. The deterministic passive analysis "
                    f"report is still available. Error: {error}"
                ),
                "prompt_preview": prompt[:900],
                "credential_count": 1,
                "attempts": int(result.get("attempts") or 1),
                "error": "local_bridge_failed",
                "bridge_job_id": job_id,
                "bridge_provider": result.get("provider", "local"),
            }
        time.sleep(0.5)

    return {
        "skipped": True,
        "model": "Local Codex bridge",
        "content": (
            "Local Codex bridge timed out while waiting for the worker. The "
            "deterministic passive analysis report is still available. Start "
            "local_llm_worker.py and retry, or increase AEGIS_LOCAL_BRIDGE_TIMEOUT_SECONDS."
        ),
        "prompt_preview": prompt[:900],
        "credential_count": 1,
        "attempts": 0,
        "error": "local_bridge_timeout",
        "bridge_job_id": job_id,
    }


def call_codex_direct_pentest(target_url: str) -> dict[str, Any]:
    prompt = build_codex_direct_pentest_prompt(target_url)
    result = call_local_bridge_prompt(target_url, prompt)
    result["analysis_mode"] = "codex_direct"
    return result


def build_codex_direct_report(
    target_url: str,
    llm_context: dict[str, Any],
    steps: list[dict[str, Any]],
    elapsed_ms: int,
) -> dict[str, Any]:
    return {
        "target": target_url,
        "final_url": target_url,
        "score": 0,
        "posture": "Codex direct pentest",
        "severity_counts": {"critical": 0, "high": 0, "medium": 0, "low": 0},
        "summary": {
            "score": 0,
            "posture": "Codex direct pentest",
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "final_url": target_url,
            "status_code": "direct",
        },
        "http": {"status_code": "direct", "reason_phrase": "Codex CLI", "headers": {}},
        "tls": {"enabled": False, "skipped": True},
        "network": {"hostname": urlparse(target_url).hostname or "", "ips": []},
        "dns_records": {},
        "wordpress": {"detected": False, "components": {}},
        "surface": {"analysis_mode": "codex_direct"},
        "page": {
            "title": "Codex direct pentest",
            "forms_count": 0,
            "password_inputs": 0,
            "scripts_count": 0,
            "stylesheets_count": 0,
            "images_count": 0,
            "external_hosts": [],
            "mixed_content": [],
        },
        "technologies": ["Codex direct analysis"],
        "vulnerabilities": [],
        "hosting_recommendations": [],
        "llm": llm_context,
        "steps": steps,
        "duration_ms": elapsed_ms,
    }


def build_codex_direct_pentest_prompt(target_url: str) -> str:
    return (
        "You are running as local Codex CLI for Aegis. The user explicitly requested an "
        "authorized security assessment of this target, and the Aegis UI authorization "
        "checkbox was required before this job was created.\n\n"
        f"Target scope: {target_url}\n\n"
        "Do the assessment end-to-end yourself. Do not rely on any precomputed backend "
        "collector output; the backend only passed you the target. Use local command-line "
        "tools and safe scripts available in this environment to gather evidence.\n\n"
        "Rules of engagement:\n"
        "- Stay in the exact target origin and directly related same-site public resources.\n"
        "- Use non-destructive authorized testing only: DNS, TLS, HTTP(S), headers, robots, "
        "sitemap, same-origin crawl, static source inspection, JavaScript endpoint discovery, "
        "CMS fingerprinting, safe GET/HEAD/OPTIONS requests, public metadata, public files, "
        "and version/CVE correlation when versions are actually observed.\n"
        "- Do not brute force credentials, bypass authentication, exploit RCE/SQLi/XSS, upload "
        "files, mutate state, run destructive checks, cause denial of service, spam requests, "
        "or exfiltrate private data.\n"
        "- If a possible issue needs authenticated, server-side, or intrusive validation, mark "
        "it clearly as requiring validation instead of claiming exploitation.\n\n"
        "Testing depth expected:\n"
        "- Inspect the homepage and crawl same-origin links respectfully.\n"
        "- Inspect HTML, forms, comments, script/style URLs, inline scripts, and public JS files.\n"
        "- Search for exposed admin/login/CMS surfaces, API routes, backup/config/log artifacts, "
        "directory listing, upload paths, debug endpoints, robots/sitemap leaks, security headers, "
        "cookies, CORS, mixed content, third-party assets, and weak TLS/DNS posture.\n"
        "- For WordPress or another CMS, fingerprint core/plugin/theme/version signals where "
        "publicly visible, check safe public endpoints such as wp-json, xmlrpc, wp-login behavior, "
        "readme/license/install artifacts, uploads listing, user enumeration signals, and exposed "
        "debug/backup files.\n"
        "- Prioritize critical and high-impact vulnerabilities. If you find none, say none were "
        "confirmed, but still list suspected paths and what proof is missing.\n\n"
        "Final output requirements:\n"
        "- Do not artificially limit the report length. Show the full useful report on the site.\n"
        "- Be precise, evidence-driven, and practical.\n"
        "- Start with an executive risk summary.\n"
        "- Then list Critical, High, Medium, and Low findings in that order.\n"
        "- For every finding include: Vulnerability, Severity, Evidence with URL/status/header/path, "
        "How someone could use it at a defensive high level, Impact, Fix, and Confidence.\n"
        "- Include a Tested Paths / Evidence Log section listing the important URLs and checks you ran.\n"
        "- Include False Positives / Needs Validation for anything not fully proven.\n"
        "- Include a prioritized remediation plan.\n"
        "- Do not hide findings just because they are numerous."
    )


def create_hf_chat_completion(token: str, prompt: str) -> str:
    payload = {
        "model": HF_MODEL_ID,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1200,
        "temperature": 0.2,
    }
    try:
        response = post_hf_router_json(token, "/v1/chat/completions", payload)
        message = response["choices"][0]["message"]
        return message.get("content") or json.dumps(message)
    except Exception as fallback_exc:
        try:
            client = OpenAI(base_url=HF_BASE_URL, api_key=token, timeout=8.0)
            completion = client.chat.completions.create(**payload)
            message = completion.choices[0].message
            return message.content or str(message)
        except Exception as original_exc:
            raise RuntimeError(
                f"DNS fallback failed ({fallback_exc}); "
                f"OpenAI client failed ({original_exc.__class__.__name__})."
            ) from original_exc


def post_hf_router_json(token: str, path: str, payload: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    request_head = (
        f"POST {path} HTTP/1.1\r\n"
        f"Host: {HF_ROUTER_HOST}\r\n"
        "User-Agent: AegisResearchAudit/1.0\r\n"
        "Accept: application/json\r\n"
        "Accept-Encoding: identity\r\n"
        "Content-Type: application/json\r\n"
        f"Content-Length: {len(body)}\r\n"
        f"Authorization: Bearer {token}\r\n"
        "Connection: close\r\n\r\n"
    ).encode("ascii")

    raw = b""
    last_error: Exception | None = None
    for ip in resolve_with_cloudflare_doh(HF_ROUTER_HOST):
        try:
            with socket.create_connection((ip, 443), timeout=10.0) as sock:
                context = ssl.create_default_context()
                with context.wrap_socket(sock, server_hostname=HF_ROUTER_HOST) as tls_sock:
                    tls_sock.settimeout(90.0)
                    tls_sock.sendall(request_head + body)
                    while True:
                        chunk = tls_sock.recv(16384)
                        if not chunk:
                            break
                        raw += chunk
            break
        except Exception as exc:
            raw = b""
            last_error = exc
            continue

    if not raw:
        raise RuntimeError(f"unable to connect to inference gateway: {last_error}")

    header_bytes, _, response_body = raw.partition(b"\r\n\r\n")
    header_text = header_bytes.decode("iso-8859-1", errors="replace")
    lines = header_text.split("\r\n")
    status_line = lines[0] if lines else ""
    status_parts = status_line.split(" ", 2)
    status_code = int(status_parts[1]) if len(status_parts) > 1 and status_parts[1].isdigit() else 0
    response_headers: dict[str, str] = {}
    for line in lines[1:]:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        response_headers[key.strip().lower()] = value.strip()

    if response_headers.get("transfer-encoding", "").lower() == "chunked":
        response_body = decode_chunked_body(response_body)
    text = response_body.decode(
        encoding_from_content_type(response_headers.get("content-type", "")),
        errors="replace",
    )
    if status_code >= 400:
        raise RuntimeError(f"inference gateway HTTP {status_code}: {text[:500]}")
    return json.loads(text)


def hf_tokens_from_env() -> list[str]:
    raw_values = [
        os.getenv("HF_TOKENS", ""),
        os.getenv("HF_TOKEN", ""),
    ]
    tokens: list[str] = []
    seen: set[str] = set()
    for raw_value in raw_values:
        for raw_token in re.split(r"[\s,;]+", raw_value.strip()):
            token = raw_token.strip().strip("\"'")
            if token and token not in seen:
                tokens.append(token)
                seen.add(token)
    return tokens


def rotated_hf_tokens() -> list[tuple[int, str]]:
    global HF_TOKEN_CURSOR

    tokens = hf_tokens_from_env()
    if not tokens:
        return []

    with HF_TOKEN_LOCK:
        start_index = HF_TOKEN_CURSOR % len(tokens)
        HF_TOKEN_CURSOR += 1

    return [
        (token_index, tokens[token_index])
        for token_index in (
            (start_index + offset) % len(tokens) for offset in range(len(tokens))
        )
    ]


def redact_llm_error(exc: Exception, secrets: list[str]) -> str:
    message = str(exc).strip() or "No error detail returned."
    for secret in secrets:
        message = message.replace(secret, "[redacted]")
    if len(message) > 500:
        message = f"{message[:500]}..."
    return f"{exc.__class__.__name__}: {message}"


def build_llm_step_detail(llm_context: dict[str, Any]) -> str:
    credential_count = int(llm_context.get("credential_count") or 0)
    if llm_context.get("error"):
        return (
            f"Structured synthesis failed after {credential_count} configured credential(s); "
            "the deterministic report remains available."
        )
    if llm_context.get("skipped"):
        return (
            "Model credentials are not set, so the deterministic local report was returned."
        )
    preview = llm_preview(llm_context.get("content", ""))
    if preview:
        return f"Synthesis ready: {preview}"
    return "Synthesis ready."


def llm_preview(content: str, limit: int = 340) -> str:
    text = re.sub(r"\s+", " ", str(content or "")).strip()
    if not text:
        return ""
    return f"{text[:limit]}..." if len(text) > limit else text


def build_llm_prompt(target_url: str, report: dict[str, Any]) -> str:
    compact_report = {
        "target": target_url,
        "final_url": report["final_url"],
        "score": report["score"],
        "posture": report["posture"],
        "severity_counts": report["severity_counts"],
        "http": report["http"],
        "tls": report["tls"],
        "dns_records": report.get("dns_records", {}),
        "wordpress": report.get("wordpress", {}),
        "surface": report.get("surface", {}),
        "page": report["page"],
        "technologies": report["technologies"],
        "passive_findings": report["vulnerabilities"],
        "hosting_recommendations": report["hosting_recommendations"],
    }
    return (
        f"{LLM_BASE_PROMPT}\n\n"
        f'Website given by the user: "{target_url}"\n\n'
        "Think thoroughly before answering. Use full security-analysis effort, especially "
        "for possible critical and high-impact paths, but keep the final report precise "
        "and not chatty.\n\n"
        "Use only the passive observations below. Do not invent exploit success, "
        "credentials, malware, internal access, SSH/UFW/MySQL state, filesystem permissions, "
        "backups, plugin CVEs, MFA, or lockout status unless they are directly present in "
        "the observations. Do not infer WordPress core versions, web hosting provider, shared "
        "hosting status, OS/package versions, or quantitative risk-reduction percentages. MX "
        "records are mail-routing evidence only, not web-hosting evidence. If wordpress.components."
        "core_version is empty, say 'WordPress core version not observed'. When a point is not "
        "externally observable, label it 'requires authenticated/server-side validation'. "
        "Never upgrade a finding to critical or high unless the evidence supports that severity. "
        "If no critical or high issue is observable, say that clearly.\n\n"
        "Output format: concise pentest report, maximum 1400 words. No long intro. Use these "
        "sections exactly:\n"
        "1. Risk Snapshot - one paragraph with score, posture, and whether critical/high issues "
        "were observed.\n"
        "2. Critical / High Findings - only confirmed or strongly evidenced critical/high items. "
        "For each item use: Vulnerability, Evidence, How it could be used, Impact, Fix.\n"
        "3. Medium Findings - compact bullets. For each: vulnerability, observed evidence, "
        "realistic abuse path, fix.\n"
        "4. Low Findings - compact bullets with evidence and fix.\n"
        "5. WordPress Surface - mention only observed WordPress signals and what an attacker "
        "could realistically test next without claiming success.\n"
        "6. Priority Fix Plan - ordered checklist, highest risk first.\n"
        "7. Validation Notes - what still needs authenticated/server-side validation.\n\n"
        "For 'How it could be used', describe realistic attacker usage at a defensive level. "
        "Do not provide exploit payloads, credential attacks, destructive steps, or instructions "
        "to bypass controls.\n\n"
        "Passive observations JSON:\n"
        f"{json.dumps(compact_report, indent=2)}"
    )
