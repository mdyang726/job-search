'use strict';

// ── Resume ────────────────────────────────────────────────
const BASE_RESUME = `Marcus D. Yang
(650) 954-0288 | yangdmarcus@gmail.com | www.linkedin.com/in/marcusdyang

EDUCATION
University of Illinois Urbana-Champaign | Champaign, IL | August 2024 – May 2028
B.S. in Aerospace Engineering, James Scholar Honors | GPA: 3.57/4
Relevant Coursework: Incompressible Flow, Aerospace Dynamical Systems, Mechanics of Aerospace Structures, Thermodynamics, Engineering Materials, Linear Algebra, Electrical and Electronic Circuits, Intro to Computer Science II

ORGANIZATIONAL AND TECHNICAL EXPERIENCE

Liquid Rocketry at Illinois | Spring 2025 – Present
- Modeled P&ID system architecture in Siemens NX; sourced and constrained CAD hardware to satisfy spatial constraints in pressurant tank assembly.
- Created CAD geometries for canard-grid fin configurations and ran ANSYS Fluent CFD cases to quantify aerodynamic interactions across 0–20° deflection.
- Assessed pressurant tank options, produced mechanical integration models, and verified fit against vehicle structural constraints.
- Engineered a KiCad PCB radio transmitter (USB-C + MCU) enabling telemetry links for ground tests.

CAD Project – McDonnell F-101 Voodoo (Siemens NX) | Spring 2025
- Recreated a full F-101 Voodoo in Siemens NX from multi-view engineering drawings, reconstructing fuselage, wing, and tail geometry.
- Integrated articulated control surfaces using parametric assemblies to simulate realistic aircraft deflection.

Model Rocket Project (OpenRocket, Excel) | Fall 2024
- Designed custom fin geometry in Siemens NX; validated apogee with OpenRocket simulations.
- Analyzed flight data: 430 ft apogee, 25 ft downrange drift; compared observed trajectory with simulation predictions.

Glider Project | Fall 2024
- Achieved 101 ft glide distance and 3.9 s flight time (6th in class) through iterative testing and wing geometry optimization.

TECHNICAL SKILLS
Languages: Python, C++, Java, JavaScript
Software: Siemens NX, Fusion 360, ANSYS Fluent, KiCad, Eagle PCB, OpenRocket, XFLR5, Excel
Shop: Spot Welder, Belt Sander, Laser Cutter, CNC Plasma Cutter, Table Saw, Drill Press, Band Saw
Materials: Epoxy Resin, Fiberglass, Sheet Metal, Aluminum, Plywood

LEADERSHIP
Asian American Association | Fall 2024 – Present | Treasurer / Fundraising Officer
- 400% YoY increase in funds raised; coached team of interns on independent fundraising projects.

Flight Club Aerospace | Summer 2021 – Spring 2024 | Landing Gear Research Lead
- Manufactured 7-ft wings: hot-wire foam ribs, aluminum spars, epoxy/fiberglass skins.
- Modeled gussets/ribs in Fusion 360; presented landing-gear recommendations from structural load and cost analyses.`;

// ── Defaults ──────────────────────────────────────────────
const DEFAULTS = {
  industries: [
    { name: "Aerospace & Propulsion", roles: ["Propulsion Engineering Intern", "Aerospace Engineering Intern", "Rocket Systems Intern", "Combustion Research Intern"], active: true, primary: true },
    { name: "Mechanical Engineering", roles: ["Mechanical Engineering Intern", "Design Engineering Intern", "Structural Analysis Intern", "Manufacturing Intern"], active: true, primary: false },
    { name: "Defense & Space", roles: ["Systems Engineering Intern", "R&D Engineering Intern", "Test & Evaluation Intern"], active: true, primary: false },
    { name: "Consulting", roles: ["Engineering Consulting Intern", "Technical Analyst Intern"], active: true, primary: false },
    { name: "Automotive", roles: ["Mechanical Engineering Intern", "Powertrain Intern"], active: false, primary: false },
    { name: "Energy", roles: ["Thermal Systems Intern", "Mechanical Engineering Intern"], active: false, primary: false }
  ],
  locations: ["Champaign, IL", "Los Angeles, CA", "Houston, TX", "Seattle, WA", "Remote"],
  experience: { "Internship": true, "Co-op": true, "Research (REU)": false, "Part-time": false },
  skills: ["ANSYS Fluent", "Siemens NX", "CAD", "Python", "KiCad", "OpenRocket"],
  seasons: { "Summer 2026": true, "Summer 2027": false, "Fall 2026": false, "Spring 2027": false },
  blurb: ""
};

