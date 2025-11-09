// Simple spin wheel implementation with localStorage username attempt tracking and claim POST (requires webhook URL).
(() => {
  const prizes = [
    {label: "iPhone", type:"big"},
    {label: "₹1000", type:"big"},
    {label: "₹500", type:"mid"},
    {label: "₹200", type:"mid"},
    {label: "Free Spin", type:"free"},
    {label: "₹100", type:"mid"},
    {label: "Gift Voucher", type:"mid"},
    {label: "Better Luck Next Time", type:"none"}
  ];

  // --- elements
  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spinBtn");
  const igInput = document.getElementById("iguser");
  const attemptsLeftEl = document.getElementById("attemptsLeft");
  const resultEl = document.getElementById("result");
  const claimBox = document.getElementById("claimBox");
  const prizeText = document.getElementById("prizeText");
  const claimBtn = document.getElementById("claimBtn");
  const emailInput = document.getElementById("email");
  const claimStatus = document.getElementById("claimStatus");

  const webhookUrlPlaceholder = "REPLACE_WITH_YOUR_WEBHOOK_URL"; // set after deploying Apps Script

  // Draw wheel
  const centerX = canvas.width/2, centerY = canvas.height/2, radius = 220;
  function drawWheel() {
    const seg = prizes.length;
    const arc = (2*Math.PI)/seg;
    for(let i=0;i<seg;i++){
      const start = i*arc;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, start, start+arc);
      ctx.closePath();
      ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)";
      ctx.fill();
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(start+arc/2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(prizes[i].label, radius-120, 0);
      ctx.restore();
    }
    // pointer
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 10, centerY);
    ctx.lineTo(centerX + radius + 35, centerY - 15);
    ctx.lineTo(centerX + radius + 35, centerY + 15);
    ctx.closePath();
    ctx.fill();
  }
  drawWheel();

  // State
  let spinning = false;
  let angle = 0;
  let angularVelocity = 0;

  function spinTo(prizeIndex) {
    const seg = prizes.length;
    const arc = (2*Math.PI)/seg;
    const randomExtra = Math.random()*arc;
    const target = (2*Math.PI*5) + (2*Math.PI - (prizeIndex*arc) - arc/2) + randomExtra;
    angularVelocity = (target - angle) / 180; // control steps
    spinning = true;
    animateSpin();
  }

  function animateSpin(){
    if(!spinning) return;
    angle += angularVelocity;
    angularVelocity *= 0.99;
    if(Math.abs(angularVelocity) < 0.0005){
      spinning = false;
      angularVelocity = 0;
      finalizeSpin();
      return;
    }
    drawFrame();
    requestAnimationFrame(animateSpin);
  }

  function drawFrame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);
    drawWheel();
    ctx.restore();
    // pointer
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 10, centerY);
    ctx.lineTo(centerX + radius + 35, centerY - 15);
    ctx.lineTo(centerX + radius + 35, centerY + 15);
    ctx.closePath();
    ctx.fill();
  }

  function finalizeSpin(){
    const seg = prizes.length;
    const arc = (2*Math.PI)/seg;
    const normalized = (angle % (2*Math.PI) + (2*Math.PI)) % (2*Math.PI);
    const index = Math.floor(((2*Math.PI) - normalized) / arc) % seg;
    const prize = prizes[index];
    showResult(prize);
  }

  // Attempt tracking: store object in localStorage: attemptsByUser = {username: count}
  function getAttempts(username){
    if(!username) return 0;
    try{
      const raw = localStorage.getItem("spin_attempts_v1") || "{}";
      const obj = JSON.parse(raw);
      return obj[username] || 0;
    }catch(e){ return 0; }
  }
  function incrementAttempt(username){
    const raw = localStorage.getItem("spin_attempts_v1") || "{}";
    const obj = JSON.parse(raw);
    obj[username] = (obj[username] || 0) + 1;
    localStorage.setItem("spin_attempts_v1", JSON.stringify(obj));
  }

  function updateAttemptsDisplay(username){
    const used = getAttempts(username);
    const left = Math.max(0, 3 - used);
    attemptsLeftEl.textContent = left;
    return left;
  }

  spinBtn.addEventListener("click", ()=>{
    const username = igInput.value.trim();
    if(!username){
      alert("अपना Instagram username डालो (without @).");
      return;
    }
    const left = updateAttemptsDisplay(username);
    if(left <= 0){
      alert("आपकी 3 attempts खत्म हो चुकी हैं।");
      return;
    }

    // Choose prize probabilistically but keep rare big prizes low probability
    const rand = Math.random();
    let prizeIndex;
    if(rand < 0.01) prizeIndex = 0; // iPhone ~1%
    else if(rand < 0.04) prizeIndex = 1; // 1000 ~3%
    else if(rand < 0.12) prizeIndex = 2; // 500 ~8%
    else if(rand < 0.22) prizeIndex = 3; // 200 ~10%
    else if(rand < 0.32) prizeIndex = 4; // free spin ~10%
    else if(rand < 0.55) prizeIndex = 5; // 100 ~23%
    else if(rand < 0.85) prizeIndex = 6; // voucher ~30%
    else prizeIndex = 7; // better luck ~15%

    incrementAttempt(username);
    updateAttemptsDisplay(username);
    spinTo(prizeIndex);
  });

  function showResult(prize){
    resultEl.textContent = `आपका prize: ${prize.label}`;
    prizeText.textContent = prize.label;
    claimBox.classList.remove("hidden");
    // For free spin, restore an attempt (client-side)
    if(prize.type === "free"){
      // remove the last increment to give back attempt
      const username = igInput.value.trim();
      try{
        const raw = localStorage.getItem("spin_attempts_v1") || "{}";
        const obj = JSON.parse(raw);
        obj[username] = Math.max(0, (obj[username] || 1) - 1);
        localStorage.setItem("spin_attempts_v1", JSON.stringify(obj));
        updateAttemptsDisplay(username);
      }catch(e){}
    }
  }

  // Claim submit
  claimBtn.addEventListener("click", async ()=>{
    const username = igInput.value.trim();
    const prize = prizeText.textContent;
    const email = emailInput.value.trim();
    if(!username || !prize) return alert("Username or prize missing.");
    // Prepare claim payload
    const payload = {
      username, prize, email, timestamp: new Date().toISOString()
    };
    claimStatus.textContent = "Submitting claim...";
    try{
      const webhook = webhookUrlPlaceholder;
      if(webhook === "REPLACE_WITH_YOUR_WEBHOOK_URL"){
        claimStatus.innerHTML = "Webhook not configured. See README to configure Google Apps Script webhook to receive claims.";
        return;
      }
      const resp = await fetch(webhook, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      if(resp.ok){
        claimStatus.textContent = "Claim submitted. We'll verify your follow and contact you.";
      } else {
        claimStatus.textContent = "Claim failed to submit. Try again later.";
      }
    }catch(e){
      claimStatus.textContent = "Error submitting claim. Check webhook URL and internet.";
    }
  });

  // On load, update attempts if username present
  igInput.addEventListener("input", ()=> updateAttemptsDisplay(igInput.value.trim()));
  document.addEventListener("DOMContentLoaded", ()=> updateAttemptsDisplay(igInput.value.trim()));
})();
