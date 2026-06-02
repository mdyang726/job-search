// ── Resume base (Marcus Yang) ─────────────────────────────
const BASE_RESUME = `Marcus D. Yang
(650) 954-0288 | yangdmarcus@gmail.com | www.linkedin.com/in/marcusdyang

EDUCATION
University of Illinois Urbana-Champaign | Champaign, IL | August 2024 – May 2028
B.S. in Aerospace Engineering, James Scholar Honors | GPA: 3.57/4
Relevant Coursework: Incompressible Flow, Aerospace Dynamical Systems, Mechanics of Aerospace Structures, Thermodynamics, Engineering Materials, Linear Algebra, Electrical and Electronic Circuits, Intro to Computer Science II

ORGANIZATIONAL AND TECHNICAL EXPERIENCE

Liquid Rocketry at Illinois | Spring 2025 – Present
- Modeled P&ID system architecture in Siemens NX and integrated components into the pressurant tank assembly by sourcing, importing, and constraining CAD hardware to satisfy spatial constraints.
- Created CAD geometries for canard-grid fin configurations and ran ANSYS Fluent CFD cases to quantify aerodynamic interactions across 0–20° deflection.
- Assessed pressurant tank options, produced mechanical integration models (CAD) and verified fit against vehicle structural constraints and P&ID.
- Engineered a KiCad PCB radio transmitter (USB-C + MCU) prototype enabling basic telemetry links for ground tests.

CAD Project – McDonnell F-101 Voodoo (Siemens NX) | Spring 2025
- Recreated a full McDonnell F-101 Voodoo in Siemens NX by extracting and scaling geometric dimensions from multi-view engineering drawings to accurately reconstruct fuselage, wing, and tail geometry.
- Integrated articulated control surfaces (ailerons, elevators, rudder) using parametric assemblies and constraints to simulate realistic aircraft deflection.

Model Rocket Project (OpenRocket, Excel) | Fall 2024
- Designed custom fin geometry in Siemens NX and fabricated a prototype to meet a target apogee; validated performance with OpenRocket simulations.
- Examined rocket flight data reaching 430 ft apogee with 25 ft downrange drift, evaluating in-flight stability and comparing observed trajectory with simulation predictions.
- Compiled a technical report and short video summarizing design decisions and flight results.

Glider Project | Fall 2024
- Fabricated and tested gliders to optimize aerodynamic performance, achieving 101 ft glide distance and 3.9 s flight time, ranking 6th in class.
- Performed iterative flight testing and analysis of glide path, mass distribution, and wing geometry to maximize lift-to-drag performance and flight endurance.

TECHNICAL SKILLS
Computer Languages: Python, C++, Java, JavaScript
Software: NX, Fusion 360, Eagle PCB, KiCad, OpenRocket, XFLR5, ANSYS Fluent, Excel
Shop Tools: Spot Welder, Belt Sander, Laser Cutter, CNC Plasma Cutter, Table Saw, Drill Press, Band Saw
Materials: Epoxy Resin, Fiberglass, Sheet Metal, Aluminum Pipes, Plywood

LEADERSHIP AND ACTIVITIES

Asian American Association | Fall 2024 – Present | Treasurer / Fundraising Officer
- Directed fundraising initiatives that achieved a 400% year-over-year increase in funds raised.
- Coached a team of interns in planning, launching, and managing their own independent fundraising projects.

Flight Club Aerospace | Summer 2021 – Spring 2024 | Landing Gear Research Lead | CAD | Fabrication
- Manufactured wing and control surfaces: cut foam ribs with a hot-wire cutter, trimmed aluminum spars with a circular saw, and applied epoxy & fiberglass layups to produce aerodynamic skins; aligned two 7-ft wings for flight testing.
- Modeled gussets and ribs in Fusion 360 and coordinated fit-checks between structural and aerodynamic components.
- Oversaw logistics for wing transport/disassembly/reassembly and assembled and presented landing-gear recommendations based on structural load and cost analyses.`;