// ── State ─────────────────────────────────────────────────
let state, jobs = [], applications = [], currentResumeText = "", editingIndustryIdx = null, editingAppIdx = null;

function loadState() {
  try { state = JSON.parse(localStorage.getItem("mjsc3") || "null") || JSON.parse(JSON.stringify(DEFAULTS)); } catch { state = JSON.parse(JSON.stringify(DEFAULTS)); }
  if (!state.seasons) state.seasons = DEFAULTS.seasons;
  try { jobs = JSON.parse(localStorage.getItem("mjsc3_jobs") || "[]"); } catch { jobs = []; }
  try { applications = JSON.parse(localStorage.getItem("mjsc3_apps") || "[]"); } catch { applications = []; }
}
loadState();

function save() {
  try { localStorage.setItem("mjsc3", JSON.stringify(state)); } catch {}
  showToast();
}
function saveJobs() { try { localStorage.setItem("mjsc3_jobs", JSON.stringify(jobs)); } catch {} }
function saveApps() { try { localStorage.setItem("mjsc3_apps", JSON.stringify(applications)); } catch {} }
function showToast() { const t = document.getElementById("savedToast"); t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 1800); }

// ── API key ───────────────────────────────────────────────
function getApiKey() { return localStorage.getItem("mjsc3_key") || ""; }
function saveApiKey() {
  const v = document.getElementById("apiKeyInput").value.trim();
  if (!v.startsWith("sk-ant-")) { alert("Invalid key — should start with sk-ant-"); return; }
  localStorage.setItem("mjsc3_key", v);
  document.getElementById("setupScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  initApp();
}
function clearApiKey() {
  if (!confirm("Reset API key?")) return;
  localStorage.removeItem("mjsc3_key");
  location.reload();
}
document.getElementById("apiKeyInput").addEventListener("keydown", e => { if (e.key === "Enter") saveApiKey(); });

// ── Boot ──────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  if (getApiKey()) {
    document.getElementById("setupScreen").classList.add("hidden");
    document.getElementById("appShell").classList.remove("hidden");
    initApp();
  }
});

function initApp() {
  renderIndustryCards();
  renderSeasonPills();
  ["locations","skills"].forEach(k => {
    renderTags(k);
    const inp = document.getElementById(k + "Input");
    if (inp) inp.addEventListener("keydown", e => { if (e.key === "Enter") addTag(k); });
  });
  renderExpPills();
  const b = document.getElementById("blurbText");
  b.value = state.blurb || "";
  b.addEventListener("input", () => { state.blurb = b.value; save(); });
  document.getElementById("newIndustryInput").addEventListener("keydown", e => { if (e.key === "Enter") addIndustry(); });
  renderJobList(jobs);
  renderKanban();
  checkAutoRefresh();
}

// ── Auto-refresh (once per day) ───────────────────────────
function checkAutoRefresh() {
  const last = parseInt(localStorage.getItem("mjsc3_lastSearch") || "0");
  const now = Date.now();
  const elapsed = now - last;
  const label = document.getElementById("lastUpdated");
  if (last) {
    const hrs = Math.floor(elapsed / 3600000);
    label.textContent = hrs < 1 ? "Updated recently" : hrs < 24 ? `Updated ${hrs}h ago` : "Updated >24h ago";
  }
  // Auto-run if more than 22h since last search and we have jobs cached
  if (elapsed > 22 * 3600000 && jobs.length > 0) {
    label.textContent = "Auto-refreshing…";
    runJobSearch(true);
  }
}

