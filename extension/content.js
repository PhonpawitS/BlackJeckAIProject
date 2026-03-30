(function () {
  if (document.getElementById("bj-root")) return;

  /* ───────── CARD LABEL → VALUE ───────── */
  const CARD_MAP = {
    'A':11,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
    '10':10,'J':10,'Q':10,'K':10
  };
  const LABELS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

  function parseCards(str) {
    /* รับ "A,2" หรือ "A 2" หรือ "10,K" → [11,2] */
    return str.toUpperCase()
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(s => CARD_MAP[s] !== undefined)
      .map(s => CARD_MAP[s]);
  }

  function calcSum(cards) {
    let s = cards.reduce((a, b) => a + b, 0);
    if (s > 21 && cards.includes(11)) s -= 10;
    return s;
  }

  function cardLabel(val) {
    /* แสดงผล: 11→A, 10→10, อื่นๆ→ตัวเลข */
    if (val === 11) return 'A';
    return String(val);
  }

  /* ───────── INJECT STYLES ───────── */
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500&display=swap');

    #bj-root {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 330px;
      background: #0d1117;
      border: 1px solid #2a2f3a;
      border-radius: 14px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: #c9d1d9;
      z-index: 2147483647;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      user-select: none;
      overflow: hidden;
    }
    #bj-root * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── header ── */
    #bj-header {
      background: #161b22;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #2a2f3a;
      cursor: move;
    }
    #bj-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 21px;
      letter-spacing: 1px;
      color: #f0c040;
    }
    #bj-minimize {
      background: none;
      border: none;
      color: #8b949e;
      font-size: 18px;
      cursor: pointer;
      line-height: 1;
      padding: 2px 6px;
      border-radius: 4px;
    }
    #bj-minimize:hover { background: #2a2f3a; color: #c9d1d9; }

    /* ── body ── */
    #bj-body { padding: 16px 16px; }

    /* ── section label ── */
    .bj-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: .8px;
      text-transform: uppercase;
      color: #8b949e;
      margin-bottom: 8px;
    }

    /* ── chip row (ปุ่มไพ่) ── */
    .bj-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }
    .bj-chip {
      background: #1c2128;
      border: 1px solid #2a2f3a;
      border-radius: 6px;
      color: #c9d1d9;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 14px;
      cursor: pointer;
      transition: background .12s, border-color .12s;
    }
    .bj-chip:hover { background: #2a2f3a; border-color: #444d56; }
    .bj-chip.active { background: #f0c040; border-color: #f0c040; color: #0d1117; }

    /* ── selected tags ── */
    .bj-selected {
      min-height: 34px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
      padding: 4px 6px;
      background: #161b22;
      border: 1px solid #2a2f3a;
      border-radius: 8px;
      align-items: center;
    }
    .bj-tag {
      background: #2a2f3a;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 12px;
      cursor: pointer;
      transition: background .1s;
    }
    .bj-tag:hover { background: #c0392b; color: #fff; }
    .bj-sum {
      margin-left: auto;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18px;
      color: #f0c040;
      min-width: 24px;
      text-align: right;
    }

    /* ── divider ── */
    .bj-divider { height: 1px; background: #2a2f3a; margin: 14px 0; }

    /* ── confirm button ── */
    #bj-confirm {
      width: 100%;
      padding: 12px;
      background: #f0c040;
      border: none;
      border-radius: 8px;
      color: #0d1117;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18px;
      letter-spacing: 1px;
      cursor: pointer;
      transition: background .15s, transform .1s;
    }
    #bj-confirm:hover { background: #f5d060; }
    #bj-confirm:active { transform: scale(.97); }
    #bj-confirm:disabled { background: #2a2f3a; color: #555; cursor: not-allowed; }

    /* ── result ── */
    #bj-result {
      margin-top: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 13px;
      display: none;
      text-align: center;
    }
    #bj-result.hit  { background: #0d2318; border: 1px solid #1a4731; color: #3fb950; }
    #bj-result.stand { background: #2d1117; border: 1px solid #5c1a1a; color: #f85149; }
    #bj-result .bj-action {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 34px;
      letter-spacing: 2px;
      display: block;
    }
    #bj-result .bj-conf {
      font-size: 11px;
      opacity: .7;
      margin-top: 2px;
    }
    #bj-result.error-box { background: #1f1108; border: 1px solid #6e4c11; color: #d29922; }

    /* ── clear btn ── */
    #bj-clear {
      width: 100%;
      margin-top: 6px;
      padding: 5px;
      background: none;
      border: 1px solid #2a2f3a;
      border-radius: 6px;
      color: #8b949e;
      font-size: 12px;
      cursor: pointer;
    }
    #bj-clear:hover { background: #161b22; color: #c9d1d9; }
  `;
  document.head.appendChild(style);

  /* ───────── BUILD DOM ───────── */
  const root = document.createElement('div');
  root.id = 'bj-root';
  root.innerHTML = `
    <div id="bj-header">
      <span id="bj-title">♠ BlackJack AI</span>
      <button id="bj-minimize">─</button>
    </div>
    <div id="bj-body">

      <div class="bj-label">🎩 Dealer</div>
      <div class="bj-chips" id="chips-dealer"></div>
      <div class="bj-selected" id="sel-dealer">
        <span style="color:#444;font-size:11px">กดไพ่เพื่อเพิ่ม</span>
        <span class="bj-sum" id="sum-dealer">—</span>
      </div>

      <div class="bj-divider"></div>

      <div class="bj-label">👤 Player</div>
      <div class="bj-chips" id="chips-player"></div>
      <div class="bj-selected" id="sel-player">
        <span style="color:#444;font-size:11px">กดไพ่เพื่อเพิ่ม</span>
        <span class="bj-sum" id="sum-player">—</span>
      </div>

      <div class="bj-divider"></div>

      <button id="bj-confirm" disabled>ยืนยัน</button>
      <div id="bj-result"></div>
      <button id="bj-clear">🗑 ล้างทั้งหมด</button>
    </div>
  `;
  document.body.appendChild(root);

  /* ───────── STATE ───────── */
  let dealerCards = [];   // array of int values
  let playerCards = [];

  /* ───────── RENDER CHIPS ───────── */
  function buildChips(containerId, onClick) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    LABELS.forEach(label => {
      const btn = document.createElement('button');
      btn.className = 'bj-chip';
      btn.textContent = label;
      btn.onclick = () => onClick(CARD_MAP[label], label);
      el.appendChild(btn);
    });
  }

  /* ───────── RENDER SELECTED ───────── */
  function renderSelected(selId, sumId, cards, onRemove) {
    const sel = document.getElementById(selId);
    const sumEl = document.getElementById(sumId);

    sel.innerHTML = '';
    if (cards.length === 0) {
      sel.innerHTML = '<span style="color:#444;font-size:11px">กดไพ่เพื่อเพิ่ม</span>';
    } else {
      cards.forEach((val, idx) => {
        const tag = document.createElement('span');
        tag.className = 'bj-tag';
        tag.textContent = cardLabel(val);
        tag.title = 'คลิกเพื่อลบ';
        tag.onclick = () => onRemove(idx);
        sel.appendChild(tag);
      });
    }

    // sum
    const sumSpan = document.createElement('span');
    sumSpan.className = 'bj-sum';
    sumSpan.id = sumId;
    sumSpan.textContent = cards.length ? calcSum(cards) : '—';
    sel.appendChild(sumSpan);
  }

  function refresh() {
    renderSelected('sel-dealer', 'sum-dealer', dealerCards, (i) => {
      dealerCards.splice(i, 1); refresh();
    });
    renderSelected('sel-player', 'sum-player', playerCards, (i) => {
      playerCards.splice(i, 1); refresh();
    });

    const ok = dealerCards.length >= 1 && playerCards.length >= 2;
    document.getElementById('bj-confirm').disabled = !ok;

    // hide result when editing
    document.getElementById('bj-result').style.display = 'none';
  }

  buildChips('chips-dealer', (val) => { dealerCards.push(val); refresh(); });
  buildChips('chips-player', (val) => { playerCards.push(val); refresh(); });
  refresh();

  /* ───────── CONFIRM → BACKEND ───────── */
  document.getElementById('bj-confirm').addEventListener('click', async () => {
    const btn = document.getElementById('bj-confirm');
    const res = document.getElementById('bj-result');
    btn.disabled = true;
    btn.textContent = '...';

    res.className = '';
    res.style.display = 'none';

    const result = await new Promise(resolve =>
      chrome.runtime.sendMessage(
        { type: 'PREDICT', player_cards: playerCards, dealer_cards: dealerCards },
        resolve
      )
    );

    btn.textContent = 'ยืนยัน';
    btn.disabled = false;

    if (!result || result.error) {
      res.className = 'error-box';
      res.innerHTML = `<span class="bj-action" style="font-size:16px">⚠️</span><div class="bj-conf">${result?.error || 'ไม่มีข้อมูล'}</div>`;
      res.style.display = 'block';
      return;
    }

    const actionMap = { 1: 'HIT', 0: 'STAND' };
    const action = actionMap[result.action] ?? 'UNKNOWN';
    const conf = result.confidence != null ? (result.confidence * 100).toFixed(1) + '%' : '';
    const isHit = result.action === 1;

    res.className = isHit ? 'hit' : 'stand';
    res.innerHTML = `
      <span class="bj-action">${isHit ? '✦ HIT' : '■ STAND'}</span>
      <div class="bj-conf">Player ${result.player_sum} · Dealer ${result.dealer_upcard} · ${conf}</div>
    `;
    res.style.display = 'block';
  });

  /* ───────── CLEAR ───────── */
  document.getElementById('bj-clear').addEventListener('click', () => {
    dealerCards = []; playerCards = [];
    document.getElementById('bj-result').style.display = 'none';
    refresh();
  });

  /* ───────── MINIMIZE ───────── */
  let minimized = false;
  document.getElementById('bj-minimize').addEventListener('click', () => {
    minimized = !minimized;
    document.getElementById('bj-body').style.display = minimized ? 'none' : 'block';
    document.getElementById('bj-minimize').textContent = minimized ? '▢' : '─';
  });

  /* ───────── DRAG ───────── */
  const header = document.getElementById('bj-header');
  let ox = 0, oy = 0, dragging = false;
  header.addEventListener('mousedown', e => {
    dragging = true;
    ox = e.clientX - root.getBoundingClientRect().left;
    oy = e.clientY - root.getBoundingClientRect().top;
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    root.style.right = 'auto';
    root.style.left = (e.clientX - ox) + 'px';
    root.style.top  = (e.clientY - oy) + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
})();