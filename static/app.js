const form = document.querySelector("#audit-form");
const targetInput = document.querySelector("#target");
const authorizedInput = document.querySelector("#authorized");
const analysisEngineInput = document.querySelector("#analysis-engine");
const runButton = document.querySelector("#run-button");
const runLabel = document.querySelector("#run-label");
const traceList = document.querySelector("#trace-list");
const workBoard = document.querySelector("#work-board");
const workStatus = document.querySelector("#work-status");
const workDetail = document.querySelector("#work-detail");
const workProgressLabel = document.querySelector("#work-progress-label");
const workSteps = document.querySelector("#work-steps");
const agentState = document.querySelector("#agent-state");
const agentDetail = document.querySelector("#agent-detail");
const elapsed = document.querySelector("#elapsed");
const progressBar = document.querySelector("#progress-bar");
const scoreRing = document.querySelector("#score-ring");
const scoreValue = document.querySelector("#score-value");
const posture = document.querySelector("#posture");
const summaryLine = document.querySelector("#summary-line");
const criticalCount = document.querySelector("#critical-count");
const highCount = document.querySelector("#high-count");
const mediumCount = document.querySelector("#medium-count");
const lowCount = document.querySelector("#low-count");
const factsPanel = document.querySelector("#facts-panel");
const findingsList = document.querySelector("#findings-list");
const hostingList = document.querySelector("#hosting-list");
const llmOutput = document.querySelector("#llm-output");
const reportModal = document.querySelector("#report-modal");
const openReportButton = document.querySelector("#open-report");
const navActions = document.querySelectorAll("[data-nav-target]");
const closeReportTriggers = document.querySelectorAll("[data-close-report]");
const reportSearchInput = document.querySelector(".report-search input");

const traceItems = new Map();
let runStartedAt = 0;
let timer = null;
let currentReport = null;

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  targetInput?.focus();
  setReportNavReady(false);
  installLocalPreviewHook();
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runAnalysis();
});

openReportButton?.addEventListener("click", () => {
  if (currentReport) {
    openReportModal();
    return;
  }
  renderEmptyReport();
  openReportModal();
});

navActions.forEach((action) => {
  action.addEventListener("click", () => {
    const target = action.dataset.navTarget;
    if (target === "work") scrollToWork();
    if (target === "live") scrollToLive();
  });
});

closeReportTriggers.forEach((trigger) => {
  trigger.addEventListener("click", closeReportModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeReportModal();
});

traceList?.addEventListener("click", (event) => {
  const reportTrigger = event.target.closest("[data-open-report]");
  if (reportTrigger && currentReport) openReportModal();
});

document.addEventListener("click", (event) => {
  const focusTrigger = event.target.closest("[data-focus-target]");
  if (!focusTrigger) return;
  closeReportModal();
  focusTargetInput();
});

reportSearchInput?.addEventListener("input", () => {
  filterReport(reportSearchInput.value);
});

async function runAnalysis() {
  const target = normalizeTargetInput(targetInput.value);
  targetInput.value = target;
  document.body.classList.remove("is-pristine");
  resetRun(target);
  runStartedAt = performance.now();
  timer = window.setInterval(updateElapsed, 120);
  runButton.disabled = true;
  runButton.classList.add("is-running");
  runLabel.textContent = "Thinking";
  agentState.textContent = "Running";
  agentDetail.textContent = "Preparing Aegis tools.";
  workStatus.textContent = "Running";
  workDetail.textContent = "Preparing Aegis tools.";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target,
        authorized: authorizedInput.checked,
        engine: analysisEngineInput?.value || "aegis",
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Request failed with HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.trim()) handleEvent(JSON.parse(line));
      }
    }

    if (buffer.trim()) handleEvent(JSON.parse(buffer));
  } catch (error) {
    showError(error.message);
  } finally {
    runButton.disabled = false;
    runButton.classList.remove("is-running");
    runLabel.textContent = "Analyze";
    window.clearInterval(timer);
    updateElapsed();
  }
}

