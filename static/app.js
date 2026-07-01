const form = document.querySelector("#audit-form");
const targetInput = document.querySelector("#target");
const authorizedInput = document.querySelector("#authorized");
const analysisEngineInput = document.querySelector("#analysis-engine");
const validationModeInput = document.querySelector("#validation-mode");
const proofAuthorizedInput = document.querySelector("#proof-authorized");
const proofConsentRow = document.querySelector("#proof-consent-row");
const runButton = document.querySelector("#run-button");
const runLabel = document.querySelector("#run-label");
const stopButton = document.querySelector("#stop-button");
const stopScanButtons = document.querySelectorAll("#stop-button, [data-stop-scan]");
const menuToggle = document.querySelector("#menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const authPanel = document.querySelector("#auth-panel");
const authModal = document.querySelector("#auth-modal");
const accountModal = document.querySelector("#account-modal");
const accountPanel = document.querySelector("#account-panel");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");
const signupPlanInput = document.querySelector("#signup-plan");
const accountPlanInput = document.querySelector("#account-plan");
const accountName = document.querySelector("#account-name");
const accountPlanLabel = document.querySelector("#account-plan-label");
const accountQuotaCard = document.querySelector("#account-quota-card");
const profileCard = document.querySelector("#profile-card");
const profileAvatar = document.querySelector("#profile-avatar");
const profileName = document.querySelector("#profile-name");
const profilePlan = document.querySelector("#profile-plan");
const sidebarQuota = document.querySelector("#sidebar-quota");
const workspaceHistory = document.querySelector("#workspace-history");
const aegisPreorderCard = document.querySelector("#aegis-preorder-card");
const aegisPreorderStatus = document.querySelector("#aegis-preorder-status");
const preorderModal = document.querySelector("#preorder-modal");
const preorderMessage = document.querySelector("#preorder-message");
const confirmAelyxPreorderButton = document.querySelector("#confirm-aegis-preorder");
const adminDashboard = document.querySelector("#admin-dashboard");
const refreshAdminDashboardButton = document.querySelector("#refresh-admin-dashboard");
const downloadDbDumpButton = document.querySelector("#download-db-dump");
const adminSummary = document.querySelector("#admin-summary");
const adminLiveRuns = document.querySelector("#admin-live-runs");
const adminLiveHumans = document.querySelector("#admin-live-humans");
const adminUsers = document.querySelector("#admin-users");
const adminPreorders = document.querySelector("#admin-preorders");
const adminRuns = document.querySelector("#admin-runs");
const adminVisitors = document.querySelector("#admin-visitors");
const adminCampaigns = document.querySelector("#admin-campaigns");
const adminSessions = document.querySelector("#admin-sessions");
const adminFunnel = document.querySelector("#admin-funnel");
const adminFunnelCampaigns = document.querySelector("#admin-funnel-campaigns");
const adminPeriodTabs = document.querySelectorAll("[data-admin-period]");
const adminPeriodNote = document.querySelector("#admin-period-note");
const adminProfileName = document.querySelector("#admin-profile-name");
const adminProfileMetrics = document.querySelector("#admin-profile-metrics");
const adminSignupRate = document.querySelector("#admin-signup-rate");
const adminTargetIntent = document.querySelector("#admin-target-intent");
const adminFocusChart = document.querySelector("#admin-focus-chart");
const adminMarketingBars = document.querySelector("#admin-marketing-bars");
const authMessage = document.querySelector("#auth-message");
const logoutButton = document.querySelector("#logout-button");
const sessionButton = document.querySelector("#session-button");
const googleSignin = document.querySelector("#google-signin");
const googleFallback = document.querySelector("#google-fallback");
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
const impactPanel = document.querySelector("#impact-panel");
const reportModal = document.querySelector("#report-modal");
const openReportButton = document.querySelector("#open-report");
const openAdminDashboardButton = document.querySelector("#open-admin-dashboard");
const navActions = document.querySelectorAll("[data-nav-target]");
const closeReportTriggers = document.querySelectorAll("[data-close-report]");
const closeAuthTriggers = document.querySelectorAll("[data-close-auth]");
const closeAccountTriggers = document.querySelectorAll("[data-close-account]");
const closePreorderTriggers = document.querySelectorAll("[data-close-preorder]");
const passwordToggles = document.querySelectorAll(".password-toggle");
const reportSearchInput = document.querySelector(".report-search input");
const thinkingModal = document.querySelector("#thinking-modal");
const closeThinkingTriggers = document.querySelectorAll("[data-close-thinking]");
const thinkingTitle = document.querySelector("#thinking-title");
const thinkingDetail = document.querySelector("#thinking-detail");
const thinkingTarget = document.querySelector("#thinking-target");
const thinkingEngine = document.querySelector("#thinking-engine");
const thinkingElapsed = document.querySelector("#thinking-elapsed");
const thinkingQuota = document.querySelector("#thinking-quota");
const thinkingProgressBar = document.querySelector("#thinking-progress-bar");
const thinkingStages = document.querySelector("#thinking-stages");
const thinkingPhase = document.querySelector("#thinking-phase");
const thinkingQuote = document.querySelector("#thinking-quote");
const thinkingExplain = document.querySelector("#thinking-explain");
const thinkingSignal = document.querySelector(".thinking-signal");

const traceItems = new Map();
const SESSION_KEY = "aegisSessionToken";
const VISITOR_HEARTBEAT_MS = 20000;
const ADMIN_REFRESH_MS = 15000;
const ADMIN_PATH = "/admin";
const ADMIN_PERIOD_LABELS = {
  day: "Rolling 24h",
  week: "Last 7 days",
  month: "Last 30 days",
  all: "All time",
};
const THINKING_MOOD_MS = 8200;
const THINKING_MOODS = [
  {
    phase: "Scope gate",
    title: "Checking permission",
    detail: "Confirming mode, target, and authorization before any deeper work.",
    quote: "Measure twice. Scan once.",
    explain: "A safe scan starts by proving the target and the allowed depth.",
  },
  {
    phase: "DNS map",
    title: "Mapping the edge",
    detail: "Resolving names and looking for the first public boundary.",
    quote: "Every surface starts with an address.",
    explain: "DNS, redirects, and final URLs help the report stay grounded.",
  },
  {
    phase: "HTTP signals",
    title: "Reading headers",
    detail: "Collecting status, redirects, content hints, and security headers.",
    quote: "Headers tell the first honest story.",
    explain: "The agent compares what the server says with what the browser receives.",
  },
  {
    phase: "TLS posture",
    title: "Checking transport",
    detail: "Looking at HTTPS, certificate shape, and secure delivery hints.",
    quote: "Trust begins before the page loads.",
    explain: "Transport evidence helps separate cosmetic risk from real exposure.",
  },
  {
    phase: "Page surface",
    title: "Inspecting the page",
    detail: "Reading forms, scripts, metadata, and visible app structure.",
    quote: "Small clues make strong findings.",
    explain: "The scan looks for user-facing inputs and exposed implementation details.",
  },
  {
    phase: "Risk lens",
    title: "Classifying signals",
    detail: "Grouping evidence into critical, high, medium, and low risk.",
    quote: "Noise is not a finding.",
    explain: "Only evidence that changes security posture should become a finding.",
  },
  {
    phase: "Proof mode",
    title: "Keeping it reversible",
    detail: "Staying within proof boundaries and avoiding destructive actions.",
    quote: "Proof should be clean.",
    explain: "Authorized validation still needs a controlled, reversible footprint.",
  },
  {
    phase: "Hosting fit",
    title: "Building fixes",
    detail: "Turning technical signals into practical hosting and hardening steps.",
    quote: "A good fix is one you can ship.",
    explain: "Recommendations are ranked by likely impact and setup effort.",
  },
  {
    phase: "Evidence pass",
    title: "Cross-checking notes",
    detail: "Comparing findings against the collected facts before final output.",
    quote: "Evidence beats guesses.",
    explain: "The report favors repeatable observations over vague warnings.",
  },
  {
    phase: "Report craft",
    title: "Writing the report",
    detail: "Preparing a readable summary, impact notes, and next actions.",
    quote: "Clear reports get fixed faster.",
    explain: "The last pass makes the output useful for both technical and business readers.",
  },
];
const DIRECT_STEP_IDS = new Set(["aegis_direct", "sheepstealer_direct"]);
const SCAN_STEP_META = {
  scope: {
    label: "Scope",
    runningTitle: "Checking scope",
    completeTitle: "Scope accepted",
    runningDetail: "Aelyx is confirming the URL, permission checkbox, selected engine, and quota before deeper work starts.",
  },
  dns: {
    label: "DNS",
    runningTitle: "Mapping DNS",
    completeTitle: "DNS mapped",
    runningDetail: "Resolving the hostname and checking that the target stays inside the allowed public boundary.",
  },
  http: {
    label: "HTTP",
    runningTitle: "Reading the site",
    completeTitle: "HTTP captured",
    runningDetail: "Fetching a bounded page sample, redirects, status code, and response headers.",
  },
  tls: {
    label: "TLS",
    runningTitle: "Checking HTTPS",
    completeTitle: "TLS checked",
    runningDetail: "Inspecting the certificate, negotiated protocol, and secure transport signals.",
  },
  surface: {
    label: "Surface",
    runningTitle: "Inspecting surface",
    completeTitle: "Surface mapped",
    runningDetail: "Checking DNS records, robots.txt, WordPress hints, public endpoints, and client asset integrity.",
  },
  agent_strategy: {
    label: "Strategy",
    runningTitle: "Scanning approach",
    completeTitle: "Scan approach ready",
    runningDetail: "Aelyx is deciding which risk paths, tools, and evidence matter most for this target.",
  },
  agent_toolbox: {
    label: "Tools",
    runningTitle: "Running chosen tools",
    completeTitle: "Tool evidence ready",
    runningDetail: "Executing authorized DNS, TLS, HTTP, CORS, crawl, JavaScript, API, CMS, and public exposure checks.",
  },
  evidence_fallback: {
    label: "Evidence",
    runningTitle: "Returning tool evidence",
    completeTitle: "Evidence report ready",
    runningDetail: "The analysis provider did not complete, so Aelyx is returning the collected evidence report.",
  },
  headers: {
    label: "Headers",
    runningTitle: "Classifying evidence",
    completeTitle: "Evidence classified",
    runningDetail: "Grouping headers, cookies, forms, scripts, and passive signals into findings.",
  },
  llm: {
    label: "Report",
    runningTitle: "Writing report",
    completeTitle: "Report drafted",
    runningDetail: "Turning the collected evidence into a readable risk summary and fix plan.",
  },
  aegis_direct: {
    label: "Aelyx",
    runningTitle: "Aelyx engine working",
    completeTitle: "Aelyx engine finished",
    runningDetail: "Aelyx is turning the strategy and tool evidence into the final report. This can take a few minutes.",
  },
  sheepstealer_direct: {
    label: "sheepstealer",
    runningTitle: "sheepstealer working",
    completeTitle: "sheepstealer finished",
    runningDetail: "The hosted engine is turning the strategy and tool evidence into the final report. This can take a few minutes when the provider is busy.",
  },
};
let runStartedAt = 0;
let timer = null;
let thinkingMoodTimer = null;
let thinkingMoodIndex = 0;
let thinkingHasServerStep = false;
let currentReport = null;
let currentUser = null;
let appConfig = { plans: [], google_client_id: "", proof_mode_launched: false };
let currentRunId = "";
let currentRunController = null;
let isStoppingRun = false;
let currentQuotaSummary = null;
let googleButtonRendered = false;
let googleInitTimer = null;
let adminDashboardData = null;
let adminSelectedPeriod = "day";
let visitorStartedAt = Date.now();
let visitorHeartbeatTimer = null;
let adminRefreshTimer = null;
let ctaViewedLogged = false;
let signupOpenedLogged = false;

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
window.addEventListener("load", initializeGoogleSignIn);

async function initializeApp() {
  targetInput?.focus();
  setReportNavReady(false);
  updateProofConsentVisibility();
  initializeCustomSelects();
  await loadConfig();
  await restoreSession();
  openAdminRouteIfNeeded();
  initializeGoogleSignIn();
  startVisitorHeartbeat();
  trackCtaViewed();
  installLocalPreviewHook();
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runAnalysis();
});

