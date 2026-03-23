// Configuration - uses Cloudflare Worker backend
const API_URL = "https://sticky-dashboard.vcddbot.workers.dev/api/filter-startups";
const NOTE_COLORS = [
  "#fef3c7", "#fce7f3", "#dbeafe", "#d1fae5", 
  "#ede9fe", "#ffedd5", "#c7f9cc", "#e0f2fe"
];

let colorIndex = 0;
let lastPrompt = "";

function getNextColor() {
  const color = NOTE_COLORS[colorIndex % NOTE_COLORS.length];
  colorIndex++;
  return color;
}

// Main search function - calls the backend API
async function run() {
  const prompt = document.getElementById("prompt").value.trim();
  if (!prompt) return;
  
  lastPrompt = prompt;
  
  // Show loading
  document.getElementById("board").innerHTML = '<div class="loading">Searching...</div>';
  document.getElementById("summary").textContent = "";
  
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    
    const data = await res.json();
    render(data.companies || [], prompt);
    document.getElementById("summary").textContent = data.summary || "";
  } catch (err) {
    document.getElementById("board").innerHTML = '<div class="empty">Error: ' + err.message + '</div>';
  }
}

// Render notes with flexible layout
function render(list, prompt) {
  const board = document.getElementById("board");
  
  colorIndex = 0; // Reset colors for each search
  
  if (list.length === 0) {
    board.innerHTML = '<div class="empty">No notes found for "' + prompt + '"</div>';
    return;
  }
  
  board.innerHTML = "";
  
  // Create flexible grid layout
  list.forEach((c, idx) => {
    const note = document.createElement("div");
    note.className = "note";
    note.style.backgroundColor = getNextColor();
    note.style.animationDelay = (idx * 0.03) + "s";
    note.onclick = () => showDetails(c);
    
    // Flexible content - show different info based on what's available
    let content = `<b class="note-name">${c.name}</b>`;
    
    if (c.sector) {
      content += `<span class="note-sector">${c.sector}</span>`;
    }
    
    if (c.round || c.amount) {
      content += `<span class="note-meta">${c.round || ""} ${c.amount || ""}</span>`;
    }
    
    if (c.summary) {
      const shortSummary = c.summary.length > 100 ? c.summary.substring(0, 100) + "..." : c.summary;
      content += `<p class="note-summary">${shortSummary}</p>`;
    }
    
    note.innerHTML = content;
    board.appendChild(note);
  });
}

// Show company details in modal
function showDetails(company) {
  const modalBody = document.getElementById("modal-body");
  const modal = document.getElementById("modal");
  
  const linksHtml = company.links ? company.links.map(l => 
    `<a href="${l.url}" target="_blank">${l.label || "Source"}</a>`
  ).join(" ") : "None";
  
  modalBody.innerHTML = `
    <h2>${company.name}</h2>
    <div class="detail-row"><span class="label">Sector:</span> ${company.sector || "N/A"}</div>
    <div class="detail-row"><span class="label">Funding:</span> ${company.round || "N/A"} • ${company.amount || "N/A"}</div>
    <div class="detail-row"><span class="label">Location:</span> ${company.location || "N/A"}</div>
    <div class="detail-row"><span class="label">Date:</span> ${company.reportDate || "N/A"}</div>
    <hr>
    <div class="detail-row"><span class="label">Summary:</span></div>
    <p class="summary-text">${company.summary || "No summary available"}</p>
    <hr>
    <div class="detail-row"><span class="label">Links:</span> ${linksHtml}</div>
  `;
  
  modal.classList.add("active");
}

function closeModal() {
  document.getElementById("modal").classList.remove("active");
}

// Close modal on outside click
document.getElementById("modal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});

// Enter key triggers search
document.getElementById("prompt").addEventListener("keypress", function(e) {
  if (e.key === "Enter") run();
});