function handleEvent(message) {
  const { type, data } = message;
  if (type === "step") {
    renderStep(data);
    agentState.textContent = data.status === "complete" ? "Thinking" : "Running";
    agentDetail.textContent = data.detail;
    updateProgress();
    renderWorkStep(data);
  }
  if (type === "metrics") {
    renderMetrics(data);
  }
  if (type === "report") {
    renderReport(data);
    appendReportReadyMessage(data);
    openReportModal();
    agentState.textContent = "Complete";
    agentDetail.textContent = `Report completed in ${data.duration_ms} ms.`;
    workStatus.textContent = "Complete";
    workDetail.textContent = `Report completed in ${data.duration_ms} ms.`;
    workProgressLabel.textContent = "100%";
  }
  if (type === "error") {
    showError(data.message);
  }
  if (type === "done") {
    elapsed.textContent = `${data.duration_ms} ms`;
  }
}

function resetRun(target) {
  currentReport = null;
  traceItems.clear();
  closeReportModal();
  setReportNavReady(false);
  progressBar.style.setProperty("--progress", "0%");
  resetWorkBoard();

  traceList.innerHTML = `
    <li class="chat-message user">
      <div class="user-bubble">${escapeHtml(target || "New analysis")}</div>
    </li>
    <li class="chat-message assistant intro-message">
      <span class="message-avatar" aria-hidden="true">A</span>
      <div class="message-body">
        <p class="assistant-kicker">Aegis research agent</p>
        <p>Starting the live reasoning stream. Aegis tools will appear here as they run.</p>
      </div>
    </li>
  `;

  factsPanel.innerHTML =
    '<p class="panel-placeholder">DNS, HTTP, TLS, and page facts will land here.</p>';
  findingsList.innerHTML = '<p class="panel-placeholder">No findings yet.</p>';
  hostingList.innerHTML =
    '<p class="panel-placeholder">Recommendations will be generated after analysis.</p>';
  llmOutput.textContent = "Waiting for model output.";
  renderMetrics({
    score: 0,
    posture: "Running",
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    final_url: "",
    status_code: "",
  });
  scrollChatToBottom();
}

function renderStep(step) {
  let item = traceItems.get(step.id);
  if (!item) {
    item = document.createElement("li");
    item.className = "chat-message assistant trace-item";
    item.innerHTML = `
      <span class="message-avatar" aria-hidden="true">A</span>
      <div class="message-body">
        <p class="thinking-label">Using <span class="tool-name"></span></p>
        <p class="step-title"></p>
        <p class="trace-detail"></p>
        <p class="step-preview" hidden></p>
      </div>
    `;
    traceItems.set(step.id, item);
    traceList.appendChild(item);
  }
  item.classList.toggle("complete", step.status === "complete");
  item.classList.toggle("running", step.status !== "complete");
  item.classList.remove("error");
  item.querySelector(".step-title").textContent = step.title;
  item.querySelector(".tool-name").textContent = step.tool;
  item.querySelector(".trace-detail").textContent = step.detail;
  const preview = item.querySelector(".step-preview");
  const previewText = step.result?.preview || "";
  preview.hidden = !previewText;
  preview.textContent = previewText ? `Sub-result: ${previewText}` : "";
  scrollChatToBottom();
}

function resetWorkBoard() {
  workStatus.textContent = "Running";
  workDetail.textContent = "Preparing passive tools.";
  workProgressLabel.textContent = "0%";
  workSteps.innerHTML = "";
}

function renderWorkStep(step) {
  let item = Array.from(workSteps.children).find(
    (candidate) => candidate.dataset.workStep === step.id,
  );
  if (!item) {
    item = document.createElement("li");
    item.dataset.workStep = step.id;
    workSteps.appendChild(item);
  }
  item.classList.toggle("complete", step.status === "complete");
  item.classList.toggle("running", step.status !== "complete");
  item.innerHTML = `
    <span>${escapeHtml(step.title)}</span>
    <strong>${escapeHtml(step.status === "complete" ? "Done" : "Running")}</strong>
  `;
  workStatus.textContent = step.status === "complete" ? "Working" : "Running";
  workDetail.textContent = step.detail;
}

function renderMetrics(summary) {
  const score = Number(summary.score || 0);
  scoreRing.style.setProperty("--score", score);
  scoreValue.textContent = summary.score ? String(score) : "--";
  posture.textContent = summary.posture || "Running";
  criticalCount.textContent = summary.critical || 0;
  highCount.textContent = summary.high || 0;
  mediumCount.textContent = summary.medium || 0;
  lowCount.textContent = summary.low ?? summary.light ?? 0;
  summaryLine.textContent = summary.final_url
    ? `HTTP ${summary.status_code} from ${summary.final_url}`
    : "The agent is collecting passive evidence.";
}