stopScanButtons.forEach((button) => {
  button.addEventListener("click", () => {
    stopCurrentRun();
  });
});

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  mobileMenu?.classList.toggle("is-open", !isOpen);
});

validationModeInput?.addEventListener("change", updateProofConsentVisibility);

sessionButton?.addEventListener("click", () => {
  if (currentUser?.is_admin) {
    openAdminDashboardPage();
  } else if (currentUser) {
    openAccountModal();
  } else {
    openAuthModal("login");
  }
});

profileCard?.addEventListener("click", () => {
  if (currentUser?.is_admin) {
    openAdminDashboardPage();
  } else if (currentUser) {
    openAccountModal();
  } else {
    openAuthModal("login");
  }
});

aegisPreorderCard?.addEventListener("click", () => {
  trackFunnelEvent("preorder_clicked", { source: "preorder_card" });
  openPreorderModal();
});

confirmAelyxPreorderButton?.addEventListener("click", () => {
  trackFunnelEvent("preorder_clicked", { source: "preorder_confirm" });
  preorderAelyxAccess();
});

workspaceHistory?.addEventListener("click", (event) => {
  const item = event.target.closest("[data-workspace-target]");
  if (!item) return;
  targetInput.value = item.dataset.workspaceTarget || "";
  if (item.dataset.workspaceEngine && analysisEngineInput) {
    analysisEngineInput.value = item.dataset.workspaceEngine;
    analysisEngineInput.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (item.dataset.workspaceMode && validationModeInput) {
    validationModeInput.value = item.dataset.workspaceMode;
    validationModeInput.dispatchEvent(new Event("change", { bubbles: true }));
    updateProofConsentVisibility();
  }
  focusTargetInput();
});

passwordToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => togglePasswordVisibility(toggle));
});

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchAuthTab(tab.dataset.authTab || "login"));
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  await authenticate("/api/auth/login", {
    username: formData.get("username"),
    password: formData.get("password"),
  });
});

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(signupForm);
  await authenticate("/api/auth/signup", {
    username: formData.get("username"),
    password: formData.get("password"),
    plan: signupPlanInput?.value || "free",
  });
});

accountPlanInput?.addEventListener("change", async () => {
  if (!currentUser || currentUser.is_admin) return;
  try {
    const data = await apiJson("/api/account/plan", {
      method: "POST",
      body: JSON.stringify({ plan: accountPlanInput.value }),
    });
    currentUser = data.user;
    renderSession();
  } catch (error) {
    showAuthMessage(error.message, true);
  }
});

refreshAdminDashboardButton?.addEventListener("click", () => {
  loadAdminDashboard();
});

downloadDbDumpButton?.addEventListener("click", () => {
  downloadAdminDbDump();
});

adminPeriodTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    adminSelectedPeriod = tab.dataset.adminPeriod || "day";
    renderAdminDashboard(adminDashboardData || {});
  });
});

logoutButton?.addEventListener("click", async () => {
  try {
    await apiJson("/api/auth/logout", { method: "POST" });
  } catch {
    // Local logout should still clear the browser session if the server is unavailable.
  }
  window.localStorage.removeItem(SESSION_KEY);
  currentUser = null;
  renderSession();
});

googleFallback?.addEventListener("click", () => {
  if (!appConfig.google_client_id) {
    showAuthMessage("Google sign-in is not configured.", true);
    return;
  }
  if (window.google?.accounts?.id && googleSignin && !googleButtonRendered) {
    initializeGoogleSignIn();
    return;
  }
  if (window.google?.accounts?.id) {
    window.google.accounts.id.prompt();
    showAuthMessage("Choose your Google account.", false);
    return;
  }
  showAuthMessage("Google sign-in is loading.", false);
});

openReportButton?.addEventListener("click", () => {
  if (currentReport) {
    openReportModal();
    return;
  }
  renderEmptyReport();
  openReportModal();
});

openAdminDashboardButton?.addEventListener("click", () => {
  openAdminDashboardPage();
});

navActions.forEach((action) => {
  action.addEventListener("click", () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    mobileMenu?.classList.remove("is-open");
    const target = action.dataset.navTarget;
    if (target === "work") scrollToWork();
    if (target === "live") scrollToLive();
  });
});

closeReportTriggers.forEach((trigger) => {
  trigger.addEventListener("click", closeReportModal);
});

closeAuthTriggers.forEach((trigger) => {
  trigger.addEventListener("click", closeAuthModal);
});

closeAccountTriggers.forEach((trigger) => {
  trigger.addEventListener("click", closeAccountModal);
});

closePreorderTriggers.forEach((trigger) => {
  trigger.addEventListener("click", closePreorderModal);
});

closeThinkingTriggers.forEach((trigger) => {
  trigger.addEventListener("click", hideThinkingModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeReportModal();
  closeAuthModal();
  closeAccountModal();
  closePreorderModal();
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

document.addEventListener("visibilitychange", () => {
  sendVisitorHeartbeat({ visible: !document.hidden, keepalive: true });
});

window.addEventListener("pagehide", () => {
  sendVisitorHeartbeat({ visible: false, keepalive: true });
});

reportSearchInput?.addEventListener("input", () => {
  filterReport(reportSearchInput.value);
});

async function loadConfig() {
  try {
    appConfig = await apiJson("/api/config", { auth: false });
    renderPlanOptions();
    enforceLockedSelections();
  } catch (error) {
    showAuthMessage(`Config unavailable: ${error.message}`, true);
  }
}

async function restoreSession() {
  const token = window.localStorage.getItem(SESSION_KEY);
  if (!token) {
    renderSession();
    return;
  }
  try {
    const data = await apiJson("/api/session");
    currentUser = data.authenticated ? data.user : null;
    if (!currentUser) window.localStorage.removeItem(SESSION_KEY);
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    currentUser = null;
  }
  renderSession();
}

async function authenticate(endpoint, payload) {
  try {
    const data = await apiJson(endpoint, {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload),
    });
    window.localStorage.setItem(SESSION_KEY, data.token);
    currentUser = data.user;
    renderSession();
    closeAuthModal();
    openAdminRouteIfNeeded();
    showAuthMessage(
      endpoint.includes("signup")
        ? "Account created."
        : "Signed in.",
      false,
    );
  } catch (error) {
    showAuthMessage(error.message, true);
  }
}

async function apiJson(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (options.auth !== false) {
    const token = window.localStorage.getItem(SESSION_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || `HTTP ${response.status}`);
  }
  return data;
}

function startVisitorHeartbeat() {
  if (visitorHeartbeatTimer) window.clearInterval(visitorHeartbeatTimer);
  sendVisitorHeartbeat({ visible: !document.hidden });
  visitorHeartbeatTimer = window.setInterval(() => {
    sendVisitorHeartbeat({ visible: !document.hidden });
  }, VISITOR_HEARTBEAT_MS);
}

function sendVisitorHeartbeat({ visible = true, keepalive = false } = {}) {
  const payload = {
    path: `${window.location.pathname}${window.location.search}`,
    title: document.title || "",
    visible,
    duration_seconds: Math.max(0, Math.round((Date.now() - visitorStartedAt) / 1000)),
  };
  fetch("/api/visitor/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive,
  }).catch(() => {});
}

function trackCtaViewed() {
  if (ctaViewedLogged) return;
  ctaViewedLogged = true;
  trackFunnelEvent("cta_viewed", { source: "target_console" });
}

function trackSignupOpened(source = "auth_modal") {
  if (signupOpenedLogged) return;
  signupOpenedLogged = true;
  trackFunnelEvent("signup_opened", { source });
}

function trackFunnelEvent(eventName, metadata = {}, { keepalive = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = window.localStorage.getItem(SESSION_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  const payload = {
    event_name: eventName,
    path: `${window.location.pathname}${window.location.search}`,
    target: targetInput?.value?.trim() || "",
    engine: analysisEngineInput?.value || "",
    validation_mode: validationModeInput?.value || "",
    metadata,
  };
  return fetch("/api/funnel", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    keepalive,
  }).catch(() => {});
}

function switchAuthTab(tabName) {
  const isSignup = tabName === "signup";
  if (isSignup) trackSignupOpened("auth_tab");
  authTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.authTab === tabName);
  });
  if (loginForm) loginForm.hidden = isSignup;
  if (signupForm) signupForm.hidden = !isSignup;
}

function renderPlanOptions() {
  const plans = appConfig.plans || [];
  const optionHtml = plans
    .map((plan) => {
      const limits = plan.limits || {};
      const aegis = formatLimit(limits.aegis);
      const sheepstealer = formatLimit(limits.sheepstealer);
      return `<option value="${escapeHtml(plan.id)}">${escapeHtml(plan.label)} - Aelyx ${escapeHtml(aegis)}, sheepstealer ${escapeHtml(sheepstealer)}</option>`;
    })
    .join("");
  if (signupPlanInput) {
    signupPlanInput.innerHTML = optionHtml;
    signupPlanInput.value = plans.some((plan) => plan.id === "free")
      ? "free"
      : plans[0]?.id || "free";
  }
  if (accountPlanInput) accountPlanInput.innerHTML = optionHtml;
}

function formatLimit(limit) {
  if (!limit) return "0";
  if (limit.limit === null || limit.period === "unlimited") return "unlimited";
  return `${limit.limit}/${limit.period}`;
}

function hasAelyxPlanAccess() {
  if (currentUser?.is_admin) return true;
  return currentUser?.plan?.id === "pro_3";
}

function isProofModeLocked() {
  return false;
}

function isAelyxEngineLocked() {
  return !hasAelyxPlanAccess();
}

function isLockedSelectOption(select, value) {
  if (!select) return false;
  if (select.id === "analysis-engine" && value === "aegis") return isAelyxEngineLocked();
  return false;
}

function handleLockedSelectOption(select, shell) {
  syncCustomSelect(shell);
  closeCustomSelect(shell);
  if (select?.id === "analysis-engine") {
    showError("Aelyx unlocks after account setup.");
  }
  if (currentUser) {
    openPreorderModal();
  } else {
    openAuthModal("signup");
  }
}

function enforceLockedSelections() {
  if (analysisEngineInput?.value === "aegis" && isAelyxEngineLocked()) {
    analysisEngineInput.value = "sheepstealer";
  }
  syncAllCustomSelects();
  updateProofConsentVisibility();
}

function initializeCustomSelects() {
  document.querySelectorAll(".select-shell select").forEach((select) => {
    const shell = select.closest(".select-shell");
    if (!shell || shell.querySelector(".custom-select")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "custom-select";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");

    const menu = document.createElement("div");
    menu.className = "custom-select-menu";
    menu.setAttribute("role", "listbox");
    menu.hidden = true;

    Array.from(select.options).forEach((option) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "custom-select-option";
      item.setAttribute("role", "option");
      item.dataset.value = option.value;
      if (isLockedSelectOption(select, option.value)) {
        item.classList.add("is-locked");
      }
      item.textContent = option.textContent;
      item.addEventListener("click", () => {
        if (isLockedSelectOption(select, option.value)) {
          handleLockedSelectOption(select, shell);
          return;
        }
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        syncCustomSelect(shell);
        closeCustomSelect(shell);
      });
      menu.appendChild(item);
    });

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = !menu.hidden;
      closeAllCustomSelects();
      if (!isOpen) openCustomSelect(shell);
    });

    select.addEventListener("change", () => syncCustomSelect(shell));
    shell.append(button, menu);
    syncCustomSelect(shell);
  });
}

function syncCustomSelect(shell) {
  const select = shell?.querySelector("select");
  const button = shell?.querySelector(".custom-select");
  const menu = shell?.querySelector(".custom-select-menu");
  if (!select || !button || !menu) return;
  const selected = select.options[select.selectedIndex];
  button.textContent = selected?.textContent || "";
  menu.querySelectorAll(".custom-select-option").forEach((item) => {
    const isSelected = item.dataset.value === select.value;
    const isLocked = isLockedSelectOption(select, item.dataset.value);
    item.classList.toggle("is-selected", isSelected);
    item.classList.toggle("is-locked", isLocked);
    item.setAttribute("aria-selected", String(isSelected));
    item.dataset.locked = String(isLocked);
  });
}