// ── Default criteria ──────────────────────────────────────
const DEFAULTS = {
  industries: [
    { name: "Aerospace & Propulsion", roles: ["Propulsion Engineering Intern", "Aerospace Engineering Intern", "Rocket Systems Intern", "Combustion Research Intern"], active: true, primary: true },
    { name: "Mechanical Engineering", roles: ["Mechanical Engineering Intern", "Design Engineering Intern", "Structural Analysis Intern", "Manufacturing Intern"], active: true, primary: false },
    { name: "Defense & Space", roles: ["Systems Engineering Intern", "R&D Engineering Intern", "Test & Evaluation Intern", "Mission Systems Intern"], active: true, primary: false },
    { name: "Consulting", roles: ["Engineering Consulting Intern", "Technical Analyst Intern", "Operations Intern"], active: true, primary: false },
    { name: "Automotive", roles: ["Mechanical Engineering Intern", "Powertrain Intern", "Vehicle Dynamics Intern"], active: false, primary: false },
    { name: "Energy", roles: ["Thermal Systems Intern", "Mechanical Engineering Intern", "Process Engineering Intern"], active: false, primary: false }
  ],
  locations: ["Champaign, IL", "Los Angeles, CA", "Houston, TX", "Seattle, WA", "Remote"],
  experience: { "Internship": true, "Co-op": true, "Research (REU)": false, "Part-time": false },
  skills: ["ANSYS Fluent", "Siemens NX", "CAD", "Python", "KiCad", "OpenRocket"],
  blurb: ""
};

// ── State ─────────────────────────────────────────────────
let state, currentJobs = [], currentResumeText = "";
let editingIndustryIdx = null;

try {
  const s = localStorage.getItem("marcus_jsc");
  state = s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULTS));
} catch (e) { state = JSON.parse(JSON.stringify(DEFAULTS)); }

// ── API key management ────────────────────────────────────
function getApiKey() { return localStorage.getItem("marcus_api_key") || ""; }