function renderReport(report) {
  currentReport = report;
  setReportNavReady(true);
  if (isDirectReport(report)) {
    setReportModeLabels(report);
    renderDirectPanels(report);
  } else {
    setReportModeLabels(null);
    renderMetrics(report.summary);
    renderFacts(report);
    renderFindings(report.vulnerabilities || []);
    renderHosting(report.hosting_recommendations || []);
  }
  llmOutput.textContent = report.llm?.content || "No LLM content returned.";
  if (reportSearchInput) reportSearchInput.value = "";
  filterReport("");
}

function renderDirectPanels(report) {
  const rawOutput = report.llm?.content || "";
  const parsed = parseDirectReport(rawOutput);
  const engineName = directEngineName(report);
  const totalFindings = parsed.findings.length;
  const weightedScore = Math.min(
    100,
    parsed.counts.critical * 30 +
      parsed.counts.high * 20 +
      parsed.counts.medium * 9 +
      parsed.counts.low * 4,
  );

  scoreRing.style.setProperty("--score", weightedScore);
  scoreValue.textContent = totalFindings ? String(totalFindings) : "--";
  criticalCount.textContent = parsed.counts.critical;
  highCount.textContent = parsed.counts.high;
  mediumCount.textContent = parsed.counts.medium;
  lowCount.textContent = parsed.counts.low;
  posture.textContent = directPostureLabel(parsed.counts, engineName);
  summaryLine.textContent = `${totalFindings} classified finding(s) from ${engineName} direct analysis of ${
    report.final_url || report.target || "the target"
  }.`;

  factsPanel.classList.add("direct-dashboard");
  findingsList.classList.add("direct-findings-list");
  hostingList.classList.add("direct-support-list");
  factsPanel.innerHTML = `
    <article class="direct-overview-card report-searchable">
      <span class="direct-card-label">Executive risk summary</span>
      ${renderTextBlock(parsed.summary || `${engineName} did not return a separate executive summary.`)}
    </article>
    <article class="direct-chart-card report-searchable">
      <span class="direct-card-label">Severity distribution</span>
      ${renderSeverityBars(parsed.counts)}
    </article>
    <article class="direct-meta-card report-searchable">
      <span class="direct-card-label">Run context</span>
      <dl>
        <div><dt>Target</dt><dd>${escapeHtml(report.final_url || report.target || "")}</dd></div>
        <div><dt>Mode</dt><dd>${escapeHtml(engineName)} direct assessment</dd></div>
        <div><dt>Engine</dt><dd>${escapeHtml(report.llm?.model || engineName)}</dd></div>
        <div><dt>Duration</dt><dd>${escapeHtml(formatDuration(report.duration_ms))}</dd></div>
      </dl>
    </article>
  `;
  findingsList.innerHTML = renderDirectFindings(parsed, engineName);
  hostingList.innerHTML = renderDirectSupportSections(parsed);
}

function setReportModeLabels(report) {
  const sections = reportModal?.querySelectorAll(".modal-section") || [];
  const kicker = reportModal?.querySelector(".modal-header .kicker");
  const isDirect = Boolean(report);
  const engineName = isDirect ? directEngineName(report) : "Kimi";
  if (kicker) kicker.textContent = isDirect ? `${engineName} direct report` : "Kimi report";
  const labels = isDirect
    ? [
        ["Report overview", `Parsed from raw ${engineName} output`],
        ["Findings by severity", "Critical to low"],
        ["Evidence and remediation", "Plan, logs, validation"],
        ["Raw LLM output", "Unmodified source"],
      ]
    : [
        ["Facts", "Passive evidence"],
        ["Security findings", "Classified issues"],
        ["Recommended architecture", "Hosting and edge hardening"],
        ["Structured synthesis", "LLM output"],
      ];
  labels.forEach(([title, subtitle], index) => {
    const section = sections[index];
    if (!section) return;
    const heading = section.querySelector(".section-heading h3");
    const label = section.querySelector(".section-heading span");
    if (heading) heading.textContent = title;
    if (label) label.textContent = subtitle;
  });
}

function isDirectReport(report) {
  return ["aegis_direct", "kimi_direct", "direct"].includes(
    report?.surface?.analysis_mode,
  );
}