function openCustomSelect(shell) {
  const button = shell?.querySelector(".custom-select");
  const menu = shell?.querySelector(".custom-select-menu");
  if (!button || !menu) return;
  menu.hidden = false;
  button.setAttribute("aria-expanded", "true");
  shell.classList.add("is-open");
}

function closeCustomSelect(shell) {
  const button = shell?.querySelector(".custom-select");
  const menu = shell?.querySelector(".custom-select-menu");
  if (!button || !menu) return;
  menu.hidden = true;
  button.setAttribute("aria-expanded", "false");
  shell.classList.remove("is-open");
}

function closeAllCustomSelects() {
  document.querySelectorAll(".select-shell.is-open").forEach((shell) => closeCustomSelect(shell));
}

function syncAllCustomSelects() {
  document.querySelectorAll(".select-shell").forEach((shell) => syncCustomSelect(shell));
}

document.addEventListener("click", closeAllCustomSelects);

function renderSession() {
  const signedIn = Boolean(currentUser);
  if (sessionButton) {
    sessionButton.textContent = signedIn
      ? `${currentUser.username}${currentUser.is_admin ? " / admin" : ""}`
      : "Account";
    sessionButton.classList.toggle("is-authenticated", signedIn);
  }
  if (openAdminDashboardButton) {
    openAdminDashboardButton.hidden = !currentUser?.is_admin;
  }
  renderProfileCard();
  renderAelyxPreorderState();
  enforceLockedSelections();
  if (!signedIn) {
    closeAccountModal();
    if (adminDashboard) adminDashboard.hidden = true;
    accountModal?.classList.remove("is-admin-page");
    stopAdminDashboardRefresh();
    showAuthMessage("Free scan works without sign-in.", false);
    loadAccountQuota();
    renderWorkspaceHistory([]);
    return;
  }
  const plan = currentUser.plan || {};
  if (accountName) accountName.textContent = currentUser.username;
  if (accountPlanLabel) accountPlanLabel.textContent = currentUser.is_admin ? "Unlimited" : plan.label;
  if (accountPlanInput) {
    accountPlanInput.value = plan.id === "admin" ? "pro_3" : plan.id;
    accountPlanInput.disabled = Boolean(currentUser.is_admin);
  }
  if (adminDashboard) adminDashboard.hidden = true;
  loadAccountQuota();
  loadWorkspaceHistory();
  if (currentUser.is_admin) loadAdminDashboard();
  if (!currentUser.is_admin) stopAdminDashboardRefresh();
}

function renderProfileCard() {
  const signedIn = Boolean(currentUser);
  const username = signedIn ? currentUser.username : "Guest";
  const plan = currentUser?.is_admin ? "Admin" : currentUser?.plan?.label || "Free ready";
  if (profileName) profileName.textContent = username;
  if (profilePlan) profilePlan.textContent = plan;
  if (profileAvatar) profileAvatar.textContent = (username || "A").slice(0, 1).toUpperCase();
  profileCard?.classList.toggle("is-authenticated", signedIn);
}

function renderAelyxPreorderState() {
  const isRegistered = Boolean(currentUser?.aegis_waitlist_at);
  if (aegisPreorderStatus) {
    aegisPreorderStatus.textContent = isRegistered
      ? "Reserved"
      : "Launch perks";
  }
  aegisPreorderCard?.classList.toggle("is-registered", isRegistered);
  if (confirmAelyxPreorderButton) {
    confirmAelyxPreorderButton.textContent = isRegistered ? "Reserved" : "Reserve Aelyx";
    confirmAelyxPreorderButton.disabled = isRegistered;
  }
  if (preorderMessage) {
    preorderMessage.textContent = isRegistered
      ? "Aelyx access is reserved."
      : "Default: sheepstealer.";
    preorderMessage.classList.remove("error");
  }
}

async function loadAccountQuota() {
  try {
    currentQuotaSummary = await apiJson("/api/account/quota");
    renderQuotaSummary(currentQuotaSummary);
  } catch {
    renderQuotaSummary(null);
  }
}

function renderQuotaSummary(summary) {
  if (!currentUser) {
    const sheep = summary?.quotas?.sheepstealer;
    const quotaLabel = sheep ? `${sheep.remaining}/${sheep.limit} left` : "1 free scan";
    if (sidebarQuota) sidebarQuota.textContent = `Guest: ${quotaLabel} today`;
    renderAccountQuotaCard("Guest quota", quotaLabel, "Sign in to save scans.");
    return;
  }
  if (currentUser.is_admin) {
    if (sidebarQuota) sidebarQuota.textContent = "Quota: unlimited admin";
    renderAccountQuotaCard("Quota left", "Unlimited", "Admin tester access is active.");
    return;
  }
  const sheep = summary?.quotas?.sheepstealer;
  if (sheep?.limit === null) {
    if (sidebarQuota) sidebarQuota.textContent = "sheepstealer: unlimited";
    renderAccountQuotaCard("sheepstealer quota", "Unlimited", "No daily cap on the current plan.");
    return;
  }
  if (sheep) {
    const quotaLabel = `${sheep.remaining}/${sheep.limit} left`;
    if (sidebarQuota) sidebarQuota.textContent = `sheepstealer: ${quotaLabel} ${sheep.period}`;
    renderAccountQuotaCard("sheepstealer quota", quotaLabel, `Resets every ${sheep.period}.`);
    return;
  }
  if (sidebarQuota) sidebarQuota.textContent = "sheepstealer quota loading";
  renderAccountQuotaCard("Quota left", "Loading", "Refreshing account usage.");
}

function renderAccountQuotaCard(label, value, detail) {
  if (!accountQuotaCard) return;
  accountQuotaCard.innerHTML = `
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    <small>${escapeHtml(detail)}</small>
  `;
}

async function loadWorkspaceHistory() {
  if (!currentUser) {
    renderWorkspaceHistory([]);
    return;
  }
  try {
    const data = await apiJson("/api/account/runs?limit=6");
    renderWorkspaceHistory(data.runs || []);
  } catch {
    renderWorkspaceHistory([]);
  }
}

function renderWorkspaceHistory(runs) {
  if (!workspaceHistory) return;
  if (!currentUser) {
    workspaceHistory.innerHTML = '<li class="workspace-empty">Sign in to save scans.</li>';
    return;
  }
  if (!runs.length) {
    workspaceHistory.innerHTML = '<li class="workspace-empty">No scans yet. Run your first target.</li>';
    return;
  }
  workspaceHistory.innerHTML = runs
    .map((run) => {
      const target = run.target || "";
      const host = compactUrl(target);
      const status = run.status || "queued";
      const score = Number(run.score || 0);
      const scoreLabel = score ? `${score}` : status;
      return `
        <li>
          <button
            type="button"
            data-workspace-target="${escapeHtml(target)}"
            data-workspace-engine="${escapeHtml(run.engine || "sheepstealer")}"
            data-workspace-mode="${escapeHtml(run.validation_mode || "proof")}"
          >
            <span class="workspace-dot status-${escapeHtml(status)}"></span>
            <span class="workspace-copy">
              <strong>${escapeHtml(host || target || "Target")}</strong>
              <small>${escapeHtml(run.engine || "engine")} / ${escapeHtml(relativeTime(run.updated_at || run.started_at))}</small>
            </span>
            <em>${escapeHtml(scoreLabel)}</em>
          </button>
        </li>
      `;
    })
    .join("");
}

function togglePasswordVisibility(toggle) {
  const field = toggle.closest(".password-field");
  const input = field?.querySelector("input");
  if (!input) return;
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  toggle.setAttribute("aria-pressed", String(isHidden));
  toggle.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
}

function openPreorderModal() {
  if (!currentUser) {
    openAuthModal("signup");
    showAuthMessage("Sign in first to reserve Aelyx.", false);
    return;
  }
  closeAuthModal();
  closeAccountModal();
  if (!preorderModal) return;
  renderAelyxPreorderState();
  preorderModal.hidden = false;
  document.body.classList.add("modal-open");
  resetModalScroll(preorderModal);
}

function closePreorderModal() {
  if (!preorderModal) return;
  preorderModal.hidden = true;
  if (reportModal?.hidden !== false && authModal?.hidden !== false && accountModal?.hidden !== false) {
    document.body.classList.remove("modal-open");
  }
}

async function preorderAelyxAccess() {
  if (!currentUser) {
    openAuthModal("signup");
    return;
  }
  if (confirmAelyxPreorderButton) confirmAelyxPreorderButton.disabled = true;
  try {
    const data = await apiJson("/api/account/aegis-preorder", { method: "POST" });
    currentUser = data.user;
    renderSession();
    renderAelyxPreorderState();
  } catch (error) {
    if (preorderMessage) {
      preorderMessage.textContent = error.message;
      preorderMessage.classList.add("error");
    }
    if (confirmAelyxPreorderButton) confirmAelyxPreorderButton.disabled = false;
  }
}

function openAuthModal(tab = "login") {
  switchAuthTab(tab);
  closeAccountModal();
  if (!authModal) return;
  authModal.hidden = false;
  document.body.classList.add("modal-open");
  resetModalScroll(authModal);
  window.setTimeout(() => {
    const selector =
      tab === "signup"
        ? '#signup-form input[name="username"]'
        : '#login-form input[name="username"]';
    authModal.querySelector(selector)?.focus();
  }, 40);
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.hidden = true;
  if (reportModal?.hidden !== false && accountModal?.hidden !== false) {
    document.body.classList.remove("modal-open");
  }
}

function openAccountModal() {
  closeAuthModal();
  if (!accountModal) return;
  accountModal.classList.remove("is-admin-page");
  accountModal.hidden = false;
  if (adminDashboard) adminDashboard.hidden = true;
  document.body.classList.add("modal-open");
  resetModalScroll(accountModal);
  accountPlanInput?.focus();
  if (currentUser?.is_admin) {
    loadAdminDashboard();
    startAdminDashboardRefresh();
  }
}

function openAdminRouteIfNeeded() {
  if (window.location.pathname !== ADMIN_PATH) return;
  if (currentUser?.is_admin) {
    openAdminDashboardPage({ updateHistory: false });
    return;
  }
  openAuthModal("login");
}

function leaveAdminRouteIfNeeded() {
  if (window.location.pathname === ADMIN_PATH) {
    window.history.pushState(null, "", "/");
  }
}

function openAdminDashboardPage({ updateHistory = true } = {}) {
  if (!currentUser?.is_admin || !accountModal || !adminDashboard) {
    if (!currentUser) openAuthModal("login");
    return;
  }
  if (updateHistory && window.location.pathname !== ADMIN_PATH) {
    window.history.pushState(null, "", ADMIN_PATH);
  }
  closeAuthModal();
  closeReportModal();
  closePreorderModal();
  accountModal.classList.add("is-admin-page");
  accountModal.hidden = false;
  adminDashboard.hidden = false;
  document.body.classList.add("modal-open");
  resetModalScroll(accountModal);
  loadAdminDashboard();
  startAdminDashboardRefresh();
  refreshAdminDashboardButton?.focus();
}

function closeAccountModal() {
  if (!accountModal) return;
  const wasAdminPage = accountModal.classList.contains("is-admin-page");
  accountModal.hidden = true;
  accountModal.classList.remove("is-admin-page");
  stopAdminDashboardRefresh();
  if (wasAdminPage) leaveAdminRouteIfNeeded();
  if (reportModal?.hidden !== false && authModal?.hidden !== false) {
    document.body.classList.remove("modal-open");
  }
}

function startAdminDashboardRefresh() {
  if (!currentUser?.is_admin || adminRefreshTimer) return;
  adminRefreshTimer = window.setInterval(() => {
    if (accountModal?.hidden === false) loadAdminDashboard({ silent: true });
  }, ADMIN_REFRESH_MS);
}

function stopAdminDashboardRefresh() {
  if (!adminRefreshTimer) return;
  window.clearInterval(adminRefreshTimer);
  adminRefreshTimer = null;
}

async function loadAdminDashboard({ silent = false } = {}) {
  if (!currentUser?.is_admin || !adminDashboard) return;
  if (!silent || !adminDashboardData) setAdminLoading();
  try {
    const data = await apiJson("/api/admin/dashboard");
    renderAdminDashboard(data);
  } catch (error) {
    if (adminSummary) {
      adminSummary.innerHTML = `<p class="admin-empty">${escapeHtml(error.message)}</p>`;
    }
  }
}

