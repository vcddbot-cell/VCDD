const boardEl = document.getElementById("board");
const detailPanelEl = document.getElementById("detailPanel");
const promptInputEl = document.getElementById("promptInput");
const runPromptBtnEl = document.getElementById("runPromptBtn");
const promptSummaryEl = document.getElementById("promptSummary");

// Updated to use Cloudflare Tunnel public URL
const BACKEND_URL = "https://cassette-ala-percent-kay.trycloudflare.com/api/filter-startups";
const NOTE_COLORS = ["yellow", "pink", "blue", "green", "purple"];

let companies = [];

async function runPrompt(promptText) {
  const cleanPrompt = String(promptText || "").trim() || "show me all startups";

  promptSummaryEl.textContent = "Loading notes...";
  boardEl.innerHTML = `
    <div class="empty-state">
      <h3>Loading</h3>
      <p>Asking OpenClaw for matching startup notes.</p>
    </div>
  `;

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: cleanPrompt })
    });

    if (!response.ok) {
      throw new Error("Backend request failed");
    }

    const data = await response.json();
    companies = Array.isArray(data.companies) ? data.companies : [];

    renderBoard(companies);
    promptSummaryEl.innerHTML = data.summary
      ? escapeHtml(data.summary)
      : `Showing ${companies.length} startup note${companies.length === 1 ? "" : "s"}.`;
  } catch (error) {
    console.error(error);
    promptSummaryEl.textContent = "Could not load notes from backend.";
    boardEl.innerHTML = `
      <div class="empty-state">
        <h3>Could not reach the backend.</h3>
        <p>Check that your backend is running and that BACKEND_URL in <code>script.js</code> is correct.</p>
      </div>
    `;
  }
}

function renderBoard(items) {
  if (!items.length) {
    boardEl.innerHTML = `
      <div class="empty-state">
        <h3>No sticky notes matched that prompt.</h3>
        <p>Try something broader like "show me all startups" or "show me biotech from the last 7 days."</p>
      </div>
    `;
    return;
  }

  const sortedItems = [...items].sort((a, b) => normalizeDate(b.reportDate).localeCompare(normalizeDate(a.reportDate)));

  boardEl.innerHTML = sortedItems.map((company, index) => {
    const color = company.color && NOTE_COLORS.includes(company.color)
      ? company.color
      : NOTE_COLORS[index % NOTE_COLORS.length];

    return `
      <button class="note ${color}" data-id="${escapeHtml(company.id)}" type="button">
        <div>
          <h3>${escapeHtml(company.name)}</h3>
          <p>${escapeHtml(truncate(company.summary, 115))}</p>
        </div>
        <div class="note-meta">
          <span class="tag">${escapeHtml(company.sector || "Company")}</span>
          <span>${escapeHtml(company.reportDate || "")}</span>
        </div>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".note").forEach(note => {
    note.addEventListener("click", () => {
      const company = companies.find(item => item.id === note.dataset.id);
      if (company) renderDetails(company);
    });
  });
}

function renderDetails(company) {
  const articleLinks = (company.links || [])
    .map(link => `
      <a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">
        ${escapeHtml(link.label || "Open link")}
      </a>
    `)
    .join("");

  detailPanelEl.innerHTML = `
    <h2 class="company-name">${escapeHtml(company.name)}</h2>
    <div class="tag">${escapeHtml(company.sector || "Company")}</div>
    <p class="company-summary">${escapeHtml(company.summary || "")}</p>

    <div class="meta-grid">
      <div class="meta-item">
        <strong>Funding round</strong>
        <span>${escapeHtml(company.round || "—")}</span>
      </div>
      <div class="meta-item">
        <strong>Amount</strong>
        <span>${escapeHtml(company.amount || "—")}</span>
      </div>
      <div class="meta-item">
        <strong>Location</strong>
        <span>${escapeHtml(company.location || "—")}</span>
      </div>
      <div class="meta-item">
        <strong>Report date</strong>
        <span>${escapeHtml(company.reportDate || "—")}</span>
      </div>
    </div>

    ${articleLinks ? `<div class="links">${articleLinks}</div>` : ""}
    ${company.notes ? `<div class="detail-notes"><strong>OpenClaw notes:</strong><br>${escapeHtml(company.notes)}</div>` : ""}
  `;
}

function normalizeDate(value) {
  return String(value || "").trim().slice(0, 10);
}

function truncate(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength - 1) + "…" : text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return String(value ?? "").replaceAll('"', "&quot;");
}

runPromptBtnEl.addEventListener("click", () => runPrompt(promptInputEl.value));

promptInputEl.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    runPrompt(promptInputEl.value);
  }
});

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    promptInputEl.value = chip.dataset.prompt || "";
    runPrompt(promptInputEl.value);
  });
});

runPrompt("show me all startups");