function directEngineName(report) {
  return report?.surface?.analysis_mode === "kimi_direct" ? "Kimi" : "Aegis";
}

function parseDirectReport(raw) {
  const sections = splitReportSections(raw);
  const findings = [];
  for (const severity of ["critical", "high", "medium", "low"]) {
    findings.push(...parseFindingSection(sections.get(`${severity} findings`) || "", severity));
  }

  if (!findings.length) findings.push(...parseInlineSeverityFindings(raw));

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  findings.forEach((finding) => {
    if (counts[finding.severity] !== undefined) counts[finding.severity] += 1;
  });

  return {
    sections,
    findings,
    counts,
    summary: sections.get("executive risk summary") || firstParagraph(raw),
    evidenceLog: sections.get("tested paths / evidence log") || "",
    validation: sections.get("false positives / needs validation") || "",
    remediation: sections.get("prioritized remediation plan") || "",
  };
}

function splitReportSections(raw) {
  const known = new Set([
    "executive risk summary",
    "critical findings",
    "high findings",
    "medium findings",
    "low findings",
    "tested paths / evidence log",
    "false positives / needs validation",
    "prioritized remediation plan",
  ]);
  const sections = new Map();
  let current = "preamble";
  let buffer = [];

  String(raw || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line) => {
      const heading = normalizeReportHeading(line);
      if (known.has(heading)) {
        if (buffer.join("\n").trim()) sections.set(current, buffer.join("\n").trim());
        current = heading;
        buffer = [];
        return;
      }
      buffer.push(line);
    });

  if (buffer.join("\n").trim()) sections.set(current, buffer.join("\n").trim());
  return sections;
}

