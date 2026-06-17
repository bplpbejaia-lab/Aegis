const form = document.querySelector("#audit-form");
const targetInput = document.querySelector("#target");
const authorizedInput = document.querySelector("#authorized");
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

window.addEventListener("DOMContentLoaded", () => {
  targetInput?.focus();
  setReportNavReady(false);
});

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
  agentDetail.textContent = "Preparing passive tools.";
  workStatus.textContent = "Running";
  workDetail.textContent = "Preparing passive tools.";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target,
        authorized: authorizedInput.checked,
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
        <p>Starting the live reasoning stream. Passive tools will appear here as they run.</p>
      </div>
    </li>
  `;

  factsPanel.innerHTML =
    '<p class="panel-placeholder">DNS, HTTP, TLS, and page facts will land here.</p>';
  findingsList.innerHTML = '<p class="panel-placeholder">No findings yet.</p>';
  hostingList.innerHTML =
    '<p class="panel-placeholder">Recommendations will be generated after analysis.</p>';
  llmOutput.textContent = "Waiting for structured synthesis.";
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
  renderMetrics(report.summary);
  renderFacts(report);
  renderFindings(report.vulnerabilities || []);
  renderHosting(report.hosting_recommendations || []);
  llmOutput.textContent = report.llm?.content || "No LLM content returned.";
  if (reportSearchInput) reportSearchInput.value = "";
  filterReport("");
}

function renderEmptyReport() {
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
  llmOutput.textContent = "The structured synthesis will appear after the first completed scan.";
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
