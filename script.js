// Configuration - uses Cloudflare Worker backend
const API_URL = "https://sticky-dashboard.vcddbot.workers.dev/api/filter-startups";

const NOTE_COLORS = [
  "#fef3c7", "#fce7f3", "#dbeafe", "#d1fae5", 
  "#ede9fe", "#ffedd5", "#c7f9cc", "#e0f2fe"
];

let colorIndex = 0;

function getNextColor() {
  const color = NOTE_COLORS[colorIndex % NOTE_COLORS.length];
  colorIndex++;
  return color;
}

// Main search function
async function run() {
  const prompt = document.getElementById("prompt").value.trim();
  if (!prompt) {
    alert("Please enter a search term");
    return;
  }
  
  console.log("Searching for:", prompt);
  
  const board = document.getElementById("board");
  const summary = document.getElementById("summary");
  const searchContainer = document.getElementById("search-container");
  
  // Show loading
  board.innerHTML = '<div class="loading">Searching...</div>';
  summary.textContent = "";
  
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: prompt })
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      throw new Error("HTTP error: " + response.status);
    }
    
    const data = await response.json();
    console.log("Data received:", data);
    
    // Move search box to top
    searchContainer.classList.add("has-results");
    
    // Render results
    if (data.companies && data.companies.length > 0) {
      render(data.companies);
      summary.textContent = data.summary || "";
    } else {
      board.innerHTML = '<div class="empty">No notes found for "' + prompt + '"</div>';
    }
  } catch (err) {
    console.error("Error:", err);
    board.innerHTML = '<div class="empty">Error: ' + err.message + '</div>';
  }
}

// Render notes
function render(companies) {
  const board = document.getElementById("board");
  board.innerHTML = "";
  
  colorIndex = 0;
  
  companies.forEach((company, idx) => {
    const note = document.createElement("div");
    note.className = "note";
    note.style.backgroundColor = getNextColor();
    note.style.animationDelay = (idx * 0.03) + "s";
    
    // Build note content
    let content = `<b class="note-name">${company.name || "Unknown"}</b>`;
    
    if (company.sector) {
      content += `<span class="note-sector">${company.sector}</span>`;
    }
    
    if (company.round || company.amount) {
      content += `<span class="note-meta">${company.round || ""} ${company.amount || ""}</span>`;
    }
    
    if (company.summary) {
      const shortSummary = company.summary.length > 100 ? company.summary.substring(0, 100) + "..." : company.summary;
      content += `<p class="note-summary">${shortSummary}</p>`;
    }
    
    note.innerHTML = content;
    note.onclick = () => showDetails(company);
    
    board.appendChild(note);
  });
  
  console.log("Rendered", companies.length, "notes");
}

// Show company details
function showDetails(company) {
  const modalBody = document.getElementById("modal-body");
  const modal = document.getElementById("modal");
  
  const linksHtml = company.links ? company.links.map(l => 
    `<a href="${l.url}" target="_blank">${l.label || "Link"}</a>`
  ).join(" ") : "None";
  
  modalBody.innerHTML = `
    <h2>${company.name}</h2>
    <div class="detail-row"><span class="label">Sector:</span> ${company.sector || "N/A"}</div>
    <div class="detail-row"><span class="label">Funding:</span> ${company.round || "N/A"} ${company.amount || ""}</div>
    <div class="detail-row"><span class="label">Location:</span> ${company.location || "N/A"}</div>
    <div class="detail-row"><span class="label">Date:</span> ${company.reportDate || "N/A"}</div>
    <hr>
    <div class="detail-row"><span class="label">Summary:</span></div>
    <p class="summary-text">${company.summary || "No summary"}</p>
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

console.log("VCDD script loaded");

// Attach event listeners after DOM is ready
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("search-btn").addEventListener("click", run);
});