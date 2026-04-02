// Configuration - uses Cloudflare Worker backend
const API_URL = "https://sticky-dashboard.vcddbot.workers.dev/api/filter-startups";
const CHAT_API_URL = "https://sticky-dashboard.vcddbot.workers.dev/api/chat";
const ADD_NOTE_URL = "https://sticky-dashboard.vcddbot.workers.dev/api/add-note";

const NOTE_COLORS = [
  "#fef3c7", "#fce7f3", "#dbeafe", "#d1fae5", 
  "#ede9fe", "#ffedd5", "#c7f9cc", "#e0f2fe"
];

let colorIndex = 0;
let currentNoteCompany = null;
let chatConversationId = "default";

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
    
    // Show note indicator if notes exist
    if (company.notes && company.notes.length > 0) {
      content += `<span class="note-indicator">📝 ${company.notes.length} note${company.notes.length > 1 ? 's' : ''}</span>`;
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
  
  // Notes section
  if (company.notes && company.notes.length > 0) {
    modalContent += `<hr><div class="detail-row"><span class="label">Notes:</span></div>`;
    company.notes.forEach(note => {
      const date = new Date(note.addedAt).toLocaleDateString();
      // Convert URLs to clickable links
      const noteTextWithLinks = note.text.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank">$1</a>'
      );
      modalContent += `<p class="summary-text note-item">📝 ${noteTextWithLinks} <small>(${date})</small></p>`;
    });
  }
  
  // Add Note button
  modalContent += `
    <hr>
    <button onclick="openNoteModal('${company.name}')" class="add-note-btn">+ Add Note to ${company.name}</button>
  `;
  
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

// ============ CHAT FUNCTIONS ============

function toggleChat() {
  const panel = document.getElementById("chat-panel");
  const toggle = document.getElementById("chat-toggle");
  if (panel.classList.contains("collapsed")) {
    panel.classList.remove("collapsed");
    toggle.textContent = "−";
  } else {
    panel.classList.add("collapsed");
    toggle.textContent = "+";
  }
}

async function sendChat() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message) return;
  
  const messagesDiv = document.getElementById("chat-messages");
  
  // Add user message
  addChatMessage(message, "user");
  input.value = "";
  
  // Show typing indicator
  const typingDiv = document.createElement("div");
  typingDiv.className = "chat-message bot typing";
  typingDiv.textContent = "VCDD is thinking...";
  messagesDiv.appendChild(typingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: message,
        conversationId: chatConversationId 
      })
    });
    
    const data = await response.json();
    
    // Remove typing indicator
    messagesDiv.removeChild(typingDiv);
    
    // Add bot response
    addChatMessage(data.response || "Sorry, I couldn't process that.", "bot");
    
    // If there's an action (add_note), actually execute it
    let parsedAction = data.action;
    if (!parsedAction && data.response) {
      // Try format 1: {"action":"add_note", "company_name": "...", "note": "..."}
      try {
        const actionMatch = data.response.match(/\{"action"\s*:\s*"add_note"\s*,\s*"company_name"\s*:\s*"([^"]+)"\s*,\s*"note"\s*:\s*"([^"]+)"\}/);
        if (actionMatch) {
          parsedAction = { action: "add_note", company_name: actionMatch[1], note: actionMatch[2] };
        }
      } catch {}
      
      // Try format 2: [INFO]COMPANY_NAME|NOTE[END]
      if (!parsedAction) {
        try {
          const infoMatch = data.response.match(/\[INFO\]([^|]+)\|([^\[]+)\[END\]/);
          if (infoMatch) {
            parsedAction = { action: "add_note", company_name: infoMatch[1].trim(), note: infoMatch[2].trim() };
          }
        } catch {}
      }
      
      // Try format 3: company object with id + notes
      if (!parsedAction) {
        try {
          const companyMatch = data.response.match(/"id"\s*:\s*"([^"]+)"[^}]*"notes"\s*:\s*\[\s*\{[^}]*"text"\s*:\s*"([^"]+)"/);
          if (companyMatch) {
            const companiesRes = await fetch('https://sticky-dashboard.vcddbot.workers.dev/api/companies');
            const companiesData = await companiesRes.json();
            const company = companiesData.companies.find(c => c.id === companyMatch[1]);
            if (company) {
              parsedAction = { action: "add_note", company_name: company.name, note: companyMatch[2] };
            }
          }
        } catch {}
      }
    }
    
    if (parsedAction && parsedAction.action === "add_note") {
      try {
        const noteRes = await fetch(ADD_NOTE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: parsedAction.company_name,
            note: parsedAction.note
          })
        });
        const noteData = await noteRes.json();
        
        if (noteData.success) {
          addChatMessage(`✅ Note added to ${parsedAction.company_name}: "${parsedAction.note}"`, "bot");
          // Refresh current search results
          run();
        } else {
          addChatMessage(`❌ Failed to add note: ${noteData.error}`, "bot");
        }
      } catch (err) {
        addChatMessage(`❌ Error adding note: ${err.message}`, "bot");
      }
    }
    
  } catch (err) {
    messagesDiv.removeChild(typingDiv);
    addChatMessage("Error: Could not connect to assistant.", "bot");
  }
}

function addChatMessage(text, sender) {
  const messagesDiv = document.getElementById("chat-messages");
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-message ${sender}`;
  
  // Clean up text - remove any remaining think/monologue artifacts
  let displayText = text
    .replace(/^think>[\s\S]*?\n\n?/gi, '')
    .replace(/^analyzing[\s\S]*?\n\n?/gi, '')
    .replace(/^Based on[\s\S]*?\n\n?/gi, '')
    .trim();
  
  msgDiv.textContent = displayText;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Chat enter key
document.getElementById("chat-input").addEventListener("keypress", function(e) {
  if (e.key === "Enter") sendChat();
});

// ============ NOTE FUNCTIONS ============

function openNoteModal(companyName) {
  currentNoteCompany = companyName;
  document.getElementById("note-company-name").textContent = companyName;
  document.getElementById("note-modal").classList.add("active");
  document.getElementById("note-input").value = "";
  document.getElementById("note-input").focus();
}

function closeNoteModal() {
  document.getElementById("note-modal").classList.remove("active");
  currentNoteCompany = null;
}

async function saveNote() {
  const noteText = document.getElementById("note-input").value.trim();
  if (!noteText || !currentNoteCompany) return;
  
  const saveBtn = document.getElementById("note-save");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  
  try {
    const response = await fetch(ADD_NOTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: currentNoteCompany,
        note: noteText
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      addChatMessage(`✅ Note added to ${currentNoteCompany}: "${noteText}"`, "bot");
      closeNoteModal();
      // Refresh current search results
      run();
    } else {
      addChatMessage(`❌ Failed to add note: ${data.error}`, "bot");
    }
  } catch (err) {
    addChatMessage(`❌ Error: ${err.message}`, "bot");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Note";
  }
}

console.log("VCDD script loaded");
