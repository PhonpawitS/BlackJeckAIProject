chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === "PREDICT") {
    fetch("http://127.0.0.1:5000/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_cards: req.player_cards,
        dealer_cards: req.dealer_cards
      })
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => sendResponse(data))
      .catch(err => {
        console.error("❌ Backend:", err);
        sendResponse({ error: "เชื่อมต่อ Backend ไม่ได้ (127.0.0.1:5000)" });
      });
    return true;
  }
});