function saveApiKey() {
  const val = document.getElementById("apiKeyInput").value.trim();
  if (!val.startsWith("sk-ant-")) {
    alert("That doesn't look like a valid Anthropic API key. It should start with sk-ant-");
    return;
  }
  localStorage.setItem("marcus_api_key", val);
  document.getElementById("setupScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  initApp();
}

function clearApiKey() {
  if (!confirm("Reset your API key? You'll need to enter it again.")) return;
  localStorage.removeItem("marcus_api_key");
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
  ["locations", "skills"].forEach(k => {
    renderTags(k);
    const inp = document.getElementById(k + "Input");
    if (inp) inp.addEventListener("keydown", e => { if (e.key === "Enter") addTag(k); });
  });
  renderExpPills();
  const blurbEl = document.getElementById("blurbText");
  blurbEl.value = state.blurb || "";
  blurbEl.addEventListener("input", () => { state.blurb = blurbEl.value; save(); });
  document.getElementById("newIndustryInput").addEventListener("keydown", e => { if (e.key === "Enter") addIndustry(); });
}

// ── Persist ───────────────────────────────────────────────
function save() {
  try { localStorage.setItem("marcus_jsc", JSON.stringify(state)); } catch (e) {}
  const t = document.getElementById("savedToast");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

// ── Top-level tabs ────────────────────────────────────────
function switchTopTab(name) {
  document.querySelectorAll(".top-tab").forEach((b, i) => b.classList.toggle("active", ["search","criteria"][i] === name));
  document.querySelectorAll(".top-panel").forEach(p => p.classList.remove("active"));
  const panel = document.getElementById("top-" + name);
  if (panel) { panel.classList.remove("hidden"); panel.classList.add("active"); }
  if (name === "criteria") {
    document.querySelectorAll(".top-panel").forEach(p => { if (p.id !== "top-criteria") p.classList.add("hidden"); });
  } else {
    document.querySelectorAll(".top-panel").forEach(p => { if (p.id !== "top-search") p.classList.add("hidden"); });
  }
}

// ── Criteria sub-tabs ─────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => { p.classList.remove("active"); p.classList.add("hidden"); });
  const btns = document.querySelectorAll(".tab-btn");
  const tabs = ["industries", "description", "xport"];
  const idx = tabs.indexOf(name);
  if (btns[idx]) btns[idx].classList.add("active");
  const panel = document.getElementById("tab-" + name);
  if (panel) { panel.classList.remove("hidden"); panel.classList.add("active"); }
  if (name === "xport") {
    document.getElementById("exportPre").textContent = JSON.stringify(state, null, 2);
  }
}

// ── Job search ────────────────────────────────────────────
async function runJobSearch() {
  const btn = document.getElementById("searchBtn");
  const btnText = document.getElementById("searchBtnText");
  const status = document.getElementById("searchStatus");

  btn.disabled = true;
  btnText.textContent = "Searching...";
  status.classList.remove("hidden");
  status.innerHTML = `<div class="spinner"></div><span>Searching the web for internships matching your criteria...</span>`;
  document.getElementById("jobResultsArea").classList.add("hidden");

  const activeIndustries = state.industries.filter(i => i.active);
  const roles = activeIndustries.flatMap(i => i.roles).slice(0, 8).join(", ");
  const locations = state.locations.join(", ");
  const skills = state.skills.join(", ");
  const primaryInd = state.industries.find(i => i.primary)?.name || "Aerospace & Propulsion";

  const prompt = `You are a job search assistant helping Marcus Yang, a sophomore Aerospace Engineering student at UIUC (GPA 3.57, James Scholar) find internships for Summer 2026.

His background: CFD (ANSYS Fluent), Siemens NX CAD, KiCad PCB design, Python, rocketry (Liquid Rocketry at Illinois), glider fabrication, fiberglass/epoxy composites, OpenRocket simulations.

Primary goal: ${primaryInd} internship. Also open to: ${activeIndustries.map(i=>i.name).join(", ")}.
Target roles include: ${roles}
Preferred locations: ${locations}
Key skills: ${skills}

Search the web right now for real, currently open internship positions matching these criteria for Summer 2026. Focus on legitimate job postings from company career pages, LinkedIn, Handshake, Indeed, or similar.

Return ONLY a JSON array of 6-8 jobs. No markdown, no code fences, just raw JSON. Each job object must have exactly these fields:
{
  "title": "exact job title",
  "company": "company name",
  "location": "city, state or Remote",
  "type": "Internship" or "Co-op",
  "url": "direct URL to job posting or company careers page",
  "description": "2-3 sentence summary of what the intern will do",
  "requirements": ["requirement 1", "requirement 2", "requirement 3"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "matchScore": 85
}

matchScore is 0-100 based on how well it matches Marcus's background. Sort by matchScore descending.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "API error " + response.status);
    }

    const data = await response.json();

    // Extract text from all content blocks
    const fullText = data.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n");

    // Parse JSON from response
    let jobs = [];
    const jsonMatch = fullText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jobs = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Could not parse job results. Please try again.");
    }

    currentJobs = jobs;
    renderJobResults(jobs);
    status.classList.add("hidden");

  } catch (err) {
    status.innerHTML = `<span style="color:#f87171;">Error: ${err.message}</span>`;
    console.error(err);
  }

  btn.disabled = false;
  btnText.textContent = "Find jobs for me";
}

// ── Render job results ────────────────────────────────────
function renderJobResults(jobs) {
  const tabBar = document.getElementById("jobTabBar");
  const panels = document.getElementById("jobPanels");
  const area = document.getElementById("jobResultsArea");

  tabBar.innerHTML = "";
  panels.innerHTML = "";

  jobs.forEach((job, i) => {
    // Tab button
    const btn = document.createElement("button");
    btn.className = "job-tab-btn" + (i === 0 ? " active" : "");
    btn.textContent = job.company;
    btn.title = job.title + " — " + job.company;
    btn.onclick = () => switchJobTab(i);
    tabBar.appendChild(btn);

    // Panel
    const panel = document.createElement("div");
    panel.className = "job-panel" + (i === 0 ? " active" : "");
    panel.id = "job-panel-" + i;

    const mySkills = state.skills.map(s => s.toLowerCase());
    const tagsHtml = (job.keywords || []).map(kw => {
      const isMatch = mySkills.some(s => kw.toLowerCase().includes(s) || s.includes(kw.toLowerCase()));
      return `<span class="job-tag${isMatch ? " match" : ""}">${kw}</span>`;
    }).join("");

    const reqHtml = (job.requirements || []).map(r => `<li style="font-size:13px;line-height:1.7;margin-bottom:4px;">${r}</li>`).join("");

    const matchColor = job.matchScore >= 80 ? "var(--accent)" : job.matchScore >= 60 ? "#fbbf24" : "var(--text-muted)";

    panel.innerHTML = `
      <div class="job-card">
        <div class="job-card-header">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
            <div>
              <p class="job-title">${job.title}</p>
              <p class="job-company">${job.company}</p>
              <div class="job-meta">
                <span>📍 ${job.location}</span>
                <span>🎯 ${job.type}</span>
                <span style="color:${matchColor};">★ ${job.matchScore}% match</span>
              </div>
            </div>
          </div>
        </div>

        <div class="job-section">
          <p class="job-section-title">About the role</p>
          <div class="job-desc"><p>${job.description}</p></div>
        </div>

        <div class="job-section">
          <p class="job-section-title">Requirements</p>
          <ul style="padding-left:18px;">${reqHtml}</ul>
        </div>

        <div class="job-section">
          <p class="job-section-title">Keywords <span style="font-size:10px;color:var(--accent);">● = matches your skills</span></p>
          <div class="job-tags">${tagsHtml}</div>
        </div>

        <div class="job-actions">
          <button class="btn btn-primary" onclick="generateResume(${i})">✦ Tailor my resume</button>
          ${job.url ? `<a class="btn" href="${job.url}" target="_blank" rel="noopener">View posting ↗</a>` : ""}
        </div>
      </div>
    `;
    panels.appendChild(panel);
  });

  document.getElementById("resultsTitle").textContent = `${jobs.length} results found`;
  area.classList.remove("hidden");
}

function switchJobTab(i) {
  document.querySelectorAll(".job-tab-btn").forEach((b, j) => b.classList.toggle("active", j === i));
  document.querySelectorAll(".job-panel").forEach((p, j) => p.classList.toggle("active", j === i));
}

// ── Resume tailoring ──────────────────────────────────────
async function generateResume(jobIdx) {
  const job = currentJobs[jobIdx];
  if (!job) return;

  document.getElementById("resumeModalTitle").textContent = `Tailored for: ${job.title} @ ${job.company}`;
  document.getElementById("resumeModalBody").innerHTML = `<div class="resume-loading"><div class="spinner"></div> Tailoring your resume to this role...</div>`;
  document.getElementById("resumeModalBackdrop").classList.add("open");

  const prompt = `You are a resume expert. Tailor the following resume for this specific job posting. 

JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Requirements: ${(job.requirements || []).join("; ")}
Keywords: ${(job.keywords || []).join(", ")}

INSTRUCTIONS:
- Reorder bullet points so the most relevant ones to THIS job appear first in each section
- Add or emphasize keywords from the job description naturally within existing bullet points where truthful
- Write a 2-sentence tailored summary at the top after the contact info, specific to this role
- Keep ALL original content — do not fabricate experience or skills
- Keep the same plain-text format as the original
- Do not add any explanation or preamble — return only the resume text

ORIGINAL RESUME:
${BASE_RESUME}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "Error generating resume.";
    currentResumeText = text;
    document.getElementById("resumeModalBody").textContent = text;

  } catch (err) {
    document.getElementById("resumeModalBody").textContent = "Error: " + err.message;
  }
}