function normalizeReportHeading(line) {
  return String(line || "")
    .trim()
    .replace(/^#{1,4}\s*/, "")
    .replace(/^\*\*/, "")
    .replace(/\*\*$/, "")
    .replace(/:$/, "")
    .trim()
    .toLowerCase();
}

function parseFindingSection(text, fallbackSeverity) {
  const normalized = String(text || "").trim();
  if (!normalized) return [];

  const numberedBlocks = normalized
    .split(/\n(?=\d+\.\s+\*\*Vulnerability:\*\*)/g)
    .map((block) => block.trim())
    .filter(Boolean);
  const blocks =
    numberedBlocks.length > 1 || /^\d+\.\s+\*\*Vulnerability:\*\*/.test(numberedBlocks[0] || "")
      ? numberedBlocks
      : normalized
          .split(/\n(?=-\s+\*\*)/g)
          .map((block) => block.trim())
          .filter(Boolean);

  return blocks.map((block, index) => findingFromBlock(block, fallbackSeverity, index + 1));
}

function findingFromBlock(block, fallbackSeverity, index) {
  const fields = extractFindingFields(block);
  const bulletTitle = block.match(/^-\s+\*\*([^*]+)\*\*:?\s*(.*)$/m);
  const title =
    fields.vulnerability ||
    (bulletTitle ? `${bulletTitle[1]}${bulletTitle[2] ? `: ${bulletTitle[2]}` : ""}` : "") ||
    `${capitalize(fallbackSeverity)} finding ${index}`;
  const severity = normalizeSeverity(fields.severity || fallbackSeverity);
  return {
    title: stripMarkdown(title),
    severity,
    evidence: fields.evidence || "",
    usage:
      fields["how someone could use it"] ||
      fields["how it could be used"] ||
      fields["abuse path"] ||
      "",
    impact: fields.impact || "",
    fix: fields.fix || fields.recommendation || "",
    confidence: fields.confidence || "",
    raw: block,
  };
}

function extractFindingFields(block) {
  const fields = {};
  const pattern =
    /\*\*([^:*]{2,70}):\*\*\s*([\s\S]*?)(?=\n\s*(?:\d+\.\s+)?\*\*[^:*]{2,70}:\*\*|\n\s*-\s+\*\*|$)/g;
  let match;
  while ((match = pattern.exec(block))) {
    const key = match[1].trim().toLowerCase();
    fields[key] = match[2].trim();
  }
  return fields;
}

function parseInlineSeverityFindings(raw) {
  const fields = extractFindingFields(raw);
  if (!fields.vulnerability && !fields.evidence) return [];
  return [findingFromBlock(raw, normalizeSeverity(fields.severity || "medium"), 1)];
}

function renderDirectFindings(parsed, engineName = "Aegis") {
  if (!parsed.findings.length) {
    return `<p class="panel-placeholder">No classified findings were parsed. The raw ${escapeHtml(engineName)} report is preserved below.</p>`;
  }
  return ["critical", "high", "medium", "low"]
    .map((severity) => {
      const group = parsed.findings.filter((finding) => finding.severity === severity);
      if (!group.length) return "";
      return `
        <section class="direct-severity-group report-searchable">
          <div class="direct-group-heading">
            <h4>${capitalize(severity)} findings</h4>
            <span class="severity-tag ${severity}">${group.length}</span>
          </div>
          ${group.map(renderDirectFindingCard).join("")}
        </section>
      `;
    })
    .join("");
}

function renderDirectFindingCard(finding) {
  return `
    <article class="direct-finding-card ${escapeHtml(finding.severity)} report-searchable">
      <div class="finding-topline">
        <h3>${escapeHtml(finding.title)}</h3>
        <span class="severity-tag ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span>
      </div>
      ${renderFindingField("Evidence", finding.evidence)}
      ${renderFindingField("How it could be used", finding.usage)}
      ${renderFindingField("Impact", finding.impact)}
      ${renderFindingField("Fix", finding.fix)}
      ${renderFindingField("Confidence", finding.confidence)}
    </article>
  `;
}

function renderDirectSupportSections(parsed) {
  const cards = [
    ["Priority remediation plan", parsed.remediation],
    ["Tested paths / evidence log", parsed.evidenceLog],
    ["False positives / needs validation", parsed.validation],
  ].filter(([, content]) => content.trim());

  if (!cards.length) {
    return '<p class="panel-placeholder">Evidence and remediation details are available in the raw report below.</p>';
  }

  return cards
    .map(([title, content]) => {
      return `
        <article class="direct-support-card report-searchable">
          <h3>${escapeHtml(title)}</h3>
          ${renderTextBlock(content)}
        </article>
      `;
    })
    .join("");
}

function renderSeverityBars(counts) {
  const max = Math.max(1, counts.critical, counts.high, counts.medium, counts.low);
  return ["critical", "high", "medium", "low"]
    .map((severity) => {
      const count = counts[severity] || 0;
      const width = Math.max(4, Math.round((count / max) * 100));
      return `
        <div class="severity-bar-row ${severity}">
          <span>${capitalize(severity)}</span>
          <div class="severity-bar-track"><i style="width: ${width}%"></i></div>
          <strong>${count}</strong>
        </div>
      `;
    })
    .join("");
}

function renderFindingField(label, value) {
  if (!value) return "";
  return `<p><strong>${escapeHtml(label)}:</strong> ${renderInlineMarkdown(value)}</p>`;
}

function renderTextBlock(text) {
  const lines = String(text || "")
    .trim()
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  return lines.map((line) => `<p>${renderInlineMarkdown(line)}</p>`).join("");
}

function renderInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    );
}

function firstParagraph(raw) {
  return (
    String(raw || "")
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .find((part) => part && !normalizeReportHeading(part).endsWith("findings")) || ""
  );
}

function directPostureLabel(counts, engineName = "Aegis") {
  if (counts.critical) return "Critical exposure";
  if (counts.high) return "High risk";
  if (counts.medium) return "Needs hardening";
  if (counts.low) return "Low risk findings";
  return `${engineName} direct assessment`;
}

