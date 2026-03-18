async function run() {
  const prompt = document.getElementById("prompt").value;
  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  render(data.companies || []);
}

function render(list) {
  const board = document.getElementById("board");
  board.innerHTML = "";
  list.forEach(c => {
    const div = document.createElement("div");
    div.className = "note";
    div.innerHTML = `<b>${c.name}</b><br>${c.summary || c.sector || ""}`;
    board.appendChild(div);
  });
}

// Auto-run on load
run();