async function downloadAdminDbDump() {
  if (!currentUser?.is_admin || !downloadDbDumpButton) return;
  const originalText = downloadDbDumpButton.textContent;
  downloadDbDumpButton.disabled = true;
  downloadDbDumpButton.textContent = "Preparing...";
  try {
    const data = await apiJson("/api/admin/db-dump?limit=0");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aelyx-db-dump-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showAuthMessage("DB dump downloaded.", false);
  } catch (error) {
    showAuthMessage(error.message, true);
  } finally {
    downloadDbDumpButton.disabled = false;
    downloadDbDumpButton.textContent = originalText;
  }
}

function setAdminLoading() {
  if (adminSummary) adminSummary.innerHTML = '<p class="admin-empty">Loading dashboard...</p>';
  if (adminLiveRuns) adminLiveRuns.innerHTML = "";
  if (adminLiveHumans) adminLiveHumans.innerHTML = "";
  if (adminUsers) adminUsers.innerHTML = "";
  if (adminPreorders) adminPreorders.innerHTML = "";
  if (adminRuns) adminRuns.innerHTML = "";
  if (adminVisitors) adminVisitors.innerHTML = "";
  if (adminCampaigns) adminCampaigns.innerHTML = "";
  if (adminSessions) adminSessions.innerHTML = "";
  if (adminFunnel) adminFunnel.innerHTML = "";
  if (adminFunnelCampaigns) adminFunnelCampaigns.innerHTML = "";
}

function renderAdminDashboard(data) {
  adminDashboardData = data || adminDashboardData || {};
  const dashboard = adminDashboardData || {};
  const insights = selectedAdminInsights(dashboard);
  const funnel = selectedAdminFunnel(dashboard);
  const sessionStats = insights.session_stats || {};
  const summary = dashboard.summary || {};
  const visitors = insights.visitors || [];
  renderAdminPeriodTabs();
  renderAdminVisuals(dashboard, insights, funnel);
  if (adminSummary) {
    adminSummary.innerHTML = [
      ["Runs", summary.runs || 0],
      ["Live", summary.live_runs || 0],
      ["Users", summary.user_accounts || 0],
      ["Pre", summary.preorders || 0],
      ["Humans", sessionStats.session_visitors || summary.unique_visitors || 0],
      ["Signups", sessionStats.signed_up_visitors || 0],
      ["Visits", sessionStats.sessions || summary.visitor_sessions || 0],
      ["Guests", sessionStats.external_visitors || 0],
      ["Time", formatDuration((sessionStats.avg_duration_seconds || 0) * 1000)],
      ["Engaged", sessionStats.engaged_sessions || 0],
      ["Conv", sessionStats.preorder_conversions || 0],
      ["Noise", summary.filtered_noise_sessions || 0],
    ]
      .map(
        ([label, value]) => `
          <div class="admin-stat">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `,
      )
      .join("");
  }
  renderAdminTable(
    adminLiveRuns,
    dashboard.live_runs || [],
    ["User", "Target", "Engine", "Status", "Updated"],
    (run) => [
      run.username,
      compactUrl(run.target),
      run.engine,
      run.status,
      relativeTime(run.updated_at),
    ],
    "No live runs.",
  );
  renderAdminHumanBoard(adminLiveHumans, visitors, insights.sessions || []);
  renderAdminUsers(adminUsers, dashboard.users || []);
  renderAdminTable(
    adminPreorders,
    dashboard.preorders || [],
    ["Reserved", "User", "Email", "Plan", "Provider"],
    (user) => [
      relativeTime(user.aegis_waitlist_at),
      user.username,
      user.email || "-",
      user.is_admin ? "admin" : user.plan,
      user.provider,
    ],
    "No Aelyx pre-registrations yet.",
  );
  renderAdminTable(
    adminRuns,
    dashboard.recent_runs || [],
    ["When", "User", "Target", "Engine", "Mode", "Status", "Score", "Duration"],
    (run) => [
      relativeTime(run.started_at),
      run.username,
      compactUrl(run.target),
      run.engine,
      run.validation_mode,
      run.status,
      run.score || 0,
      formatDuration(run.duration_ms),
    ],
    "No run history yet.",
  );
  renderAdminVisitorCards(adminVisitors, visitors, insights.sessions || []);
  renderAdminTable(
    adminCampaigns,
    insights.campaigns || [],
    ["Source", "Medium", "Campaign", "Sessions", "Visitors", "Pages", "Avg time", "Signups", "Conv.", "Targets"],
    (campaign) => [
      campaign.source || "direct",
      campaign.medium || "none",
      campaign.campaign || "none",
      campaign.sessions || 0,
      campaign.visitors || 0,
      campaign.page_views || 0,
      formatDuration((campaign.avg_duration_seconds || 0) * 1000),
      campaign.signups || 0,
      campaign.conversions || 0,
      campaign.targets || 0,
    ],
    "No campaign data in this period.",
  );
  renderAdminTable(
    adminFunnel,
    funnel.events || [],
    ["Event", "Events", "Visitors"],
    (item) => [
      formatFunnelEvent(item.event_name),
      item.events || 0,
      item.visitors || 0,
    ],
    "No funnel events in this period.",
  );
  renderAdminTable(
    adminFunnelCampaigns,
    funnel.campaigns || [],
    ["Source", "Medium", "Campaign", "Event", "Events", "Visitors"],
    (item) => [
      item.source || "direct",
      item.medium || "none",
      item.campaign || "none",
      formatFunnelEvent(item.event_name),
      item.events || 0,
      item.visitors || 0,
    ],
    "No funnel campaign data in this period.",
  );
  renderAdminTable(
    adminSessions,
    insights.sessions || [],
    ["Seen", "Visitor", "Landing", "Last page", "Pages", "Time", "Source", "Pre-reg"],
    (session) => [
      relativeTime(session.last_seen_at),
      shortVisitorId(session.visitor_id),
      compactPath(session.landing_path),
      compactPath(session.last_path),
      session.page_views || 0,
      formatDuration((session.duration_seconds || 0) * 1000),
      visitorSource(session),
      Number(session.converted_preorder || 0) ? "yes" : "no",
    ],
    "No visitor sessions in this period.",
  );
}

function renderAdminHumanBoard(container, visitors, sessions) {
  if (!container) return;
  visitors = Array.isArray(visitors) ? visitors : [];
  const liveVisitors = visitors.filter(isLiveVisitor).slice(0, 8);
  if (!liveVisitors.length) {
    container.innerHTML = '<p class="admin-empty">No humans live right now.</p>';
    return;
  }
  container.innerHTML = `
    <div class="admin-live-strip">
      ${liveVisitors.map((visitor) => renderAdminHumanCard(visitor, sessions, true)).join("")}
    </div>
  `;
}

function renderAdminUsers(container, users) {
  if (!container) return;
  users = Array.isArray(users) ? users : [];
  if (!users.length) {
    container.innerHTML = '<p class="admin-empty">No users yet.</p>';
    return;
  }
  container.innerHTML = users
    .slice(0, 60)
    .map((user) => {
      const targets = normalizeList(user.targets).slice(0, 3);
      return `
        <article class="admin-user-card">
          <div class="admin-user-top">
            <span class="admin-user-avatar" aria-hidden="true">${escapeHtml(userInitials(user))}</span>
            <div>
              <strong>${escapeHtml(user.username || "user")}</strong>
              <span>${escapeHtml(user.email || user.provider || "local")}</span>
            </div>
            <i>${escapeHtml(user.is_admin ? "admin" : user.plan || "free")}</i>
          </div>
          <div class="admin-human-meta">
            <span>${escapeHtml(user.run_count || 0)} scans</span>
            <span>${escapeHtml(user.linked_human_visitors || 0)} humans</span>
            <span>${escapeHtml(user.aegis_waitlist_at ? "pre-reg" : "no pre-reg")}</span>
          </div>
          <dl class="admin-human-details">
            <div><dt>Signup</dt><dd>${escapeHtml(relativeTime(user.created_at))}</dd></div>
            <div><dt>Seen</dt><dd>${escapeHtml(relativeTime(user.visit_last_seen_at || user.auth_last_seen_at))}</dd></div>
            <div><dt>Last target</dt><dd>${escapeHtml(compactUrl(user.last_target || "none"))}</dd></div>
          </dl>
          <ol class="admin-human-history">
            ${
              targets.length
                ? targets.map((target) => `<li><strong>${escapeHtml(compactUrl(target))}</strong><span>target tried</span></li>`).join("")
                : '<li><strong>No target yet</strong><span>no scan linked</span></li>'
            }
          </ol>
        </article>
      `;
    })
    .join("");
}

function renderAdminVisuals(dashboard, insights, funnel) {
  const stats = insights?.session_stats || {};
  const campaigns = insights?.campaigns || [];
  const visitors = insights?.visitors || [];
  const humans = Number(stats.session_visitors || dashboard?.summary?.unique_visitors || 0);
  const signups = Number(stats.signed_up_visitors || 0);
  const visits = Number(stats.sessions || dashboard?.summary?.visitor_sessions || 0);
  const targets = visitors.reduce((total, visitor) => total + Number(visitor.target_attempt_count || 0), 0);
  const signupRate = humans ? Math.round((signups / humans) * 100) : 0;
  if (adminProfileName) adminProfileName.textContent = currentUser?.username || "Admin";
  if (adminProfileMetrics) {
    adminProfileMetrics.innerHTML = [
      ["Humans", humans],
      ["Signups", signups],
      ["Targets", targets],
    ]
      .map(([label, value]) => `<span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(label)}</small></span>`)
      .join("");
  }
  if (adminSignupRate) adminSignupRate.textContent = `${signupRate}%`;
  if (adminTargetIntent) adminTargetIntent.textContent = String(targets);
  renderAdminFocusChart(visits, signups, targets, funnel?.events || []);
  renderAdminMarketingBars(campaigns);
}

function renderAdminFocusChart(visits, signups, targets, events) {
  if (!adminFocusChart) return;
  const eventTotal = (events || []).reduce((total, item) => total + Number(item.events || 0), 0);
  const values = [visits, Math.max(1, eventTotal), signups, targets].map((value) => Number(value || 0));
  const max = Math.max(1, ...values);
  const redPoints = values.map((value, index) => chartPoint(index, value, max, 42));
  const bluePoints = [targets, signups, visits, eventTotal].map((value, index) => chartPoint(index, value, max, 58));
  adminFocusChart.innerHTML = `
    <svg viewBox="0 0 420 160" role="img" aria-label="Human traffic chart">
      <defs>
        <pattern id="adminDots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill="rgba(17,17,17,.12)" />
        </pattern>
      </defs>
      <rect width="420" height="160" rx="22" fill="url(#adminDots)" />
      <path d="${smoothPath(redPoints)}" fill="none" stroke="#ff6b6b" stroke-width="4" stroke-linecap="round" />
      <path d="${smoothPath(bluePoints)}" fill="none" stroke="#4d7cff" stroke-width="4" stroke-linecap="round" />
      ${redPoints.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="5" fill="#fff" stroke="#ff6b6b" stroke-width="3" />`).join("")}
      <text x="24" y="140" fill="#888" font-size="12">Visits</text>
      <text x="160" y="140" fill="#888" font-size="12">Intent</text>
      <text x="285" y="140" fill="#888" font-size="12">Signup</text>
      <text x="360" y="140" fill="#888" font-size="12">Target</text>
    </svg>
  `;
}

function chartPoint(index, value, max, bias) {
  const x = 42 + index * 112;
  const y = 124 - Math.round((Number(value || 0) / max) * 84) + (index % 2 ? bias - 50 : 0);
  return { x, y: Math.max(22, Math.min(126, y)) };
}

function smoothPath(points) {
  if (!points.length) return "";
  return points
    .map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`)
    .join(" ");
}

function renderAdminMarketingBars(campaigns) {
  if (!adminMarketingBars) return;
  campaigns = Array.isArray(campaigns) ? campaigns.slice(0, 5) : [];
  if (!campaigns.length) {
    adminMarketingBars.innerHTML = '<p class="admin-empty">No marketing data.</p>';
    return;
  }
  const max = Math.max(1, ...campaigns.map((campaign) => Number(campaign.visitors || campaign.sessions || 0)));
  adminMarketingBars.innerHTML = campaigns
    .map((campaign) => {
      const value = Number(campaign.signups || campaign.visitors || campaign.sessions || 0);
      const width = Math.max(8, Math.round((value / max) * 100));
      return `
        <div class="admin-marketing-row">
          <span>${escapeHtml(campaign.source || "direct")}</span>
          <i><b style="width:${width}%"></b></i>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `;
    })
    .join("");
}