function closeResumeModal() {
  document.getElementById("resumeModalBackdrop").classList.remove("open");
}

function copyResume() {
  if (!currentResumeText) return;
  navigator.clipboard.writeText(currentResumeText).then(() => {
    const btn = document.querySelector("#resumeModalBackdrop .btn-primary");
    if (btn) { btn.textContent = "Copied!"; setTimeout(() => btn.textContent = "Copy text", 2000); }
  });
}

// ── Industry cards ────────────────────────────────────────
function renderIndustryCards() {
  const grid = document.getElementById("industryGrid");
  grid.innerHTML = "";
  state.industries.forEach((ind, idx) => {
    const card = document.createElement("div");
    card.className = "industry-card" + (ind.primary ? " primary" : "") + (!ind.active ? " inactive" : "");
    const rolesHtml = ind.roles.slice(0, 4).map(r => `<span class="role-chip">${r}</span>`).join("");
    const more = ind.roles.length > 4 ? `<span class="role-chip">+${ind.roles.length - 4} more</span>` : "";
    card.innerHTML = `
      <div class="card-top">
        <span class="card-name">${ind.name}</span>
        ${ind.primary ? '<span class="priority-badge">Priority</span>' : ""}
      </div>
      <div class="role-chips">${rolesHtml}${more}</div>
      <div class="card-actions">
        <button class="btn btn-sm" onclick="openEditModal(${idx})">Edit roles</button>
        <button class="btn btn-sm" onclick="toggleIndustry(${idx})">${ind.active ? "Hide" : "Show"}</button>
        ${!ind.primary ? `<button class="btn btn-sm" onclick="setPrimary(${idx})">Set priority</button>` : ""}
      </div>`;
    grid.appendChild(card);
  });
}

