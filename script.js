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
    document.getElementById("board").innerHTML = '<div class="empty">Please enter a search term</div>';
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
    
    if (!response.ok) {
      throw new Error("HTTP error: " + response.status);
    }
    
    const data = await response.json();
    
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

// Render notes with more info
function render(companies) {
  const board = document.getElementById("board");
  board.innerHTML = "";
  
  colorIndex = 0;
  
  companies.forEach((company, idx) => {
    const note = document.createElement("div");
    note.className = "note";
    note.style.backgroundColor = getNextColor();
    note.style.animationDelay = (idx * 0.03) + "s";
    
    // Build comprehensive note content
    let content = `<b class="note-name">${company.name || "Unknown"}</b>`;
    
    if (company.sector) {
      content += `<span class="note-sector">${company.sector}</span>`;
    }
    
    if (company.round || company.amount) {
      content += `<span class="note-meta">${company.round || ""} • ${company.amount || ""}</span>`;
    }
    
    if (company.location) {
      content += `<span class="note-location">📍 ${company.location}</span>`;
    }
    
    if (company.cofounders) {
      const cofounders = company.cofounders.length > 60 ? company.cofounders.substring(0, 60) + "..." : company.cofounders;
      content += `<span class="note-cofounders">👥 ${cofounders}</span>`;
    }
    
    if (company.investors) {
      const investors = company.investors.length > 60 ? company.investors.substring(0, 60) + "..." : company.investors;
      content += `<span class="note-investors">💰 ${investors}</span>`;
    }
    
    if (company.traction) {
      const traction = company.traction.length > 80 ? company.traction.substring(0, 80) + "..." : company.traction;
      content += `<p class="note-traction">📈 ${traction}</p>`;
    }
    
    note.innerHTML = content;
    note.onclick = () => showDetails(company);
    
    board.appendChild(note);
  });
}

// Show full company details in modal
function showDetails(company) {
  const modalBody = document.getElementById("modal-body");
  const modal = document.getElementById("modal");
  
  // Build links
  const linksHtml = company.links ? company.links.map(l => 
    `<a href="${l.url}" target="_blank">${l.label || "Link"}</a>`
  ).join(" | ") : "None";
  
  // Build modal content with ALL available info
  let modalContent = `
    <h2>${company.name}</h2>
  `;
  
  // Basic info
  if (company.sector) modalContent += `<div class="detail-row"><span class="label">Industry:</span> ${company.sector}</div>`;
  if (company.round) modalContent += `<div class="detail-row"><span class="label">Funding Stage:</span> ${company.round}</div>`;
  if (company.amount) modalContent += `<div class="detail-row"><span class="label">Amount Raised:</span> ${company.amount}</div>`;
  if (company.location) modalContent += `<div class="detail-row"><span class="label">Location:</span> ${company.location}</div>`;
  if (company.reportDate) modalContent += `<div class="detail-row"><span class="label">Report Date:</span> ${company.reportDate}</div>`;
  if (company.valuation) modalContent += `<div class="detail-row"><span class="label">Valuation:</span> ${company.valuation}</div>`;
  
  modalContent += `<hr>`;
  
  // Cofounders
  if (company.cofounders) {
    modalContent += `
      <div class="detail-row"><span class="label">Cofounders:</span></div>
      <p class="summary-text">${company.cofounders}</p>
    `;
  }
  
  // Traction
  if (company.traction) {
    modalContent += `
      <div class="detail-row"><span class="label">Traction:</span></div>
      <p class="summary-text">${company.traction}</p>
    `;
  }
  
  // Investors
  if (company.investors) {
    modalContent += `
      <div class="detail-row"><span class="label">Investors:</span></div>
      <p class="summary-text">${company.investors}</p>
    `;
  }
  
  // Summary
  if (company.summary) {
    modalContent += `
      <hr>
      <div class="detail-row"><span class="label">Summary:</span></div>
      <p class="summary-text">${company.summary}</p>
    `;
  }
  
  // Notes
  if (company.notes) {
    modalContent += `
      <div class="detail-row"><span class="label">Notes:</span></div>
      <p class="summary-text">${company.notes}</p>
    `;
  }
  
  // Links
  modalContent += `
    <hr>
    <div class="detail-row"><span class="label">Sources:</span> ${linksHtml}</div>
  `;
  
  modalBody.innerHTML = modalContent;
  modal.classList.add("active");
}

function closeModal() {
  document.getElementById("modal").classList.remove("active");
}

// Close modal on outside click
document.getElementById("modal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});

// Close button
document.getElementById("close-btn").addEventListener("click", closeModal);

// Enter key triggers search
document.getElementById("prompt").addEventListener("keypress", function(e) {
  if (e.key === "Enter") run();
});

// Button click triggers search
document.getElementById("search-btn").addEventListener("click", run);

console.log("VCDD script loaded");