function renderAdminVisitorCards(container, visitors, sessions) {
  if (!container) return;
  visitors = Array.isArray(visitors) ? visitors : [];
  if (!visitors.length) {
    container.innerHTML = '<p class="admin-empty">No visitors in this period.</p>';
    return;
  }
  container.innerHTML = `
    <div class="admin-visitor-grid">
      ${visitors.slice(0, 24).map((visitor) => renderAdminHumanCard(visitor, sessions, false)).join("")}
    </div>
  `;
}

function renderAdminHumanCard(visitor, sessions, compact = false) {
  const live = isLiveVisitor(visitor);
  const history = visitorHistoryItems(visitor, sessions, compact ? 2 : 3);
  return `
    <article class="admin-human-card ${live ? "is-live" : ""}">
      <div class="admin-human-top">
        <span class="admin-human-avatar" aria-hidden="true">${escapeHtml(visitorAvatarLabel(visitor))}</span>
        <div>
          <strong>${escapeHtml(shortVisitorId(visitor.visitor_id))}</strong>
          <span>${escapeHtml(live ? "Live now" : `Seen ${relativeTime(visitor.last_seen_at)}`)}</span>
        </div>
        <i>${escapeHtml(visitorEntryLabel(visitor))}</i>
      </div>
      <div class="admin-human-meta">
        <span>${escapeHtml(visitor.sessions || 0)} sessions</span>
        <span>${escapeHtml(visitor.page_views || 0)} pages</span>
        <span>${escapeHtml(formatDuration((visitor.max_duration_seconds || visitor.avg_duration_seconds || 0) * 1000))}</span>
        <span>${escapeHtml(Number(visitor.signed_up || 0) ? "signed up" : "no signup")}</span>
        <span>${escapeHtml(visitor.target_attempt_count || 0)} targets</span>
      </div>
      <dl class="admin-human-details">
        <div><dt>Signup</dt><dd>${escapeHtml(visitorSignupLabel(visitor))}</dd></div>
        <div><dt>Where</dt><dd>${escapeHtml(visitorRegion(visitor))}</dd></div>
        <div><dt>Device</dt><dd>${escapeHtml(visitorDevice(visitor))}</dd></div>
        <div><dt>Source</dt><dd>${escapeHtml(visitorSource(visitor))}</dd></div>
      </dl>
      ${renderTargetAttempts(visitor)}
      <ol class="admin-human-history">
        ${history.map((item) => `
          <li>
            <strong>${escapeHtml(compactPath(item.landing_path))}</strong>
            <span>${escapeHtml(compactPath(item.last_path))} / ${escapeHtml(relativeTime(item.last_seen_at))}</span>
          </li>
        `).join("")}
      </ol>
    </article>
  `;
}

function renderTargetAttempts(visitor) {
  const targets = normalizeList(visitor?.target_attempts).slice(0, 4);
  if (!targets.length) return "";
  return `
    <ol class="admin-target-list" aria-label="Targets tried">
      ${targets.map((target) => `<li>${escapeHtml(compactUrl(target))}</li>`).join("")}
    </ol>
  `;
}

function isLiveVisitor(visitor) {
  const date = new Date(visitor?.last_seen_at || "");
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= VISITOR_HEARTBEAT_MS * 4.5;
}

function visitorAvatarLabel(visitor) {
  const country = String(visitor?.country || "").trim();
  if (country) return country.slice(0, 2).toUpperCase();
  const text = String(visitor?.visitor_id || "H").replace(/[^a-z0-9]/gi, "");
  return (text.slice(0, 2) || "H").toUpperCase();
}

function visitorEntryLabel(visitor) {
  if (!visitor?.first_seen_at) return "new";
  return `joined ${relativeTime(visitor.first_seen_at)}`;
}

function visitorSignupLabel(visitor) {
  if (!Number(visitor?.signed_up || 0)) return "No";
  const identity = visitor?.username || visitor?.email || visitor?.provider || "Yes";
  return identity;
}

function userInitials(user) {
  const source = String(user?.username || user?.email || "U").trim();
  const parts = source.split(/[\s._@-]+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)).toUpperCase();
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function visitorHistoryItems(visitor, sessions, limit) {
  const visitorId = visitor?.visitor_id || "";
  const rows = (Array.isArray(sessions) ? sessions : [])
    .filter((session) => session.visitor_id === visitorId)
    .sort((left, right) => new Date(right.last_seen_at || 0) - new Date(left.last_seen_at || 0))
    .slice(0, limit);
  if (rows.length) return rows;
  return [
    {
      landing_path: visitor?.landing_path || "/",
      last_path: visitor?.last_path || "/",
      last_seen_at: visitor?.last_seen_at || "",
    },
  ];
}