function toggleIndustry(idx) { state.industries[idx].active = !state.industries[idx].active; save(); renderIndustryCards(); }
function setPrimary(idx) { state.industries.forEach((ind, i) => ind.primary = (i === idx)); save(); renderIndustryCards(); }
function addIndustry() {
  const inp = document.getElementById("newIndustryInput");
  const val = inp.value.trim();
  if (!val) return;
  state.industries.push({ name: val, roles: ["Engineering Intern"], active: true, primary: false });
  save(); renderIndustryCards(); inp.value = "";
}

// ── Edit roles modal ──────────────────────────────────────
function openEditModal(idx) {
  editingIndustryIdx = idx;
  document.getElementById("modalTitle").textContent = `Edit roles — ${state.industries[idx].name}`;
  document.getElementById("modalTextarea").value = state.industries[idx].roles.join("\n");
  document.getElementById("modalBackdrop").classList.add("open");
  document.getElementById("modalTextarea").focus();
}
function closeModal() { document.getElementById("modalBackdrop").classList.remove("open"); editingIndustryIdx = null; }
function saveModal() {
  if (editingIndustryIdx === null) return;
  state.industries[editingIndustryIdx].roles = document.getElementById("modalTextarea").value.split("\n").map(r => r.trim()).filter(Boolean);
  save(); renderIndustryCards(); closeModal();
}
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); closeResumeModal(); } });

// ── Tags ──────────────────────────────────────────────────
function renderTags(key) {
  const wrap = document.getElementById(key + "Tags");
  wrap.innerHTML = "";
  state[key].forEach((v, i) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.innerHTML = `${v}<button aria-label="Remove ${v}" onclick="removeTag('${key}',${i})">×</button>`;
    wrap.appendChild(span);
  });
}
function addTag(key) {
  const inp = document.getElementById(key + "Input");
  const val = inp.value.trim();
  if (!val || state[key].includes(val)) { inp.value = ""; return; }
  state[key].push(val); save(); renderTags(key); inp.value = "";
}
function removeTag(key, i) { state[key].splice(i, 1); save(); renderTags(key); }

// ── Pills ─────────────────────────────────────────────────
function renderExpPills() {
  const wrap = document.getElementById("expPills");
  wrap.innerHTML = "";
  Object.keys(state.experience).forEach(label => {
    const btn = document.createElement("button");
    btn.className = "pill-opt" + (state.experience[label] ? " active" : "");
    btn.textContent = label;
    btn.onclick = () => { state.experience[label] = !state.experience[label]; save(); renderExpPills(); };
    wrap.appendChild(btn);
  });
}

// ── Export ────────────────────────────────────────────────
function copyJSON() {
  navigator.clipboard.writeText(JSON.stringify(state, null, 2)).then(() => {
    const el = document.getElementById("copyConfirm");
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2000);
  });
}
function downloadJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "marcus-job-criteria.json" });
  a.click();
}
