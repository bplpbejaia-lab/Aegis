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
const adminSummary = document.querySelector("#admin-summary");
const adminLiveRuns = document.querySelector("#admin-live-runs");
const adminUsers = document.querySelector("#admin-users");
const adminRuns = document.querySelector("#admin-runs");
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
const llmOutput = document.querySelector("#llm-output");
const reportModal = document.querySelector("#report-modal");
const openReportButton = document.querySelector("#open-report");
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

const traceItems = new Map();
const SESSION_KEY = "aegisSessionToken";
let runStartedAt = 0;
let timer = null;
let currentReport = null;
let currentUser = null;
let appConfig = { plans: [], google_client_id: "", proof_mode_launched: false };
let currentRunId = "";
let currentRunController = null;
let isStoppingRun = false;
let currentQuotaSummary = null;
let googleButtonRendered = false;
let googleInitTimer = null;

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
  initializeGoogleSignIn();
  installLocalPreviewHook();
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runAnalysis();
});

stopButton?.addEventListener("click", () => {
  stopCurrentRun();
});

validationModeInput?.addEventListener("change", updateProofConsentVisibility);

sessionButton?.addEventListener("click", () => {
  if (currentUser) {
    openAccountModal();
  } else {
    openAuthModal("login");
  }
});

profileCard?.addEventListener("click", () => {
  if (currentUser) {
    openAccountModal();
  } else {
    openAuthModal("login");
  }
});

aegisPreorderCard?.addEventListener("click", () => {
  openPreorderModal();
});

