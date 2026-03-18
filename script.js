const BACKEND_URL = "https://sticky-dashboard.vcddbot.workers.dev/api/filter-startups";
const BACKEND_COMPANY_URL = "https://sticky-dashboard.vcddbot.workers.dev/api/company";
const NOTE_COLORS = ["#fff59d", "#f8bbd0", "#bbdefb", "#c8e6c9", "#e1bee7", "#ffe0b2", "#b2dfdb"];

let colorIndex = 0;

function getNextColor() {
  const color = NOTE_COLORS[colorIndex % NOTE_COLORS.length];
  colorIndex++;
  return color;
}

async function run() {
  const prompt = document.getElementById("prompt").value.trim();
  if (!prompt) {
    document.getElementById("board").innerHTML = '<p style="color:#666;font-style:italic;">Enter a search to see startups</p>';
    return;
  }
  
  document.getElementById("board").innerHTML = '<p>Searching...</p>';
  
  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    render(data.companies || []);
    document.getElementById("summary").textContent = data.summary || "";
  } catch (err) {
    document.getElementById("board").innerHTML = '<p style="color:red;">Error: ' + err.message + '</p>';
  }
}

function render(list) {
  const board = document.getElementById("board");
  board.innerHTML = "";
  
  if (list.length === 0) {
    board.innerHTML = '<p style="color:#666;">No startups found</p>';
    return;
  }
  
  list.forEach((c, idx) => {
    const div = document.createElement("div");
    div.className = "note";
    div.style.backgroundColor = getNextColor();
    div.onclick = () => showDetails(c);
    
    div.innerHTML = `
      <b>${c.name}</b><br>
      <span style="font-size:12px;color:#555;">${c.sector}</span><br>
      <span style="font-size:11px;color:#777;">${c.round} • ${c.amount}</span>
    `;
    board.appendChild(div);
  });
}

function showDetails(company) {
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modal-content");
  
  const linksHtml = company.links ? company.links.map(l => 
    `<a href="${l.url}" target="_blank" style="color:#1976d2;">${l.label || 'Source'}</a>`
  ).join(" | ") : "None";
  
  modalContent.innerHTML = `
    <h2>${company.name}</h2>
    <p><strong>Sector:</strong> ${company.sector || "N/A"}</p>
    <p><strong>Funding:</strong> ${company.round || "N/A"} • ${company.amount || "N/A"}</p>
    <p><strong>Location:</strong> ${company.location || "N/A"}</p>
    <p><strong>Date:</strong> ${company.reportDate || "N/A"}</p>
    <hr>
    <p><strong>Summary:</strong></p>
    <p>${company.summary || "No summary available"}</p>
    <hr>
    <p><strong>Links:</strong> ${linksHtml}</p>
    <button onclick="closeModal()" style="margin-top:20px;padding:8px 16px;cursor:pointer;">Close</button>
  `;
  
  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// Close modal on outside click
window.onclick = function(event) {
  const modal = document.getElementById("modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
}