// ── Top tabs ──────────────────────────────────────────────
function switchTop(name) {
  document.querySelectorAll(".top-tab").forEach((b, i) => b.classList.toggle("active", ["jobs","tracker","criteria"][i] === name));
  document.querySelectorAll(".top-panel").forEach(p => { p.classList.remove("active"); p.classList.add("hidden"); });
  const p = document.getElementById("top-" + name);
  if (p) { p.classList.remove("hidden"); p.classList.add("active"); }
  if (name === "criteria") populateFilterDropdown();
}

// ── Criteria sub-tabs ─────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => { p.classList.remove("active"); p.classList.add("hidden"); });
  const map = ["industries","details","xport"];
  const idx = map.indexOf(name);
  document.querySelectorAll(".tab-btn")[idx]?.classList.add("active");
  const panel = document.getElementById("tab-" + name);
  if (panel) { panel.classList.remove("hidden"); panel.classList.add("active"); }
  if (name === "xport") document.getElementById("exportPre").textContent = JSON.stringify(state, null, 2);
}

// ── Season pills ──────────────────────────────────────────
function renderSeasonPills() {
  const wrap = document.getElementById("seasonPills");
  wrap.innerHTML = "";
  Object.keys(state.seasons).forEach(label => {
    const btn = document.createElement("button");
    btn.className = "pill-opt" + (state.seasons[label] ? " active" : "");
    btn.textContent = label;
    btn.onclick = () => { state.seasons[label] = !state.seasons[label]; save(); renderSeasonPills(); };
    wrap.appendChild(btn);
  });
}