confirmAelyxPreorderButton?.addEventListener("click", () => {
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
    plan: signupPlanInput?.value || "sheepstealer_daily",
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
    showAuthMessage("Google sign-in is not configured. Add GOOGLE_CLIENT_ID in .env and restart Aelyx.", true);
    return;
  }
  if (window.google?.accounts?.id && googleSignin && !googleButtonRendered) {
    initializeGoogleSignIn();
    return;
  }
  if (window.google?.accounts?.id) {
    window.google.accounts.id.prompt();
    showAuthMessage("Choose your Google account in the popup.", false);
    return;
  }
  showAuthMessage("Google sign-in is still loading. Try again in a moment.", false);
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
    showAuthMessage("Signed in.", false);
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

function switchAuthTab(tabName) {
  const isSignup = tabName === "signup";
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
    signupPlanInput.value = plans.some((plan) => plan.id === "sheepstealer_daily")
      ? "sheepstealer_daily"
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
  return !(appConfig.proof_mode_launched && hasAelyxPlanAccess());
}

function isAelyxEngineLocked() {
  return !hasAelyxPlanAccess();
}

function isLockedSelectOption(select, value) {
  if (!select) return false;
  if (select.id === "validation-mode" && value === "proof") return isProofModeLocked();
  if (select.id === "analysis-engine" && value === "aegis") return isAelyxEngineLocked();
  return false;
}

function handleLockedSelectOption(select, shell) {
  syncCustomSelect(shell);
  closeCustomSelect(shell);
  if (select?.id === "analysis-engine") {
    showError("Aelyx engine is reserved for paid Aelyx users.");
  }
  openPreorderModal();
}

function enforceLockedSelections() {
  if (analysisEngineInput?.value === "aegis" && isAelyxEngineLocked()) {
    analysisEngineInput.value = "sheepstealer";
  }
  if (validationModeInput?.value === "proof" && isProofModeLocked()) {
    validationModeInput.value = "safe";
    if (proofAuthorizedInput) proofAuthorizedInput.checked = false;
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
      : "Sign in";
    sessionButton.classList.toggle("is-authenticated", signedIn);
  }
  renderProfileCard();
  renderAelyxPreorderState();
  enforceLockedSelections();
  if (!signedIn) {
    closeAccountModal();
    if (adminDashboard) adminDashboard.hidden = true;
    showAuthMessage("Use your workspace account to continue.", false);
    currentQuotaSummary = null;
    renderQuotaSummary(null);
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
  if (adminDashboard) adminDashboard.hidden = !currentUser.is_admin;
  loadAccountQuota();
  loadWorkspaceHistory();
  if (currentUser.is_admin) loadAdminDashboard();
}

function renderProfileCard() {
  const signedIn = Boolean(currentUser);
  const username = signedIn ? currentUser.username : "Guest session";
  const plan = currentUser?.is_admin ? "Unlimited admin" : currentUser?.plan?.label || "Pre-registration";
  if (profileName) profileName.textContent = username;
  if (profilePlan) profilePlan.textContent = plan;
  if (profileAvatar) profileAvatar.textContent = (username || "A").slice(0, 1).toUpperCase();
  profileCard?.classList.toggle("is-authenticated", signedIn);
}

function renderAelyxPreorderState() {
  const isRegistered = Boolean(currentUser?.aegis_waitlist_at);
  if (aegisPreorderStatus) {
    aegisPreorderStatus.textContent = isRegistered
      ? "You are pre-registered"
      : "Pre-register for launch perks";
  }
  aegisPreorderCard?.classList.toggle("is-registered", isRegistered);
  if (confirmAelyxPreorderButton) {
    confirmAelyxPreorderButton.textContent = isRegistered ? "Already pre-registered" : "Pre-register Aelyx";
    confirmAelyxPreorderButton.disabled = isRegistered;
  }
  if (preorderMessage) {
    preorderMessage.textContent = isRegistered
      ? "Aelyx early access is reserved for this account."
      : "Current default remains sheepstealer.";
    preorderMessage.classList.remove("error");
  }
}

async function loadAccountQuota() {
  if (!currentUser) return;
  try {
    currentQuotaSummary = await apiJson("/api/account/quota");
    renderQuotaSummary(currentQuotaSummary);
  } catch {
    renderQuotaSummary(null);
  }
}

function renderQuotaSummary(summary) {
  if (!currentUser) {
    if (sidebarQuota) sidebarQuota.textContent = "Default access: sheepstealer";
    renderAccountQuotaCard("Quota left", "Sign in to view", "Pre-registration uses sheepstealer by default.");
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
    workspaceHistory.innerHTML = '<li class="workspace-empty">Sign in to see recent scans.</li>';
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
            data-workspace-mode="${escapeHtml(run.validation_mode || "safe")}"
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
    showAuthMessage("Create an account first, then pre-register Aelyx.", false);
    return;
  }
  closeAuthModal();
  closeAccountModal();
  if (!preorderModal) return;
  renderAelyxPreorderState();
  preorderModal.hidden = false;
  document.body.classList.add("modal-open");
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
  accountModal.hidden = false;
  document.body.classList.add("modal-open");
  accountPlanInput?.focus();
  if (currentUser?.is_admin) loadAdminDashboard();
}

function closeAccountModal() {
  if (!accountModal) return;
  accountModal.hidden = true;
  if (reportModal?.hidden !== false && authModal?.hidden !== false) {
    document.body.classList.remove("modal-open");
  }
}

async function loadAdminDashboard() {
  if (!currentUser?.is_admin || !adminDashboard) return;
  setAdminLoading();
  try {
    const data = await apiJson("/api/admin/dashboard");
    renderAdminDashboard(data);
  } catch (error) {
    if (adminSummary) {
      adminSummary.innerHTML = `<p class="admin-empty">${escapeHtml(error.message)}</p>`;
    }
  }
}

function setAdminLoading() {
  if (adminSummary) adminSummary.innerHTML = '<p class="admin-empty">Loading dashboard...</p>';
  if (adminLiveRuns) adminLiveRuns.innerHTML = "";
  if (adminUsers) adminUsers.innerHTML = "";
  if (adminRuns) adminRuns.innerHTML = "";
}

function renderAdminDashboard(data) {
  const summary = data.summary || {};
  if (adminSummary) {
    adminSummary.innerHTML = [
      ["Users", summary.users || 0],
      ["Active sessions", summary.active_sessions || 0],
      ["Live runs", summary.live_runs || 0],
      ["Completed", summary.completed_runs || 0],
      ["Problems", summary.problem_runs || 0],
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
    data.live_runs || [],
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
  renderAdminTable(
    adminUsers,
    data.users || [],
    ["User", "Plan", "Provider", "Sessions", "Runs", "Seen"],
    (user) => [
      user.username,
      user.is_admin ? "admin" : user.plan,
      user.provider,
      user.active_sessions || 0,
      user.total_runs || 0,
      relativeTime(user.last_seen_at || user.last_run_at || user.created_at),
    ],
    "No users yet.",
  );
  renderAdminTable(
    adminRuns,
    data.recent_runs || [],
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
}

function renderAdminTable(container, rows, headings, rowMapper, emptyText) {
  if (!container) return;
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
    const googleButtonWidth = Math.min(480, Math.max(300, googleSignin.parentElement?.clientWidth || 420));
    window.google.accounts.id.renderButton(googleSignin, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: "continue_with",
      shape: "pill",
      logo_alignment: "left",
      width: googleButtonWidth,
    });
    googleButtonRendered = true;
  }
  googleSignin.hidden = false;
  if (googleFallback) googleFallback.hidden = true;
  googleFallback?.classList.remove("is-loading");
  googleFallback?.removeAttribute("disabled");
}

async function runAnalysis() {
  if (!currentUser) {
    showError("Sign in or create an account before running Aelyx.");
    openAuthModal("login");
    return;
  }
  const target = normalizeTargetInput(targetInput.value);
  const selectedEngine = analysisEngineInput?.value || "sheepstealer";
  const validationMode = validationModeInput?.value || "safe";
  const proofAuthorized = Boolean(proofAuthorizedInput?.checked);
  if (selectedEngine === "aegis" && isAelyxEngineLocked()) {
    showError("Aelyx engine is reserved for paid Aelyx users.");
    openPreorderModal();
    return;
  }
  if (validationMode === "proof" && isProofModeLocked()) {
    showError("Proof mode is reserved for Aelyx users after launch.");
    openPreorderModal();
    return;
  }
  if (validationMode === "proof" && !proofAuthorized) {
    showError("Proof mode requires separate reversible-proof authorization.");
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
  if (stopButton) stopButton.hidden = false;
  runLabel.textContent = "Thinking";
  agentState.textContent = "Running";
  agentDetail.textContent = "Preparing Aelyx tools.";
  workStatus.textContent = "Running";
  workDetail.textContent = "Preparing Aelyx tools.";
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
    if (stopButton) stopButton.hidden = true;
    currentRunController = null;
    runLabel.textContent = "Analyze";
    window.clearInterval(timer);
    updateElapsed();
  }
}

async function stopCurrentRun() {
  if (!currentRunId || isStoppingRun) return;
  isStoppingRun = true;
  if (stopButton) {
    stopButton.disabled = true;
    stopButton.textContent = "Stopping";
  }
  agentState.textContent = "Stopping";
  agentDetail.textContent = "Cancelling the active analysis.";
  workStatus.textContent = "Stopping";
  workDetail.textContent = "Cancelling the active analysis.";
  try {
    await apiJson(`/api/analyze/${encodeURIComponent(currentRunId)}/cancel`, {
      method: "POST",
    });
  } catch (error) {
    appendErrorMessage(error.message);
  }
  currentRunController?.abort();
  markRunStopped();
}

function markRunStopped() {
  hideThinkingModal();
  agentState.textContent = "Stopped";
  agentDetail.textContent = "Analysis cancelled by user.";
  workStatus.textContent = "Stopped";
  workDetail.textContent = "Analysis cancelled by user.";
  if (stopButton) {
    stopButton.hidden = true;
    stopButton.disabled = false;
    stopButton.textContent = "Stop";
  }
  window.clearInterval(timer);
}

function updateProofConsentVisibility() {
  if (validationModeInput?.value === "proof" && isProofModeLocked()) {
    validationModeInput.value = "safe";
    syncCustomSelect(validationModeInput.closest(".select-shell"));
  }
  const isProofMode = validationModeInput?.value === "proof";
  if (proofConsentRow) proofConsentRow.hidden = !isProofMode;
  if (!isProofMode && proofAuthorizedInput) proofAuthorizedInput.checked = false;
}

function handleEvent(message) {
  const { type, data } = message;
  if (type === "run") {
    currentRunId = data.run_id || currentRunId;
  }
  if (type === "step") {
    renderStep(data);
    agentState.textContent = data.status === "complete" ? "Thinking" : "Running";
    agentDetail.textContent = data.detail;
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
    hideThinkingModal();
    loadWorkspaceHistory();
    loadAccountQuota();
  }
  if (type === "error") {
    showError(data.message);
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
  resetWorkBoard();

  traceList.innerHTML = `
    <li class="chat-message user">
      <div class="user-bubble">${escapeHtml(target || "New analysis")}</div>
    </li>
    <li class="chat-message assistant intro-message">
      <span class="message-avatar" aria-hidden="true">A</span>
      <div class="message-body">
        <p class="assistant-kicker">Aelyx research agent</p>
        <p>Starting the live reasoning stream. Aelyx tools will appear here as they run.</p>
      </div>
    </li>
  `;

  factsPanel.innerHTML =
    '<p class="panel-placeholder">DNS, HTTP, TLS, and page facts will land here.</p>';
  findingsList.innerHTML = '<p class="panel-placeholder">No findings yet.</p>';
  hostingList.innerHTML =
    '<p class="panel-placeholder">Recommendations will be generated after analysis.</p>';
  llmOutput.textContent = "Waiting for agent output.";
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
  workDetail.textContent = "Preparing Aelyx tools.";
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

function showThinkingModal(target, engine) {
  if (!thinkingModal) return;
  thinkingModal.hidden = false;
  thinkingTarget.textContent = target || "-";
  thinkingEngine.textContent = engine === "sheepstealer" ? "sheepstealer" : "Aelyx";
  thinkingQuota.textContent = "checking";
  thinkingTitle.textContent = "Aelyx is thinking";
  thinkingDetail.textContent = "Preparing the run.";
  thinkingProgressBar?.style.setProperty("--thinking-progress", "8%");
  setThinkingStage(0);
}

function hideThinkingModal() {
  if (!thinkingModal) return;
  thinkingModal.hidden = true;
}

function updateThinkingFromStep(step) {
  if (!thinkingModal || thinkingModal.hidden) return;
  thinkingTitle.textContent = step.status === "complete" ? "Evidence captured" : step.title;
  thinkingDetail.textContent = step.detail || "Working.";
  const stageIndex = stageIndexForStep(step.id);
  setThinkingStage(stageIndex);
  const progress = Number(String(workProgressLabel.textContent || "0").replace("%", "")) || 0;
  thinkingProgressBar?.style.setProperty("--thinking-progress", `${Math.max(8, progress)}%`);
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

function stageIndexForStep(stepId) {
  if (["scope"].includes(stepId)) return 0;
  if (["dns", "http", "tls", "surface", "aegis_direct", "sheepstealer_direct"].includes(stepId)) {
    return 1;
  }
  if (["local_report", "llm"].includes(stepId)) return 3;
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
  }
  llmOutput.textContent = report.llm?.content || "No agent content returned.";
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
}

function setReportModeLabels(report) {
  const sections = reportModal?.querySelectorAll(".modal-section") || [];
  const kicker = reportModal?.querySelector(".modal-header .kicker");
  const isDirect = Boolean(report);
  const engineName = isDirect ? directEngineName(report) : "Agent";
  if (kicker) kicker.textContent = isDirect ? `${engineName} direct report` : "Aelyx report";
  const labels = isDirect
    ? [
        ["Report overview", `Parsed from raw ${engineName} output`],
        ["Findings by severity", "Critical to low"],
        ["Evidence and remediation", "Plan, logs, validation"],
        ["Raw agent output", "Unmodified source"],
      ]
    : [
        ["Facts", "Passive evidence"],
        ["Security findings", "Classified issues"],
        ["Recommended architecture", "Hosting and edge hardening"],
        ["Full assessment", "Agent output"],
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
  if (mode === "proof") return "Proof mode";
  if (mode === "active") return "Active validation";
  return "Safe analysis";
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

function renderDirectFindings(parsed, engineName = "Aelyx") {
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
  llmOutput.textContent = "The agent output will appear after the first completed scan.";
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
  if (stopButton) {
    stopButton.hidden = true;
    stopButton.disabled = false;
    stopButton.textContent = "Stop";
  }
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
      rawLength: llmOutput.textContent.length,
    };
  };
}

function decodeBase64Utf8(value) {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