function normalizeSeverity(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["critical", "high", "medium", "low"].includes(normalized)) return normalized;
  return "medium";
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function capitalize(value) {
  const text = String(value || "");
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

function formatDuration(ms) {
  const value = Number(ms || 0);
  if (!value) return "n/a";
  if (value < 1000) return `${value} ms`;
  return `${Math.round(value / 1000)} s`;
}

function renderEmptyReport() {
  setReportModeLabels(null);
  factsPanel.classList.remove("direct-dashboard");
  findingsList.classList.remove("direct-findings-list");
  hostingList.classList.remove("direct-support-list");
  renderMetrics({
    score: 0,
    posture: "Awaiting scan",
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    final_url: "",
    status_code: "",
  });
  summaryLine.textContent = "No target has been scanned yet.";
  factsPanel.innerHTML = `
    <div class="empty-report report-searchable">
      <h3>No report yet</h3>
      <p>Scan an authorized target to populate DNS, TLS, WordPress, headers, findings, and hosting recommendations.</p>
      <button type="button" data-focus-target>Scan a target</button>
    </div>
  `;
  findingsList.innerHTML = '<p class="panel-placeholder">Findings will appear after the first scan.</p>';
  hostingList.innerHTML = '<p class="panel-placeholder">Architecture recommendations will appear after analysis.</p>';
  llmOutput.textContent = "The model output will appear after the first completed scan.";
  if (reportSearchInput) reportSearchInput.value = "";
  filterReport("");
}

function appendReportReadyMessage(report) {
  const existing = traceList.querySelector("[data-report-ready]");
  existing?.remove();

  const item = document.createElement("li");
  item.className = "chat-message assistant";
  item.setAttribute("data-report-ready", "true");
  item.innerHTML = `
    <span class="message-avatar" aria-hidden="true">A</span>
    <div class="message-body report-ready">
      <p><strong>Report ready.</strong> Score ${escapeHtml(report.score)} / ${escapeHtml(report.posture)} / ${escapeHtml(report.duration_ms)} ms.</p>
      <button type="button" data-open-report>Open report</button>
    </div>
  `;
  traceList.appendChild(item);
  scrollChatToBottom();
}

function renderFacts(report) {
  factsPanel.classList.remove("direct-dashboard");
  findingsList.classList.remove("direct-findings-list");
  hostingList.classList.remove("direct-support-list");
  const tls = report.tls || {};
  const page = report.page || {};
  const http = report.http || {};
  const network = report.network || {};
  const wordpress = report.wordpress || {};
  const dnsRecords = report.dns_records || {};
  const facts = [
    ["Final URL", report.final_url],
    ["Status", `${http.status_code || ""} ${http.reason_phrase || ""}`.trim()],
    ["Transport", http.transport || "unknown"],
    ["Resolved IPs", (network.ips || []).join(", ") || "None"],
    [
      "TLS",
      tls.enabled
        ? `${tls.version || "TLS"} via ${tls.issuer?.organizationName || "issuer unknown"}`
        : "Not confirmed",
    ],
    ["Server", http.headers?.server || "Not disclosed"],
    ["Page title", page.title || "Untitled"],
    ["Forms", String(page.forms_count || 0)],
    ["WordPress", wordpress.detected ? "Detected" : "Not detected"],
    ["Visible plugins", (wordpress.components?.plugins || []).join(", ") || "None"],
    ["DNS CAA", (dnsRecords.caa || []).join(", ") || "None observed"],
    ["Detected stack", (report.technologies || []).join(", ") || "No visible stack hints"],
  ];
  factsPanel.innerHTML = facts
    .map(([label, value]) => {
      return `<div class="fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
    })
    .join("");
}

function renderFindings(findings) {
  if (!findings.length) {
    findingsList.innerHTML =
      '<p class="panel-placeholder">No passive critical, high, medium, or low issues were identified.</p>';
    return;
  }
  findingsList.innerHTML = findings
    .map((finding) => {
      return `
        <article class="finding-card report-searchable">
          <div class="finding-topline">
            <h3>${escapeHtml(finding.title)}</h3>
            <span class="severity-tag ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span>
          </div>
          <span class="category">${escapeHtml(finding.category)}</span>
          <p><strong>Evidence:</strong> ${escapeHtml(finding.evidence)}</p>
          <p><strong>Fix:</strong> ${escapeHtml(finding.recommendation)}</p>
        </article>
      `;
    })
    .join("");
}

function renderHosting(recommendations) {
  if (!recommendations.length) {
    hostingList.innerHTML = '<p class="panel-placeholder">No hosting recommendations returned.</p>';
    return;
  }
  hostingList.innerHTML = recommendations
    .map((item) => {
      return `
        <article class="hosting-card report-searchable">
          <div class="hosting-topline">
            <h3>${escapeHtml(item.title)}</h3>
            <span class="priority-tag">${escapeHtml(item.priority)}</span>
          </div>
          <p>${escapeHtml(item.detail)}</p>
        </article>
      `;
    })
    .join("");
}

function showError(message) {
  agentState.textContent = "Needs attention";
  agentDetail.textContent = message;
  workStatus.textContent = "Needs attention";
  workDetail.textContent = message;
  llmOutput.textContent = message;
  posture.textContent = "Needs attention";
  summaryLine.textContent = message;
  scoreRing.style.setProperty("--score", 0);
  scoreValue.textContent = "--";

  const activeStep = traceList.querySelector(".trace-item.running");
  if (activeStep) {
    activeStep.classList.remove("running");
    activeStep.classList.add("error");
    activeStep.querySelector(".trace-detail").textContent = message;
  } else {
    appendErrorMessage(message);
  }

  runButton.disabled = false;
  runButton.classList.remove("is-running");
  runLabel.textContent = "Analyze";
  window.clearInterval(timer);
  scrollChatToBottom();
}

function appendErrorMessage(message) {
  const item = document.createElement("li");
  item.className = "chat-message assistant trace-item error";
  item.innerHTML = `
    <span class="message-avatar" aria-hidden="true">A</span>
    <div class="message-body">
      <p class="thinking-label">Needs attention</p>
      <p class="step-title">Analysis stopped</p>
      <p class="trace-detail">${escapeHtml(message)}</p>
    </div>
  `;
  traceList.appendChild(item);
}

function openReportModal() {
  if (!reportModal) return;
  reportModal.hidden = false;
  document.body.classList.add("modal-open");
  reportModal.querySelector(".modal-close")?.focus();
}

function closeReportModal() {
  if (!reportModal) return;
  reportModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function setReportNavReady(isReady) {
  if (!openReportButton) return;
  openReportButton.classList.toggle("is-ready", isReady);
  openReportButton.setAttribute("aria-disabled", "false");
}

function focusTargetInput() {
  form?.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => targetInput?.focus(), 220);
}

function scrollToLive() {
  traceList?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToWork() {
  workBoard?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function normalizeTargetInput(value) {
  const trimmed = String(value || "").trim();
  const repairedScheme = trimmed.replace(/^(https?):\/{3,}/i, (_, scheme) => `${scheme}://`);
  if (/^https?:\/\//i.test(repairedScheme)) return repairedScheme;
  return repairedScheme.replace(/^\/+/, "");
}

function filterReport(query) {
  const normalized = query.trim().toLowerCase();
  document.querySelectorAll(".report-searchable").forEach((card) => {
    const matches = !normalized || card.textContent.toLowerCase().includes(normalized);
    card.hidden = !matches;
  });
}

function updateElapsed() {
  if (!runStartedAt) return;
  elapsed.textContent = `${Math.max(0, Math.round(performance.now() - runStartedAt))} ms`;
}

function scrollChatToBottom() {
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateProgress() {
  const totalSteps = 7;
  const completed = Array.from(traceItems.values()).filter((item) =>
    item.classList.contains("complete"),
  ).length;
  const runningBonus = traceItems.size > completed ? 0.45 : 0;
  const progress = Math.min(100, Math.round(((completed + runningBonus) / totalSteps) * 100));
  progressBar.style.setProperty("--progress", `${progress}%`);
  workProgressLabel.textContent = `${progress}%`;
}

function installLocalPreviewHook() {
  if (!["127.0.0.1", "localhost"].includes(window.location.hostname)) return;
  const previewHash = "#aegisPreviewReport=";
  if (window.location.hash.startsWith(previewHash)) {
    try {
      const encodedReport = window.location.hash.slice(previewHash.length);
      renderReport(JSON.parse(decodeBase64Utf8(encodedReport)));
      openReportModal();
      window.history.replaceState(null, "", window.location.pathname);
    } catch (error) {
      console.warn("Invalid Aegis hash preview report.", error);
    }
  }
  try {
    const previewPayload = window.localStorage.getItem("aegisPreviewReport");
    if (previewPayload) {
      window.localStorage.removeItem("aegisPreviewReport");
      renderReport(JSON.parse(previewPayload));
      openReportModal();
    }
  } catch (error) {
    console.warn("Invalid Aegis preview report.", error);
  }
  document.addEventListener("aegis:preview-report", (event) => {
    if (!event.detail) return;
    renderReport(event.detail);
    openReportModal();
  });
  window.__aegisPreviewReport = (report) => {
    renderReport(report);
    openReportModal();
    return {
      findingCards: document.querySelectorAll(".direct-finding-card").length,
      supportCards: document.querySelectorAll(".direct-support-card").length,
      rawLength: llmOutput.textContent.length,
    };
  };
}

function decodeBase64Utf8(value) {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