// ── Job search ────────────────────────────────────────────
async function runJobSearch(auto = false) {
  const btn = document.getElementById("searchBtn");
  const btnText = document.getElementById("searchBtnText");
  const status = document.getElementById("searchStatus");

  btn.disabled = true;
  btnText.textContent = "Searching…";
  status.classList.remove("hidden");
  status.innerHTML = `<div class="spinner"></div><span>Searching the web for current open internships…</span>`;

  const activeIndustries = state.industries.filter(i => i.active);
  const roles = activeIndustries.flatMap(i => i.roles).slice(0, 10).join(", ");
  const locs = state.locations.join(", ");
  const skills = state.skills.join(", ");
  const primary = state.industries.find(i => i.primary)?.name || "Aerospace & Propulsion";
  const seasons = Object.keys(state.seasons).filter(k => state.seasons[k]).join(" or ");
  const today = new Date().toISOString().split("T")[0];

  const prompt = `Today's date is ${today}. You are a job search assistant for Marcus Yang, a sophomore Aerospace Engineering student at UIUC (GPA 3.57, James Scholar).

His background: ANSYS Fluent CFD, Siemens NX CAD, KiCad PCB design, Python, rocketry (Liquid Rocketry at Illinois), fiberglass/epoxy composites, OpenRocket.

Target season: ${seasons}
Primary interest: ${primary}
Also open to: ${activeIndustries.map(i=>i.name).join(", ")}
Roles: ${roles}
Locations: ${locs}
Skills: ${skills}

CRITICAL REQUIREMENTS — apply all of these or do not include the listing:
1. The posting must have been listed or confirmed active WITHIN THE LAST 30 DAYS from today (${today})
2. The application deadline must be in the FUTURE (after ${today}) — do NOT include expired postings
3. The position must be for ${seasons} — verify the posting explicitly states this
4. Only include postings you can verify exist right now via web search

Search job boards right now (LinkedIn, Handshake, Indeed, company career pages, Glassdoor) for these specific roles. For each result, verify the posting is still live before including it.

Return ONLY a valid JSON array of 6-10 jobs. No markdown, no explanation, just raw JSON. Each object:
{
  "title": "exact job title from the posting",
  "company": "company name",
  "location": "city, state or Remote",
  "type": "Internship or Co-op",
  "url": "direct URL to the live job posting",
  "posted": "YYYY-MM-DD or null if unknown",
  "deadline": "YYYY-MM-DD or null if unknown",
  "description": "2-3 sentence summary of what the intern will do day-to-day",
  "requirements": ["requirement 1", "requirement 2", "requirement 3", "requirement 4"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "industry": "one of the industry names provided",
  "matchScore": 85
}

Sort by matchScore descending. If you cannot find 6 verified current listings, return fewer — do NOT fabricate or include expired/unverifiable postings.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "API error " + res.status); }
    const data = await res.json();
    const text = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No job results returned. Try again.");
    jobs = JSON.parse(match[0]);
    saveJobs();
    localStorage.setItem("mjsc3_lastSearch", Date.now().toString());
    document.getElementById("lastUpdated").textContent = "Updated just now";
    renderJobList(jobs);
    populateFilterDropdown();
    status.classList.add("hidden");
  } catch (err) {
    status.innerHTML = `<span style="color:#f87171;">⚠ ${err.message}</span>`;
  }

  btn.disabled = false;
  btnText.textContent = "Find jobs";
}

// ── Render job accordion ──────────────────────────────────
function renderJobList(list) {
  const container = document.getElementById("jobList");
  const empty = document.getElementById("emptyState");
  container.innerHTML = "";

  if (!list || list.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.forEach((job, i) => {
    const row = document.createElement("div");
    row.className = "job-row";
    row.dataset.idx = i;
    row.dataset.industry = job.industry || "";
    row.dataset.match = job.matchScore || 0;

    const deadlineDisplay = formatDeadline(job.deadline);
    const mySkills = state.skills.map(s => s.toLowerCase());
    const tagsHtml = (job.keywords || []).map(kw => {
      const m = mySkills.some(s => kw.toLowerCase().includes(s) || s.includes(kw.toLowerCase()));
      return `<span class="job-tag${m?" match":""}">${kw}</span>`;
    }).join("");
    const reqHtml = (job.requirements || []).map(r => `<li>${r}</li>`).join("");
    const fillW = Math.min(100, job.matchScore || 0);

    row.innerHTML = `
      <div class="job-row-header" onclick="toggleJob(this)">
        <span class="job-row-company">${job.company}</span>
        <span class="job-row-title">${job.title}</span>
        <span class="job-row-location">${job.location}</span>
        <span class="job-row-deadline ${deadlineDisplay.cls}">${deadlineDisplay.text}</span>
        <span class="job-row-chevron">▾</span>
      </div>
      <div class="job-row-body">
        <div class="match-bar-wrap">
          <div class="match-bar-bg"><div class="match-bar-fill" style="width:${fillW}%"></div></div>
          <span class="match-score-label">${job.matchScore}% match</span>
        </div>
        <div class="job-body-grid">
          <div>
            <p class="job-section-title">About the role</p>
            <p class="job-desc">${job.description}</p>
            ${job.posted ? `<p style="font-family:var(--mono);font-size:11px;color:var(--text-muted);margin-top:8px;">Posted: ${job.posted}</p>` : ""}
          </div>
          <div>
            <p class="job-section-title">Requirements</p>
            <ul class="req-list">${reqHtml}</ul>
          </div>
        </div>
        <div style="margin-top:14px;">
          <p class="job-section-title">Keywords <span style="color:var(--accent);font-size:10px;">● = matches your skills</span></p>
          <div class="job-tags">${tagsHtml}</div>
        </div>
        <div class="job-actions">
          <button class="btn btn-primary" onclick="generateResume(${i})">✦ Tailor resume</button>
          ${job.url ? `<a class="btn" href="${job.url}" target="_blank" rel="noopener">View posting ↗</a>` : ""}
          <button class="btn" onclick="addToTrackerFromJob(${i})">+ Track this</button>
        </div>
      </div>`;
    container.appendChild(row);
  });
}

function toggleJob(header) {
  const row = header.parentElement;
  const isOpen = row.classList.contains("open");
  document.querySelectorAll(".job-row.open").forEach(r => r.classList.remove("open"));
  if (!isOpen) row.classList.add("open");
}

function formatDeadline(d) {
  if (!d) return { text: "Deadline unknown", cls: "deadline-unknown" };
  const diff = (new Date(d) - new Date()) / 86400000;
  if (diff < 0) return { text: "Expired", cls: "deadline-soon" };
  if (diff < 14) return { text: `Due in ${Math.ceil(diff)}d`, cls: "deadline-soon" };
  return { text: `Due ${d}`, cls: "deadline-ok" };
}

// ── Filter ────────────────────────────────────────────────
function populateFilterDropdown() {
  const sel = document.getElementById("filterIndustry");
  const current = sel.value;
  const industries = [...new Set(jobs.map(j => j.industry).filter(Boolean))];
  sel.innerHTML = `<option value="">All industries</option>` + industries.map(i => `<option value="${i}"${i===current?" selected":""}>${i}</option>`).join("");
}

function filterJobs() {
  const ind = document.getElementById("filterIndustry").value;
  const minMatch = parseInt(document.getElementById("filterMatch").value || "0");
  const filtered = jobs.filter(j => (!ind || j.industry === ind) && (j.matchScore || 0) >= minMatch);
  renderJobList(filtered);
}

// ── Resume tailoring ──────────────────────────────────────
async function generateResume(idx) {
  const job = jobs[idx];
  if (!job) return;
  document.getElementById("resumeModalTitle").textContent = `Tailored — ${job.title} @ ${job.company}`;
  document.getElementById("resumeModalBody").innerHTML = `<div class="resume-loading"><div class="spinner"></div> Tailoring your resume…</div>`;
  document.getElementById("resumeModalBackdrop").classList.add("open");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": getApiKey(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: `Tailor this resume for the job below. Rules: reorder bullets so most relevant appear first; weave in keywords naturally where truthful; add a 2-sentence tailored summary after contact info; do NOT fabricate anything; return only the resume text, no preamble.

JOB: ${job.title} at ${job.company}
Description: ${job.description}
Requirements: ${(job.requirements||[]).join("; ")}
Keywords: ${(job.keywords||[]).join(", ")}

RESUME:
${BASE_RESUME}` }] })
    });
    const data = await res.json();
    currentResumeText = data.content?.find(b => b.type === "text")?.text || "Error generating resume.";
    document.getElementById("resumeModalBody").textContent = currentResumeText;
  } catch (err) {
    document.getElementById("resumeModalBody").textContent = "Error: " + err.message;
  }
}

function closeResumeModal() { document.getElementById("resumeModalBackdrop").classList.remove("open"); }
function copyResume() {
  navigator.clipboard.writeText(currentResumeText).then(() => {
    const btn = document.querySelector("#resumeModalBackdrop .btn-primary");
    if (btn) { btn.textContent = "Copied!"; setTimeout(() => btn.textContent = "Copy text", 2000); }
  });
}

// ── Application tracker ───────────────────────────────────
const STATUSES = [
  { key: "applied",     label: "Applied",          dot: "dot-applied" },
  { key: "interview1",  label: "Interview — R1",   dot: "dot-interview1" },
  { key: "interview2",  label: "Interview — R2",   dot: "dot-interview2" },
  { key: "interview3",  label: "Interview — R3",   dot: "dot-interview3" },
  { key: "offer",       label: "Offer",             dot: "dot-offer" },
  { key: "rejected",    label: "Rejected",          dot: "dot-rejected" },
];

function renderKanban() {
  const kanban = document.getElementById("kanban");
  kanban.innerHTML = "";
  const counts = document.getElementById("statusCounts");
  counts.innerHTML = "";

  STATUSES.forEach(s => {
    const apps = applications.filter(a => a.status === s.key);
    const col = document.createElement("div");
    col.className = "kanban-col";
    col.innerHTML = `<div class="kanban-col-header">
      <span class="kanban-col-title"><span class="status-dot ${s.dot}" style="width:7px;height:7px;border-radius:50%;display:inline-block;"></span>${s.label}</span>
      <span class="kanban-count">${apps.length}</span>
    </div>`;

    if (apps.length === 0) {
      col.innerHTML += `<p class="empty-col">None yet</p>`;
    } else {
      apps.forEach(app => {
        const card = document.createElement("div");
        card.className = "app-card";
        card.innerHTML = `
          <p class="app-company">${app.company}</p>
          <p class="app-title">${app.title}</p>
          <div class="app-meta">
            <span>${app.location || "—"}</span>
            <span>${app.deadline ? "Due " + app.deadline : ""}</span>
          </div>
          ${app.notes ? `<p style="font-size:11px;color:var(--text-muted);font-family:var(--mono);margin-top:6px;">${app.notes}</p>` : ""}
          <div class="app-card-actions">
            <select class="filter-select" style="font-size:10px;padding:3px 6px;" onchange="updateAppStatus('${app.id}', this.value)">
              ${STATUSES.map(st => `<option value="${st.key}"${st.key===app.status?" selected":""}>${st.label}</option>`).join("")}
            </select>
            <button class="btn btn-sm btn-danger" onclick="deleteApp('${app.id}')">✕</button>
          </div>`;
        col.appendChild(card);
      });
    }
    kanban.appendChild(col);

    // Count badge
    const badge = document.createElement("span");
    badge.className = "status-count";
    badge.innerHTML = `<span class="status-dot ${s.dot}" style="width:7px;height:7px;border-radius:50%;display:inline-block;"></span>${s.label}: ${apps.length}`;
    counts.appendChild(badge);
  });
}

function openAddApp() {
  editingAppIdx = null;
  document.getElementById("appCompany").value = "";
  document.getElementById("appTitle").value = "";
  document.getElementById("appLocation").value = "";
  document.getElementById("appDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("appDeadline").value = "";
  document.getElementById("appStatus").value = "applied";
  document.getElementById("appNotes").value = "";
  document.getElementById("addAppBackdrop").classList.add("open");
}

function addToTrackerFromJob(idx) {
  const job = jobs[idx];
  if (!job) return;
  document.getElementById("appCompany").value = job.company;
  document.getElementById("appTitle").value = job.title;
  document.getElementById("appLocation").value = job.location;
  document.getElementById("appDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("appDeadline").value = job.deadline || "";
  document.getElementById("appStatus").value = "applied";
  document.getElementById("appNotes").value = "";
  document.getElementById("addAppBackdrop").classList.add("open");
}

function saveApplication() {
  const app = {
    id: Date.now().toString(),
    company: document.getElementById("appCompany").value.trim(),
    title: document.getElementById("appTitle").value.trim(),
    location: document.getElementById("appLocation").value.trim(),
    date: document.getElementById("appDate").value,
    deadline: document.getElementById("appDeadline").value,
    status: document.getElementById("appStatus").value,
    notes: document.getElementById("appNotes").value.trim()
  };
  if (!app.company || !app.title) { alert("Company and title are required."); return; }
  applications.push(app);
  saveApps();
  closeAddApp();
  renderKanban();
}

function updateAppStatus(id, status) {
  const app = applications.find(a => a.id === id);
  if (app) { app.status = status; saveApps(); renderKanban(); }
}

function deleteApp(id) {
  if (!confirm("Remove this application?")) return;
  applications = applications.filter(a => a.id !== id);
  saveApps();
  renderKanban();
}

function closeAddApp() { document.getElementById("addAppBackdrop").classList.remove("open"); }

// ── Industry cards ────────────────────────────────────────
function renderIndustryCards() {
  const grid = document.getElementById("industryGrid");
  grid.innerHTML = "";
  state.industries.forEach((ind, idx) => {
    const card = document.createElement("div");
    card.className = "industry-card" + (ind.primary?" primary":"") + (!ind.active?" inactive":"");
    const chips = ind.roles.slice(0,4).map(r=>`<span class="role-chip">${r}</span>`).join("");
    const more = ind.roles.length>4 ? `<span class="role-chip">+${ind.roles.length-4}</span>` : "";
    card.innerHTML = `
      <div class="card-top"><span class="card-name">${ind.name}</span>${ind.primary?'<span class="priority-badge">Priority</span>':""}</div>
      <div class="role-chips">${chips}${more}</div>
      <div class="card-actions">
        <button class="btn btn-sm" onclick="openEditModal(${idx})">Edit roles</button>
        <button class="btn btn-sm" onclick="toggleIndustry(${idx})">${ind.active?"Hide":"Show"}</button>
        ${!ind.primary?`<button class="btn btn-sm" onclick="setPrimary(${idx})">Set priority</button>`:""}
      </div>`;
    grid.appendChild(card);
  });
}
function toggleIndustry(idx) { state.industries[idx].active=!state.industries[idx].active; save(); renderIndustryCards(); }
function setPrimary(idx) { state.industries.forEach((ind,i)=>ind.primary=(i===idx)); save(); renderIndustryCards(); }
function addIndustry() {
  const inp = document.getElementById("newIndustryInput");
  const v = inp.value.trim(); if(!v) return;
  state.industries.push({name:v,roles:["Engineering Intern"],active:true,primary:false});
  save(); renderIndustryCards(); inp.value="";
}

function openEditModal(idx) {
  editingIndustryIdx = idx;
  document.getElementById("modalTitle").textContent = `Edit roles — ${state.industries[idx].name}`;
  document.getElementById("modalTextarea").value = state.industries[idx].roles.join("\n");
  document.getElementById("modalBackdrop").classList.add("open");
  document.getElementById("modalTextarea").focus();
}
function closeModal() { document.getElementById("modalBackdrop").classList.remove("open"); editingIndustryIdx=null; }
function saveModal() {
  if (editingIndustryIdx===null) return;
  state.industries[editingIndustryIdx].roles = document.getElementById("modalTextarea").value.split("\n").map(r=>r.trim()).filter(Boolean);
  save(); renderIndustryCards(); closeModal();
}

// ── Tags ──────────────────────────────────────────────────
function renderTags(key) {
  const wrap = document.getElementById(key+"Tags"); wrap.innerHTML="";
  state[key].forEach((v,i) => {
    const span = document.createElement("span"); span.className="tag";
    span.innerHTML=`${v}<button aria-label="Remove ${v}" onclick="removeTag('${key}',${i})">×</button>`;
    wrap.appendChild(span);
  });
}
function addTag(key) {
  const inp=document.getElementById(key+"Input"); const v=inp.value.trim();
  if(!v||state[key].includes(v)){inp.value="";return;}
  state[key].push(v); save(); renderTags(key); inp.value="";
}
function removeTag(key,i) { state[key].splice(i,1); save(); renderTags(key); }

function renderExpPills() {
  const wrap=document.getElementById("expPills"); wrap.innerHTML="";
  Object.keys(state.experience).forEach(label=>{
    const btn=document.createElement("button");
    btn.className="pill-opt"+(state.experience[label]?" active":"");
    btn.textContent=label;
    btn.onclick=()=>{state.experience[label]=!state.experience[label];save();renderExpPills();};
    wrap.appendChild(btn);
  });
}

// ── Export ────────────────────────────────────────────────
function copyJSON() {
  navigator.clipboard.writeText(JSON.stringify(state,null,2)).then(()=>{
    const el=document.getElementById("copyConfirm"); el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2000);
  });
}
function downloadJSON() {
  const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"})),download:"marcus-criteria.json"});
  a.click();
}

// ── Keyboard ──────────────────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.key==="Escape") { closeModal(); closeResumeModal(); closeAddApp(); }
});