function renderAdminTable(container, rows, headings, rowMapper, emptyText) {
  if (!container) return;
  rows = Array.isArray(rows) ? rows : [];
  if (!rows.length) {
    container.innerHTML = `<p class="admin-empty">${escapeHtml(emptyText)}</p>`;
    return;
  }
  container.innerHTML = `
    <table>
      <thead>
        <tr>${headings.map((heading) => `<th>${escapeHtml(heading)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map((row) => {
            return `<tr>${rowMapper(row)
              .map((value) => `<td>${escapeHtml(value ?? "")}</td>`)
              .join("")}</tr>`;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function selectedAdminInsights(data) {
  const insights = data?.visitor_insights || {};
  return insights[adminSelectedPeriod] || insights.day || {
    session_stats: {},
    visitors: [],
    sessions: [],
    campaigns: [],
  };
}

function selectedAdminFunnel(data) {
  const insights = data?.funnel_insights || {};
  return insights[adminSelectedPeriod] || insights.day || {
    events: [],
    campaigns: [],
  };
}

function renderAdminPeriodTabs() {
  adminPeriodTabs.forEach((tab) => {
    const isActive = tab.dataset.adminPeriod === adminSelectedPeriod;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  if (adminPeriodNote) {
    adminPeriodNote.textContent = ADMIN_PERIOD_LABELS[adminSelectedPeriod] || "Filtered";
  }
}

function formatFunnelEvent(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortVisitorId(value) {
  const text = String(value || "unknown");
  return text.length > 14 ? `${text.slice(0, 10)}...` : text;
}

function compactPath(value) {
  const text = String(value || "/");
  return text.length > 72 ? `${text.slice(0, 69)}...` : text;
}

function compactReferrer(value) {
  const text = String(value || "");
  if (!text) return "direct";
  try {
    const url = new URL(text);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return text.length > 72 ? `${text.slice(0, 69)}...` : text;
  }
}

function visitorRegion(value) {
  const parts = [value?.country, value?.region, value?.city].filter(Boolean);
  return parts.length ? parts.join(" / ") : "unknown";
}

function visitorDevice(value) {
  const device = value?.device_type || "unknown";
  const browser = value?.browser || "unknown";
  const os = value?.os || "unknown";
  return `${device} / ${browser} / ${os}`;
}

function visitorSource(value) {
  const source = value?.utm_source || "";
  const medium = value?.utm_medium || "";
  const campaign = value?.utm_campaign || "";
  if (source || medium || campaign) {
    return [source || "direct", medium || "none", campaign || "none"].join(" / ");
  }
  return compactReferrer(value?.last_referrer || value?.referrer || "");
}

function compactUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return String(value || "");
  }
}

function relativeTime(value) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function showAuthMessage(message, isError = false) {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.classList.toggle("error", isError);
}

function initializeGoogleSignIn() {
  if (googleInitTimer) {
    window.clearTimeout(googleInitTimer);
    googleInitTimer = null;
  }
  googleFallback?.classList.remove("needs-config", "is-loading");
  if (!appConfig.google_client_id) {
    if (googleSignin) googleSignin.hidden = true;
    if (googleFallback) googleFallback.hidden = false;
    googleFallback?.classList.add("needs-config");
    googleFallback?.removeAttribute("disabled");
    return;
  }
  if (!googleSignin || !window.google?.accounts?.id) {
    if (googleSignin) googleSignin.hidden = true;
    if (googleFallback) googleFallback.hidden = false;
    googleFallback?.classList.add("is-loading");
    googleFallback?.removeAttribute("disabled");
    googleInitTimer = window.setTimeout(initializeGoogleSignIn, 600);
    return;
  }
  window.google.accounts.id.initialize({
    client_id: appConfig.google_client_id,
    callback: async (response) => {
      const plan = signupPlanInput?.value || "sheepstealer_daily";
      await authenticate("/api/auth/google", {
        credential: response.credential,
        plan,
      });
    },
  });
  if (!googleButtonRendered) {
    googleSignin.innerHTML = "";
    const googleButtonWidth = 200;
    window.google.accounts.id.renderButton(googleSignin, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: googleButtonWidth,
      locale: "en",
    });
    googleButtonRendered = true;
  }
  googleSignin.hidden = false;
  if (googleFallback) googleFallback.hidden = true;
  googleFallback?.classList.remove("is-loading");
  googleFallback?.removeAttribute("disabled");
}

async function runAnalysis() {
  const target = normalizeTargetInput(targetInput.value);
  const selectedEngine = analysisEngineInput?.value || "sheepstealer";
  let validationMode = validationModeInput?.value || "proof";
  if (!["active", "proof"].includes(validationMode)) validationMode = "proof";
  let proofAuthorized = Boolean(proofAuthorizedInput?.checked);
  trackFunnelEvent("cta_clicked", {
    source: "target_console",
    engine: selectedEngine,
    validation_mode: validationMode,
    proof_authorized: proofAuthorized,
  });
  if (selectedEngine === "aegis" && isAelyxEngineLocked()) {
    showError("Aelyx unlocks after account setup.");
    if (currentUser) {
      openPreorderModal();
    } else {
      openAuthModal("signup");
    }
    return;
  }
  if (validationMode === "proof" && !proofAuthorized) {
    showError("Proof mode needs proof OK.");
    proofAuthorizedInput?.focus();
    return;
  }
  targetInput.value = target;
  document.body.classList.remove("is-pristine");
  resetRun(target);
  currentRunId = createClientRunId();
  currentRunController = new AbortController();
  isStoppingRun = false;
  runStartedAt = performance.now();
  timer = window.setInterval(updateElapsed, 120);
  runButton.disabled = true;
  runButton.classList.add("is-running");
  workBoard?.classList.add("is-running");
  setStopControlsVisible(true);
  runLabel.textContent = "Thinking";
  agentState.textContent = "Running";
  agentDetail.textContent = "Preparing tools.";
  workStatus.textContent = "Running";
  workDetail.textContent = "Preparing tools.";
  showThinkingModal(target, selectedEngine);

  try {
    const token = window.localStorage.getItem(SESSION_KEY);
    const response = await fetch("/api/analyze", {
      method: "POST",
      signal: currentRunController.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        target,
        authorized: authorizedInput.checked,
        engine: selectedEngine,
        validation_mode: validationMode,
        proof_authorized: proofAuthorized,
        client_run_id: currentRunId,
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
    if (isStoppingRun || error.name === "AbortError") {
      markRunStopped();
    } else {
      showError(error.message);
    }
  } finally {
    runButton.disabled = false;
    runButton.classList.remove("is-running");
    workBoard?.classList.remove("is-running");
    setStopControlsVisible(false);
    currentRunController = null;
    runLabel.textContent = "Scan";
    window.clearInterval(timer);
    updateElapsed();
  }
}

async function stopCurrentRun() {
  if (!currentRunId || isStoppingRun) return;
  isStoppingRun = true;
  setStopControlsVisible(true, { disabled: true, label: "Stopping" });
  agentState.textContent = "Stopping";
  agentDetail.textContent = "Cancelling the active analysis.";
  workStatus.textContent = "Stopping";
  workDetail.textContent = "Cancelling the active analysis.";
  if (currentUser) {
    try {
      await apiJson(`/api/analyze/${encodeURIComponent(currentRunId)}/cancel`, {
        method: "POST",
      });
    } catch (error) {
      appendErrorMessage(error.message);
    }
  }
  currentRunController?.abort();
  markRunStopped();
}

function markRunStopped() {
  hideThinkingModal();
  workBoard?.classList.remove("is-running");
  agentState.textContent = "Stopped";
  agentDetail.textContent = "Analysis cancelled by user.";
  workStatus.textContent = "Stopped";
  workDetail.textContent = "Analysis cancelled by user.";
  setStopControlsVisible(false);
  window.clearInterval(timer);
}

function setStopControlsVisible(visible, options = {}) {
  const label = options.label || "Stop scan";
  stopScanButtons.forEach((button) => {
    button.hidden = !visible;
    button.disabled = Boolean(options.disabled);
    button.textContent = label;
  });
}

function updateProofConsentVisibility() {
  const isProofMode = validationModeInput?.value === "proof";
  if (proofConsentRow) proofConsentRow.hidden = !isProofMode;
  if (proofAuthorizedInput) proofAuthorizedInput.checked = isProofMode;
}

function handleEvent(message) {
  const { type, data } = message;
  if (type === "run") {
    currentRunId = data.run_id || currentRunId;
  }
  if (type === "step") {
    renderStep(data);
    setRunStateFromStep(data);
    updateProgress();
    updateThinkingFromStep(data);
    renderWorkStep(data);
  }
  if (type === "quota") {
    renderQuota(data);
  }
  if (type === "metrics") {
    renderMetrics(data);
  }
  if (type === "report") {
    renderReport(data);
    appendReportReadyMessage(data);
    openReportModal();
    agentState.textContent = "Complete";
    agentDetail.textContent = `Report completed in ${formatDuration(data.duration_ms)}.`;
    workStatus.textContent = "Complete";
    workDetail.textContent = `Report completed in ${formatDuration(data.duration_ms)}.`;
    workProgressLabel.textContent = "100%";
    workBoard?.style.setProperty("--scan-progress", "100%");
    workBoard?.classList.remove("is-running");
    hideThinkingModal();
    loadWorkspaceHistory();
    loadAccountQuota();
  }
  if (type === "error") {
    showError(data.message);
    workBoard?.classList.remove("is-running");
    loadWorkspaceHistory();
  }
  if (type === "cancelled") {
    markRunStopped();
    loadWorkspaceHistory();
  }
  if (type === "done") {
    elapsed.textContent = formatDuration(data.duration_ms);
    if (thinkingElapsed) thinkingElapsed.textContent = formatDuration(data.duration_ms);
  }
}

function resetRun(target) {
  currentReport = null;
  isStoppingRun = false;
  traceItems.clear();
  closeReportModal();
  setReportNavReady(false);
  progressBar.style.setProperty("--progress", "0%");
  workBoard?.style.setProperty("--scan-progress", "0%");
  resetWorkBoard();

  traceList.innerHTML = `
    <li class="chat-message user">
      <div class="user-bubble">${escapeHtml(target || "New analysis")}</div>
    </li>
    <li class="chat-message assistant intro-message">
      <span class="message-avatar" aria-hidden="true">A</span>
      <div class="message-body">
        <p class="assistant-kicker">Aelyx agent</p>
        <p>Live scan started.</p>
      </div>
    </li>
  `;

  factsPanel.innerHTML =
    '<p class="panel-placeholder">DNS, HTTP, TLS, and page facts land here.</p>';
  findingsList.innerHTML = '<p class="panel-placeholder">No findings yet.</p>';
  hostingList.innerHTML =
    '<p class="panel-placeholder">Fixes appear after analysis.</p>';
  if (impactPanel) {
    impactPanel.innerHTML = '<p class="panel-placeholder">Impact appears after analysis.</p>';
  }
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

function scanStepMeta(step) {
  return SCAN_STEP_META[step?.id] || {};
}

function scanStepTitle(step) {
  const meta = scanStepMeta(step);
  if (step?.status === "complete") return meta.completeTitle || step.title || "Step complete";
  return meta.runningTitle || step?.title || "Working";
}

function scanStepDetail(step) {
  const meta = scanStepMeta(step);
  return step?.detail || meta.runningDetail || "Aelyx is working through this scan phase.";
}

function scanStepStateLabel(step) {
  const meta = scanStepMeta(step);
  if (step?.status === "complete") {
    if (step.result?.error === "direct_engine_timeout") return "Closed";
    if (step.result?.skipped) return "Returned";
    return "Done";
  }
  if (step?.result?.elapsed_ms) return `${formatDuration(step.result.elapsed_ms)} active`;
  return meta.label || "Running";
}

function setRunStateFromStep(step) {
  const title = scanStepTitle(step);
  const detail = scanStepDetail(step);
  agentState.textContent = title;
  agentDetail.textContent = detail;
  workStatus.textContent = title;
  workDetail.textContent = detail;
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
        <div class="step-topline">
          <p class="step-title"></p>
          <span class="step-state"></span>
        </div>
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
  item.dataset.elapsedMs = step.result?.elapsed_ms || "";
  item.dataset.timeoutSeconds = step.result?.timeout_seconds || "";
  item.querySelector(".step-title").textContent = step.title;
  item.querySelector(".tool-name").textContent = step.tool;
  item.querySelector(".step-state").textContent = scanStepStateLabel(step);
  item.querySelector(".trace-detail").textContent = step.detail;
  const preview = item.querySelector(".step-preview");
  const previewText = step.result?.preview || "";
  preview.hidden = !previewText;
  preview.textContent = previewText ? `Sub-result: ${previewText}` : "";
  scrollChatToBottom();
}

function resetWorkBoard() {
  workStatus.textContent = "Preparing scan";
  workDetail.textContent = "Checking the selected target, engine, and authorization before work begins.";
  workProgressLabel.textContent = "0%";
  workSteps.innerHTML = `
    <li class="waiting">
      <span class="work-step-marker" aria-hidden="true"></span>
      <span class="work-step-copy">
        <span class="work-step-title">Queued locally</span>
        <small>Waiting for the first server event.</small>
      </span>
      <strong>Ready</strong>
    </li>
  `;
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
  item.classList.remove("waiting");
  const title = scanStepTitle(step);
  const detail = scanStepDetail(step);
  const state = scanStepStateLabel(step);
  item.innerHTML = `
    <span class="work-step-marker" aria-hidden="true"></span>
    <span class="work-step-copy">
      <span class="work-step-title">${escapeHtml(title)}</span>
      <small>${escapeHtml(detail)}</small>
    </span>
    <strong>${escapeHtml(state)}</strong>
  `;
  workStatus.textContent = title;
  workDetail.textContent = detail;
}

function showThinkingModal(target, engine) {
  if (!thinkingModal) return;
  thinkingModal.hidden = false;
  resetModalScroll(thinkingModal);
  thinkingTarget.textContent = target || "-";
  thinkingEngine.textContent = engine === "sheepstealer" ? "sheepstealer" : "Aelyx";
  thinkingQuota.textContent = "checking";
  thinkingTitle.textContent = "Preparing scan";
  thinkingDetail.textContent = "Checking authorization, engine, quota, and target shape.";
  thinkingProgressBar?.style.setProperty("--thinking-progress", "8%");
  setThinkingStage(0);
  thinkingHasServerStep = false;
  startThinkingMood();
}

function hideThinkingModal() {
  if (!thinkingModal) return;
  stopThinkingMood();
  thinkingModal.hidden = true;
}

function updateThinkingFromStep(step) {
  if (!thinkingModal || thinkingModal.hidden) return;
  thinkingHasServerStep = true;
  thinkingTitle.textContent = scanStepTitle(step);
  thinkingDetail.textContent = scanStepDetail(step);
  applyThinkingMood(moodForStep(step.id));
  const stageIndex = stageIndexForStep(step.id, step.status);
  setThinkingStage(stageIndex);
  const progress = Number(String(workProgressLabel.textContent || "0").replace("%", "")) || 0;
  thinkingProgressBar?.style.setProperty("--thinking-progress", `${Math.max(8, progress)}%`);
}

function startThinkingMood() {
  stopThinkingMood();
  thinkingMoodIndex = 0;
  applyThinkingMood(THINKING_MOODS[thinkingMoodIndex]);
  thinkingMoodTimer = window.setInterval(() => {
    if (!thinkingModal || thinkingModal.hidden) {
      stopThinkingMood();
      return;
    }
    thinkingMoodIndex = (thinkingMoodIndex + 1) % THINKING_MOODS.length;
    applyThinkingMood(THINKING_MOODS[thinkingMoodIndex]);
  }, THINKING_MOOD_MS);
}

function stopThinkingMood() {
  if (!thinkingMoodTimer) return;
  window.clearInterval(thinkingMoodTimer);
  thinkingMoodTimer = null;
}

function applyThinkingMood(mood) {
  if (!mood) return;
  if (!thinkingHasServerStep) {
    if (thinkingTitle) thinkingTitle.textContent = mood.title;
    if (thinkingDetail) thinkingDetail.textContent = mood.detail;
  }
  if (thinkingPhase) thinkingPhase.textContent = mood.phase;
  if (thinkingQuote) thinkingQuote.textContent = `"${mood.quote}"`;
  if (thinkingExplain) thinkingExplain.textContent = mood.explain;
  thinkingSignal?.style.setProperty("--signal-step", `${(thinkingMoodIndex % 4) + 1}`);
}

function moodForStep(stepId) {
  const map = {
    scope: 0,
    agent_strategy: 1,
    agent_toolbox: 4,
    dns: 1,
    http: 2,
    tls: 3,
    surface: 4,
    aegis_direct: 6,
    sheepstealer_direct: 6,
    headers: 5,
    local_report: 8,
    llm: 9,
  };
  thinkingMoodIndex = map[stepId] ?? thinkingMoodIndex;
  return THINKING_MOODS[thinkingMoodIndex] || THINKING_MOODS[0];
}

function renderQuota(quota) {
  if (!quota) return;
  const label = quota.limit === null ? "unlimited" : `${quota.remaining ?? 0}/${quota.limit ?? 0} left`;
  if (thinkingQuota) thinkingQuota.textContent = quota.allowed ? label : "blocked";
  if (!quota.allowed) return;
  agentDetail.textContent = quota.message || agentDetail.textContent;
}

function setThinkingStage(activeIndex) {
  if (!thinkingStages) return;
  Array.from(thinkingStages.children).forEach((item, index) => {
    item.classList.toggle("complete", index < activeIndex);
    item.classList.toggle("running", index === activeIndex);
  });
}

function stageIndexForStep(stepId, status = "running") {
  if (["scope"].includes(stepId)) return 0;
  if (["agent_strategy"].includes(stepId)) return status === "complete" ? 2 : 1;
  if (["agent_toolbox"].includes(stepId)) return status === "complete" ? 3 : 2;
  if (["evidence_fallback"].includes(stepId)) return 3;
  if (DIRECT_STEP_IDS.has(stepId)) return status === "complete" ? 4 : 2;
  if (["dns", "http", "tls", "surface"].includes(stepId)) {
    return 1;
  }
  if (["headers", "local_report"].includes(stepId)) return 2;
  if (["llm"].includes(stepId)) return status === "complete" ? 4 : 3;
  return 2;
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
    renderImpactPanel(normalizeImpactFindings(report.vulnerabilities || []));
  }
  if (reportSearchInput) reportSearchInput.value = "";
  filterReport("");
}

function renderDirectPanels(report) {
  const rawOutput = report.llm?.content || "";
  const parsed = parseDirectReport(rawOutput);
  const engineName = directEngineName(report);
  const validationLabel = validationModeLabel(report.surface?.validation_mode);
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
        <div><dt>Validation</dt><dd>${escapeHtml(validationLabel)}</dd></div>
        <div><dt>Engine</dt><dd>${escapeHtml(report.llm?.model || engineName)}</dd></div>
        <div><dt>Duration</dt><dd>${escapeHtml(formatDuration(report.duration_ms))}</dd></div>
      </dl>
    </article>
  `;
  findingsList.innerHTML = renderDirectFindings(parsed, engineName);
  hostingList.innerHTML = renderDirectSupportSections(parsed);
  renderImpactPanel(parsed.findings);
}

function setReportModeLabels(report) {
  const sections = reportModal?.querySelectorAll(".modal-section") || [];
  const kicker = reportModal?.querySelector(".modal-header .kicker");
  const isDirect = Boolean(report);
  const engineName = isDirect ? directEngineName(report) : "Agent";
  if (kicker) kicker.textContent = isDirect ? `${engineName} direct report` : "Aelyx report";
  const labels = isDirect
    ? [
        ["Impact map", "Abuse scenarios"],
        ["Report overview", `Parsed ${engineName} findings`],
        ["Findings by severity", "Critical to low"],
        ["Evidence and remediation", "Plan, logs, validation"],
      ]
    : [
        ["Impact map", "Abuse scenarios"],
        ["Facts", "Passive evidence"],
        ["Security findings", "Classified issues"],
        ["Recommended architecture", "Hosting and edge hardening"],
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
  return ["aegis_direct", "sheepstealer_direct", "kimi_direct", "direct"].includes(
    report?.surface?.analysis_mode,
  );
}

function directEngineName(report) {
  return ["sheepstealer_direct", "kimi_direct"].includes(report?.surface?.analysis_mode)
    ? "sheepstealer"
    : "Aelyx";
}

function validationModeLabel(mode) {
  if (mode === "proof") return "Proof";
  if (mode === "active") return "Active";
  return "Proof";
}

function parseDirectReport(raw) {
  const sections = splitReportSections(raw);
  let findings = [];
  for (const severity of ["critical", "high", "medium", "low"]) {
    findings.push(...parseFindingSection(sections.get(`${severity} findings`) || "", severity));
  }
  findings.push(...parseFindingSection(sections.get("critical / high findings") || "", "high"));

  if (!findings.length) findings.push(...parseInlineSeverityFindings(raw));
  findings = dedupeFindings(findings);

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
    "critical / high findings",
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
      const heading = mapReportHeading(normalizeReportHeading(line));
      if (known.has(heading) && isReportHeadingLine(line, heading)) {
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

function isReportHeadingLine(line, mappedHeading) {
  const rawLine = String(line || "");
  const raw = rawLine.trim();
  if (!raw) return false;
  if (/^\s{2,}/.test(rawLine)) return false;
  if (raw.length > 96) return false;
  const plain = stripMarkdown(raw)
    .replace(/^\d+[.)]\s+/, "")
    .replace(/:$/, "")
    .trim()
    .toLowerCase();
  if (/^(severity|evidence|impact|fix|remediation|recommendation|confidence|abuse path|how it could be used|how someone could use it)\b/.test(plain)) {
    return false;
  }
  if (/^#{1,4}\s+/.test(raw)) return true;
  if (/^\*\*[^*]{2,80}\*\*:?\s*$/.test(raw)) return true;
  if (/^\d+[.)]\s+[^:]{2,80}:?\s*$/.test(raw)) return true;
  return [
    "executive risk summary",
    "critical / high findings",
    "critical findings",
    "high findings",
    "medium findings",
    "low findings",
    "tested paths / evidence log",
    "false positives / needs validation",
    "prioritized remediation plan",
  ].includes(mappedHeading);
}

function mapReportHeading(heading) {
  if (/^(risk snapshot|executive summary|summary|executive risk summary)$/.test(heading)) {
    return "executive risk summary";
  }
  if (/critical.*high.*(finding|vulnerabilit|issue)/.test(heading)) return "critical / high findings";
  if (/critical.*(finding|vulnerabilit|issue)/.test(heading)) return "critical findings";
  if (/high.*(finding|vulnerabilit|issue)/.test(heading)) return "high findings";
  if (/medium.*(finding|vulnerabilit|issue)/.test(heading)) return "medium findings";
  if (/low.*(finding|vulnerabilit|issue)/.test(heading)) return "low findings";
  if (/tested paths|evidence log|validation log|test log/.test(heading)) return "tested paths / evidence log";
  if (/false positive|needs validation|unconfirmed/.test(heading)) return "false positives / needs validation";
  if (/remediation plan|prioritized remediation|fix plan|priority fix|priority plan/.test(heading)) return "prioritized remediation plan";
  return heading;
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
  if (!normalized || isNoFindingText(normalized)) return [];

  return splitFindingBlocks(normalized)
    .map((block, index) => findingFromBlock(block, fallbackSeverity, index + 1))
    .filter(isMeaningfulFinding);
}

function splitFindingBlocks(text) {
  const normalized = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalized) return [];
  const blocks = normalized
    .split(
      /\n(?=\s*(?:[-*•]\s+|\d+[.)]\s+)(?!(?:\*\*)?(?:evidence|impact|fix|remediation|recommendation|confidence|abuse path|how it|how someone|affected|validation|proof|url|status|header)\b))/gi,
    )
    .map((block) => block.trim())
    .filter(Boolean);
  return blocks.length ? blocks : [normalized];
}

function findingFromBlock(block, fallbackSeverity, index) {
  const fields = extractFindingFields(block);
  const bulletTitle = block.match(/^\s*(?:[-*•]\s+|\d+[.)]\s+)?\*\*([^*]+)\*\*:?[ \t]*(.*)$/m);
  const plainTitle = firstFindingLine(block);
  const title =
    fields.vulnerability ||
    fields.finding ||
    fields.title ||
    (bulletTitle ? `${bulletTitle[1]}${bulletTitle[2] ? `: ${bulletTitle[2]}` : ""}` : "") ||
    plainTitle ||
    `${capitalize(fallbackSeverity)} finding ${index}`;
  const severity = normalizeSeverity(fields.severity || inferSeverityFromText(block, fallbackSeverity));
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
    /\*\*([^:*]{2,70}):\*\*\s*([\s\S]*?)(?=\n\s*(?:[-*•]\s+|\d+[.)]\s+)?\*\*[^:*]{2,70}:\*\*|\n\s*(?:[-*•]\s+|\d+[.)]\s+)(?:\*\*)?(?:vulnerability|finding|title|severity|evidence|impact|fix|remediation|recommendation|confidence|abuse path|how it|how someone)\b|$)/gi;
  let match;
  while ((match = pattern.exec(block))) {
    const key = match[1].trim().toLowerCase();
    fields[key] = match[2].trim();
  }
  String(block || "")
    .split("\n")
    .forEach((line) => {
      const lineMatch = line.match(
        /^\s*(?:[-*•]\s+|\d+[.)]\s+)?(?:\*\*)?(vulnerability|finding|title|severity|evidence|impact|fix|remediation|recommendation|confidence|abuse path|how it could be used|how someone could use it)(?:\*\*)?\s*:\s*(.+)$/i,
      );
      if (!lineMatch) return;
      const key = lineMatch[1].trim().toLowerCase();
      if (!fields[key]) fields[key] = lineMatch[2].trim();
    });
  return fields;
}

function parseInlineSeverityFindings(raw) {
  return splitFindingBlocks(raw)
    .filter(hasFindingSignal)
    .map((block, index) => findingFromBlock(block, inferSeverityFromText(block, "medium"), index + 1))
    .filter(isMeaningfulFinding);
}

function hasFindingSignal(block) {
  const text = stripMarkdown(block).toLowerCase();
  const first = text.split("\n").map((line) => line.trim()).find(Boolean) || "";
  if (/^(risk snapshot|executive summary|priority fix plan|priority remediation|validation notes|run context)\b/.test(first)) {
    return false;
  }
  return /vulnerability|finding|severity|evidence|impact|fix|remediation|recommendation|abuse path|cve-\d|xss|sql injection|csrf|idor|rce|ssrf|open redirect|hsts|content security policy|csp|caa|dnssec|cookie|cors|directory listing|xmlrpc|wp-|wordpress|admin|exposed|leak|disclosure|takeover|misconfiguration/.test(
    text,
  );
}

function firstFindingLine(block) {
  const line = String(block || "")
    .split("\n")
    .map((item) => item.trim())
    .find(Boolean);
  if (!line) return "";
  const cleaned = stripMarkdown(
    line
      .replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/, "")
      .replace(/^\s*(?:vulnerability|finding|title)\s*:\s*/i, ""),
  );
  if (!cleaned || /^(severity|evidence|impact|fix|remediation|recommendation|confidence)\s*:/i.test(cleaned)) {
    return "";
  }
  if (isNoFindingText(cleaned)) return "";
  return cleaned.length > 150 ? `${cleaned.slice(0, 147).trim()}...` : cleaned;
}

function inferSeverityFromText(text, fallback = "medium") {
  const normalized = String(text || "").toLowerCase();
  const explicit = normalized.match(/(?:severity|risk|priority)\s*[:\-]\s*(critical|high|medium|low)\b/);
  if (explicit) return explicit[1];
  const tag = normalized.match(/\b(critical|high|medium|low)\b\s+(?:finding|risk|severity|vulnerability|issue)\b/);
  if (tag) return tag[1];
  return fallback;
}

function isMeaningfulFinding(finding) {
  if (!finding || isNoFindingText(finding.raw || finding.title)) return false;
  const body = [finding.evidence, finding.usage, finding.impact, finding.fix, finding.confidence].join(" ");
  if (body.trim()) return true;
  return !/^(critical|high|medium|low) finding \d+$/i.test(finding.title);
}

function isNoFindingText(value) {
  const text = stripMarkdown(value).toLowerCase().replace(/\s+/g, " ").trim();
  if (!text) return true;
  return /^(none|n\/a|not observed|no findings|no confirmed|no strongly evidenced|no critical|no high|no medium|no low|nothing confirmed)\b/.test(
    text,
  );
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.severity}:${finding.title}:${finding.evidence}`.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderDirectFindings(parsed, engineName = "Aelyx") {
  if (!parsed.findings.length) {
    return `<p class="panel-placeholder">No classified findings were parsed from the ${escapeHtml(engineName)} assessment.</p>`;
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
  const education = findingEducation(finding);
  return `
    <article class="direct-finding-card ${escapeHtml(finding.severity)} report-searchable">
      <details>
        <summary class="finding-topline">
          <h3>${escapeHtml(finding.title)}</h3>
          <span class="severity-tag ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span>
        </summary>
        <div class="finding-visual ${escapeHtml(finding.severity)}" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="finding-explain">
          <div><b>Meaning</b><p>${escapeHtml(education.meaning)}</p></div>
          <div><b>Risk</b><p>${escapeHtml(education.risk)}</p></div>
          <div><b>Fix first</b><p>${escapeHtml(education.fix)}</p></div>
        </div>
        ${renderFindingField("Evidence", finding.evidence)}
        ${renderFindingField("How it could be used", finding.usage)}
        ${renderFindingField("Impact", finding.impact)}
        ${renderFindingField("Fix", finding.fix)}
        ${renderFindingField("Confidence", finding.confidence)}
      </details>
    </article>
  `;
}

function findingEducation(finding) {
  const text = [finding.title, finding.evidence, finding.usage, finding.impact, finding.fix]
    .join(" ")
    .toLowerCase();
  if (/script|xss|csp|unsafe-inline|javascript|content security policy/.test(text)) {
    return {
      meaning: "The browser may allow script behavior that is harder to control.",
      risk: "If another bug lets code enter the page, weak script policy can make visitor-side compromise easier.",
      fix: "Tighten CSP, remove unsafe inline script patterns where possible, and allow scripts only from trusted sources.",
    };
  }
  if (/hsts|tls|ssl|certificate|https|mixed content/.test(text)) {
    return {
      meaning: "The secure connection layer needs stronger guarantees.",
      risk: "Visitors may be easier to redirect, downgrade, or confuse if HTTPS policy is incomplete.",
      fix: "Enforce HTTPS, keep HSTS correct, monitor certificates, and remove mixed-content paths.",
    };
  }
  if (/cookie|session|auth|login|csrf|account|admin/.test(text)) {
    return {
      meaning: "The finding touches login, session, or privileged user behavior.",
      risk: "Attackers focus on these areas because they can lead to account access or unauthorized actions.",
      fix: "Harden cookies, CSRF protections, MFA, admin exposure, and rate limits around sensitive actions.",
    };
  }
  if (/dns|caa|dnssec|mx|ns|domain/.test(text)) {
    return {
      meaning: "The domain safety layer can be made stricter.",
      risk: "DNS and certificate-control gaps can make spoofing, misrouting, or certificate mistakes harder to detect.",
      fix: "Review DNSSEC, CAA, nameservers, and certificate issuance controls.",
    };
  }
  if (/header|clickjacking|x-frame|mime|referrer|permissions/.test(text)) {
    return {
      meaning: "A browser protection header is missing or too loose.",
      risk: "These headers reduce common browser-side abuse paths such as framing, data leakage, or unsafe content handling.",
      fix: "Set the missing security headers at the edge or web server and monitor them in deployment checks.",
    };
  }
  return {
    meaning: "This is a security hardening gap observed from public evidence.",
    risk: "It may not be exploitable alone, but it can combine with other weaknesses and increase real-world risk.",
    fix: "Prioritize the remediation plan, validate the finding, then add a regression check so it does not return.",
  };
}

function renderDirectSupportSections(parsed) {
  const cards = [
    ["Priority remediation plan", parsed.remediation],
    ["Tested paths / evidence log", parsed.evidenceLog],
    ["False positives / needs validation", parsed.validation],
  ].filter(([, content]) => content.trim());

  if (!cards.length) {
    return '<p class="panel-placeholder">No separate evidence log or remediation plan was parsed.</p>';
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

function normalizeImpactFindings(findings) {
  return (findings || [])
    .map((finding) => {
      return {
        title: finding.title || finding.name || "Finding",
        severity: normalizeSeverity(finding.severity || "low"),
        evidence: finding.evidence || "",
        usage: finding.usage || finding["how it could be used"] || finding.abuse_path || "",
        impact: finding.impact || "",
        fix: finding.fix || finding.recommendation || "",
        category: finding.category || "",
      };
    })
    .filter((finding) => finding.title || finding.evidence || finding.impact);
}

function renderImpactPanel(findings) {
  if (!impactPanel) return;
  const normalized = normalizeImpactFindings(findings);
  if (!normalized.length) {
    impactPanel.innerHTML = '<p class="panel-placeholder">No impact scenarios were derived from the current findings.</p>';
    return;
  }
  const impacts = buildImpactScores(normalized);
  const maxScore = Math.max(1, ...impacts.map((impact) => impact.score));
  impactPanel.innerHTML = `
    <div class="impact-grid">
      ${impacts
        .map((impact) => {
          const width = impact.score ? Math.max(8, Math.round((impact.score / maxScore) * 100)) : 0;
          const examples = impact.examples.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
          const detail = impactEducation(impact);
          const active = impact.count > 0;
          return `
            <article class="impact-card ${escapeHtml(impact.id)} ${active ? "has-findings" : "is-quiet"} report-searchable" style="--impact: ${width}%">
              <details ${active ? "" : ""}>
                <summary>
                  <span class="impact-badge">${escapeHtml(impact.badge)}</span>
                  <strong>${escapeHtml(impact.label)}</strong>
                  <small>${impact.count} linked finding${impact.count === 1 ? "" : "s"}</small>
                  <p class="impact-teaser">${escapeHtml(impact.description)}</p>
                  <div class="impact-meter" aria-hidden="true"><i></i></div>
                </summary>
                <div class="impact-visual" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="impact-explain">
                  <div>
                    <b>What this means</b>
                    <p>${escapeHtml(detail.meaning)}</p>
                  </div>
                  <div>
                    <b>Why it matters</b>
                    <p>${escapeHtml(detail.risk)}</p>
                  </div>
                  <div>
                    <b>First fix</b>
                    <p>${escapeHtml(detail.fix)}</p>
                  </div>
                </div>
                ${
                  examples
                    ? `<div class="impact-linked"><b>Linked evidence</b><ul>${examples}</ul></div>`
                    : `<p class="impact-empty">No linked finding in this scenario right now.</p>`
                }
              </details>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function buildImpactScores(findings) {
  const catalog = [
    {
      id: "data",
      badge: "DATA",
      label: "Steal user data",
      description: "Paths that may expose personal data, credentials, API responses, or internal records.",
      score: 0,
      count: 0,
      examples: [],
    },
    {
      id: "content",
      badge: "EDIT",
      label: "Change content",
      description: "Weaknesses that can lead to defacement, injected scripts, unauthorized edits, or content tampering.",
      score: 0,
      count: 0,
      examples: [],
    },
    {
      id: "account",
      badge: "ACCT",
      label: "Account takeover",
      description: "Session, auth, access-control, or admin exposure that can help compromise accounts.",
      score: 0,
      count: 0,
      examples: [],
    },
    {
      id: "availability",
      badge: "DOS",
      label: "DDoS / outage",
      description: "Resource abuse, rate-limit gaps, public attack surface, or infrastructure exposure affecting uptime.",
      score: 0,
      count: 0,
      examples: [],
    },
    {
      id: "edge",
      badge: "EDGE",
      label: "TLS / DNS / browser policy",
      description: "Hardening gaps that weaken transport, certificate, DNS, or browser-side protections.",
      score: 0,
      count: 0,
      examples: [],
    },
  ];
  findings.forEach((finding) => {
    const types = findingImpactTypes(finding);
    const weight = severityWeight(finding.severity);
    types.forEach((type) => {
      const impact = catalog.find((item) => item.id === type);
      if (!impact) return;
      impact.score += weight;
      impact.count += 1;
      if (impact.examples.length < 3) impact.examples.push(finding.title);
    });
  });
  return catalog.sort((left, right) => {
    if (left.count && !right.count) return -1;
    if (!left.count && right.count) return 1;
    if (left.id === "content" && left.count && right.count) return -1;
    if (right.id === "content" && left.count && right.count) return 1;
    return right.score - left.score || right.count - left.count;
  });
}

function impactEducation(impact) {
  const map = {
    data: {
      meaning: "Information could be exposed or collected in a way users did not expect.",
      risk: "For a non-technical owner, this can mean privacy complaints, leaked emails, tokens, or sensitive records becoming visible.",
      fix: "Reduce exposed data, lock down public API responses, and make sure secrets never appear in pages, scripts, logs, or backups.",
    },
    content: {
      meaning: "A weakness could let someone change what visitors see or inject code into the page.",
      risk: "This can lead to defacement, fake login prompts, malicious JavaScript, brand damage, or visitors being redirected.",
      fix: "Start with CSP/script hardening, remove unsafe inline script patterns where possible, and lock down edit/upload/admin paths.",
    },
    account: {
      meaning: "The finding touches login, session, admin, or access-control behavior.",
      risk: "Attackers may try to reuse weak session behavior, missing protections, or exposed admin flows to compromise accounts.",
      fix: "Harden cookies, auth flows, admin access, CSRF protections, MFA, and rate limits around sensitive actions.",
    },
    availability: {
      meaning: "The site may have public surfaces that are easy to overload or abuse.",
      risk: "The business impact is downtime: slow pages, failed forms, blocked customers, or higher infrastructure cost.",
      fix: "Put rate limits, caching, WAF rules, and bot controls in front of expensive or public endpoints.",
    },
    edge: {
      meaning: "Browser, TLS, DNS, and response-header protections are the outer safety layer of the site.",
      risk: "These gaps may not be a breach alone, but they make phishing, injection, clickjacking, or downgrade scenarios easier.",
      fix: "Tune HSTS, CSP, clickjacking, MIME, referrer, permissions, DNSSEC/CAA, and server header exposure at the edge.",
    },
  };
  return map[impact.id] || map.edge;
}

function findingImpactTypes(finding) {
  const text = [finding.title, finding.category, finding.evidence, finding.usage, finding.impact, finding.fix]
    .join(" ")
    .toLowerCase();
  const types = new Set();
  if (/data|pii|user|email|credential|password|token|secret|api key|leak|disclosure|exposure|database|backup|dump|cors|idor|bola/.test(text)) {
    types.add("data");
  }
  if (/xss|script|content|deface|edit|write|upload|stored|html|javascript|cms|wordpress|admin|injection|template|page|post|product/.test(text)) {
    types.add("content");
  }
  if (/auth|login|session|cookie|csrf|privilege|admin|takeover|account|mfa|brute|rate limit|idor|access control/.test(text)) {
    types.add("account");
  }
  if (/ddos|dos|outage|availability|resource|flood|rate limit|slow|timeout|open port|attack surface|waf|bot|exhaust/.test(text)) {
    types.add("availability");
  }
  if (/tls|ssl|hsts|csp|content security policy|dns|dnssec|caa|certificate|header|clickjacking|permissions-policy|referrer-policy|mixed content|server header/.test(text)) {
    types.add("edge");
  }
  if (!types.size) types.add("edge");
  return [...types];
}

function severityWeight(severity) {
  return { critical: 8, high: 5, medium: 3, low: 1 }[normalizeSeverity(severity)] || 1;
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

function directPostureLabel(counts, engineName = "Aelyx") {
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
  const seconds = Math.round(value / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (!minutes) return `${seconds} sec`;
  return `${minutes} min ${String(remainingSeconds).padStart(2, "0")} sec`;
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
  summaryLine.textContent = "No scan yet.";
  factsPanel.innerHTML = `
    <div class="empty-report report-searchable">
      <h3>No report</h3>
      <p>Scan an authorized target to see DNS, TLS, headers, findings, and fixes.</p>
      <button type="button" data-focus-target>Scan</button>
    </div>
  `;
  findingsList.innerHTML = '<p class="panel-placeholder">Findings appear after scan.</p>';
  hostingList.innerHTML = '<p class="panel-placeholder">Fixes appear after analysis.</p>';
  renderImpactPanel([]);
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
      <p><strong>Report ready.</strong> Score ${escapeHtml(report.score)} / ${escapeHtml(report.posture)} / ${escapeHtml(formatDuration(report.duration_ms))}.</p>
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
  hideThinkingModal();
  agentState.textContent = "Needs attention";
  agentDetail.textContent = message;
  workStatus.textContent = "Needs attention";
  workDetail.textContent = message;
  if (impactPanel) {
    impactPanel.innerHTML = `<p class="panel-placeholder">${escapeHtml(message)}</p>`;
  }
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
  if (stopButton) {
    stopButton.hidden = true;
    stopButton.disabled = false;
    stopButton.textContent = "Stop";
  }
  runLabel.textContent = "Scan";
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
  resetModalScroll(reportModal);
  reportModal.querySelector(".modal-close")?.focus();
}

function closeReportModal() {
  if (!reportModal) return;
  reportModal.hidden = true;
  if (authModal?.hidden !== false && accountModal?.hidden !== false) {
    document.body.classList.remove("modal-open");
  }
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

function resetModalScroll(modal) {
  if (!modal) return;
  modal.scrollTop = 0;
  modal.querySelectorAll(".modal-content, .account-dialog, .auth-dialog, .thinking-dialog").forEach((node) => {
    node.scrollTop = 0;
  });
}

function normalizeTargetInput(value) {
  const trimmed = String(value || "").trim();
  const repairedScheme = trimmed.replace(/^(https?):\/{3,}/i, (_, scheme) => `${scheme}://`);
  if (/^https?:\/\//i.test(repairedScheme)) return repairedScheme;
  return repairedScheme.replace(/^\/+/, "");
}

function createClientRunId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID().replaceAll("-", "");
  return `run_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
  const duration = formatDuration(Math.max(0, Math.round(performance.now() - runStartedAt)));
  elapsed.textContent = duration;
  if (thinkingElapsed) thinkingElapsed.textContent = duration;
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
  const activeStep = Array.from(traceItems.values()).find((item) =>
    item.classList.contains("running"),
  );
  let runningBonus = traceItems.size > completed ? 0.45 : 0;
  if (activeStep?.dataset.elapsedMs && activeStep.dataset.timeoutSeconds) {
    const elapsedMs = Number(activeStep.dataset.elapsedMs) || 0;
    const timeoutMs = (Number(activeStep.dataset.timeoutSeconds) || 1) * 1000;
    const timeoutProgress = Math.min(0.9, Math.max(0.35, elapsedMs / timeoutMs));
    runningBonus = timeoutProgress;
  }
  const progress = Math.min(100, Math.round(((completed + runningBonus) / totalSteps) * 100));
  progressBar.style.setProperty("--progress", `${progress}%`);
  workBoard?.style.setProperty("--scan-progress", `${progress}%`);
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
      console.warn("Invalid Aelyx hash preview report.", error);
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
    console.warn("Invalid Aelyx preview report.", error);
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
      impactCards: document.querySelectorAll(".impact-card").length,
    };
  };
}

function decodeBase64Utf8(value) {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
