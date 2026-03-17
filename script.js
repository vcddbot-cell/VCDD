const URL="http://localhost:3001/api/filter-startups";

async function run(){
 const p=document.getElementById("prompt").value;
 const res=await fetch(URL,{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({prompt:p})
 });
 const data=await res.json();
 render(data.companies||[]);
}

function render(list){
 const board=document.getElementById("board");
 board.innerHTML="";
 list.forEach(c=>{
  const div=document.createElement("div");
  div.className="note";
  div.innerHTML=`<b>${c.name}</b><br>${c.summary}`;
  board.appendChild(div);
 });
}

run();
