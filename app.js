// ── Default data ──────────────────────────────────────────
const DEFAULTS = {
  industries: [
    {
      name: "Aerospace & Propulsion",
      roles: ["Propulsion Engineering Intern", "Aerospace Engineering Intern", "Rocket Systems Intern", "Combustion Research Intern"],
      active: true,
      primary: true
    },
    {
      name: "Mechanical Engineering",
      roles: ["Mechanical Engineering Intern", "Design Engineering Intern", "Structural Analysis Intern", "Manufacturing Intern"],
      active: true,
      primary: false
    },
    {
      name: "Defense & Space",
      roles: ["Systems Engineering Intern", "R&D Engineering Intern", "Test & Evaluation Intern", "Mission Systems Intern"],
      active: true,
      primary: false
    },
    {
      name: "Consulting",
      roles: ["Engineering Consulting Intern", "Technical Analyst Intern", "Operations Intern"],
      active: true,
      primary: false
    },
    {
      name: "Automotive",
      roles: ["Mechanical Engineering Intern", "Powertrain Intern", "Vehicle Dynamics Intern"],
      active: false,
      primary: false
    },
    {
      name: "Energy",
      roles: ["Thermal Systems Intern", "Mechanical Engineering Intern", "Process Engineering Intern"],
      active: false,
      primary: false
    }
  ],
  locations: ["Champaign, IL", "Los Angeles, CA", "Houston, TX", "Seattle, WA", "Remote"],
  experience: {
    "Internship": true,
    "Co-op": true,
    "Research (REU)": false,
    "Part-time": false
  },
  skills: ["ANSYS Fluent", "Siemens NX", "CAD", "Python", "KiCad", "OpenRocket"],
  blurb: ""
};

// ── State ─────────────────────────────────────────────────
let state;
try {
  const stored = localStorage.getItem("marcus_jsc");
  state = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEFAULTS));
} catch (e) {
  state = JSON.parse(JSON.stringify(DEFAULTS));
}

let editingIndustryIdx = null;

// ── Persist ───────────────────────────────────────────────
function save() {
  try { localStorage.setItem("marcus_jsc", JSON.stringify(state)); } catch (e) {}
  const toast = document.getElementById("savedToast");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

// ── Tabs ──────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    document.getElementById("tab-" + tab).classList.add("active");
    if (tab === "export") renderExport();
  });
});

// ── Industry cards ────────────────────────────────────────
function renderIndustryCards() {
  const grid = document.getElementById("industryGrid");
  grid.innerHTML = "";

  state.industries.forEach((ind, idx) => {
    const card = document.createElement("div");
    card.className = "industry-card" + (ind.primary ? " primary" : "") + (!ind.active ? " inactive" : "");

    const rolesHtml = ind.roles
      .slice(0, 4)
      .map(r => `<span class="role-chip">${r}</span>`)
      .join("");
    const moreCount = ind.roles.length - 4;
    const moreHtml = moreCount > 0 ? `<span class="role-chip">+${moreCount} more</span>` : "";

    card.innerHTML = `
      <div class="card-top">
        <span class="card-name">${ind.name}</span>
        ${ind.primary ? '<span class="priority-badge">Priority</span>' : ""}
      </div>
      <div class="role-chips">${rolesHtml}${moreHtml}</div>
      <div class="card-actions">
        <button class="btn btn-sm" onclick="openEditModal(${idx})">Edit roles</button>
        <button class="btn btn-sm" onclick="toggleIndustry(${idx})">${ind.active ? "Hide" : "Show"}</button>
        ${!ind.primary ? `<button class="btn btn-sm" onclick="setPrimary(${idx})">Set priority</button>` : ""}
      </div>
    `;
    grid.appendChild(card);
  });
}

function toggleIndustry(idx) {
  state.industries[idx].active = !state.industries[idx].active;
  save();
  renderIndustryCards();
}

function setPrimary(idx) {
  state.industries.forEach((ind, i) => { ind.primary = (i === idx); });
  save();
  renderIndustryCards();
}

function addIndustry() {
  const inp = document.getElementById("newIndustryInput");
  const val = inp.value.trim();
  if (!val) return;
  state.industries.push({ name: val, roles: ["Engineering Intern"], active: true, primary: false });
  save();
  renderIndustryCards();
  inp.value = "";
}

document.getElementById("newIndustryInput").addEventListener("keydown", e => {
  if (e.key === "Enter") addIndustry();
});

// ── Edit roles modal ──────────────────────────────────────
function openEditModal(idx) {
  editingIndustryIdx = idx;
  const ind = state.industries[idx];
  document.getElementById("modalTitle").textContent = `Edit roles — ${ind.name}`;
  document.getElementById("modalTextarea").value = ind.roles.join("\n");
  document.getElementById("modalBackdrop").classList.add("open");
  document.getElementById("modalTextarea").focus();
}

function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("open");
  editingIndustryIdx = null;
}

function saveModal() {
  if (editingIndustryIdx === null) return;
  const raw = document.getElementById("modalTextarea").value;
  state.industries[editingIndustryIdx].roles = raw.split("\n").map(r => r.trim()).filter(Boolean);
  save();
  renderIndustryCards();
  closeModal();
}

document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

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
  state[key].push(val);
  save();
  renderTags(key);
  inp.value = "";
}

function removeTag(key, i) {
  state[key].splice(i, 1);
  save();
  renderTags(key);
}

["locations", "skills"].forEach(k => {
  renderTags(k);
  const inp = document.getElementById(k + "Input");
  if (inp) inp.addEventListener("keydown", e => { if (e.key === "Enter") addTag(k); });
});

// ── Experience pills ──────────────────────────────────────
function renderExpPills() {
  const wrap = document.getElementById("expPills");
  wrap.innerHTML = "";
  Object.keys(state.experience).forEach(label => {
    const btn = document.createElement("button");
    btn.className = "pill-opt" + (state.experience[label] ? " active" : "");
    btn.textContent = label;
    btn.onclick = () => {
      state.experience[label] = !state.experience[label];
      save();
      renderExpPills();
    };
    wrap.appendChild(btn);
  });
}
renderExpPills();

// ── Blurb ─────────────────────────────────────────────────
const blurbEl = document.getElementById("blurbText");
blurbEl.value = state.blurb || "";
blurbEl.addEventListener("input", () => { state.blurb = blurbEl.value; save(); });

// ── Export ────────────────────────────────────────────────
function renderExport() {
  const pre = document.getElementById("exportPre");
  pre.textContent = JSON.stringify(state, null, 2);
}

function copyJSON() {
  const json = JSON.stringify(state, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    const el = document.getElementById("copyConfirm");
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2000);
  });
}

function downloadJSON() {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "marcus-job-criteria.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Init ──────────────────────────────────────────────────
renderIndustryCards();
