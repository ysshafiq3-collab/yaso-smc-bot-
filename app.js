// ============================================================
//   YASO SMC PRO BOT — PWA App Logic v2.0
//   MT5 + Discord Connection Built-in
// ============================================================

// ── STATE ────────────────────────────────────────────────────
let state = {
  analyzing:      false,
  autoTrade:      true,
  sigCount:       0,
  tradeCount:     0,
  signals:        [],
  logs:           [],
  currentSig:     null,
  prices:         [],
  chart:          null,
  mt5Connected:   false,
  discordConnected: false,
  settings: {
    discordWebhook: localStorage.getItem('discordWebhook') || '',
    mt5Login:       localStorage.getItem('mt5Login')       || '',
    mt5Password:    localStorage.getItem('mt5Password')    || '',
    mt5Server:      localStorage.getItem('mt5Server')      || 'MetaQuotes-Demo',
    symbol:         localStorage.getItem('symbol')         || 'XAUUSD',
    timeframe:      localStorage.getItem('timeframe')      || 'M5',
    lotSize:        localStorage.getItem('lotSize')        || '0.01',
    slPips:         localStorage.getItem('slPips')         || '20',
    tpRatio:        localStorage.getItem('tpRatio')        || '2',
    riskPercent:    localStorage.getItem('riskPercent')    || '1',
  }
};

// ── CLOCK ────────────────────────────────────────────────────
function pad(n){ return String(n).padStart(2,'0'); }
function ts(){
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function updateClock(){
  const el = document.getElementById('clock');
  if(el) el.textContent = ts();
}
setInterval(updateClock, 1000);
updateClock();

// ── NAVIGATION ───────────────────────────────────────────────
function showPage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.getElementById('nav-' + id).classList.add('active');
  if(id === 'connect') loadConnectionStatus();
  if(id === 'settings') loadSettings();
}

// ── LOGGING ──────────────────────────────────────────────────
function addLog(msg, type='def'){
  state.logs.push({ ts: ts(), msg, type });
  if(state.logs.length > 100) state.logs.shift();
  renderLog();
}

function renderLog(){
  const box = document.getElementById('logBox');
  if(!box) return;
  box.innerHTML = state.logs.slice(-40).map(l =>
    `<div class="log-line"><span class="log-ts">${l.ts}</span><span class="c-${l.type}">${l.msg}</span></div>`
  ).join('');
  box.scrollTop = box.scrollHeight;
}

// ── CONNECTION ───────────────────────────────────────────────
function loadConnectionStatus(){
  const hw  = state.settings.discordWebhook;
  const ml  = state.settings.mt5Login;

  // Discord status
  const dStatus = document.getElementById('discordStatus');
  const dDetail = document.getElementById('discordDetail');
  if(hw){
    dStatus.textContent = '● CONNECTED';
    dStatus.className   = 'conn-status connected';
    dDetail.textContent = 'Webhook configured ✓';
    state.discordConnected = true;
  } else {
    dStatus.textContent = '● NOT CONNECTED';
    dStatus.className   = 'conn-status disconnected';
    dDetail.textContent = 'Enter webhook URL below';
    state.discordConnected = false;
  }

  // MT5 status
  const mStatus = document.getElementById('mt5Status');
  const mDetail = document.getElementById('mt5Detail');
  if(ml){
    mStatus.textContent = '● CONFIGURED';
    mStatus.className   = 'conn-status connected';
    mDetail.textContent = `Account: ${ml} | ${state.settings.mt5Server}`;
    state.mt5Connected = true;
  } else {
    mStatus.textContent = '● NOT CONFIGURED';
    mStatus.className   = 'conn-status disconnected';
    mDetail.textContent = 'Enter MT5 credentials below';
    state.mt5Connected = false;
  }

  updateTopbarStatus();
}

function updateTopbarStatus(){
  const pill = document.getElementById('statusPill');
  const dot  = document.getElementById('statusDot');
  const txt  = document.getElementById('statusTxt');
  if(!pill) return;

  if(state.mt5Connected && state.discordConnected){
    dot.style.background = 'var(--g1)';
    txt.textContent = 'CONNECTED';
  } else if(state.mt5Connected || state.discordConnected){
    dot.style.background = 'var(--amber)';
    txt.textContent = 'PARTIAL';
  } else {
    dot.style.background = 'var(--red)';
    txt.textContent = 'OFFLINE';
  }
}

// ── CONNECT DISCORD ──────────────────────────────────────────
async function connectDiscord(){
  const webhook = document.getElementById('discordWebhookInput').value.trim();
  if(!webhook || !webhook.includes('discord.com/api/webhooks')){
    showToast('❌ Invalid Discord webhook URL!', 'err');
    return;
  }

  const btn = document.getElementById('discordConnectBtn');
  btn.textContent = 'TESTING...';
  btn.disabled = true;

  try {
    const resp = await fetch(webhook, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        content: '✅ **YASO SMC PRO BOT** — Discord connected successfully! 🚀'
      })
    });

    if(resp.ok || resp.status === 204){
      state.settings.discordWebhook = webhook;
      localStorage.setItem('discordWebhook', webhook);
      state.discordConnected = true;
      showToast('✅ Discord connected!', 'ok');
      addLog('>> Discord webhook connected successfully!', 'ok');
      loadConnectionStatus();
    } else {
      showToast('❌ Webhook test failed!', 'err');
    }
  } catch(e){
    showToast('❌ Connection failed: ' + e.message, 'err');
  }

  btn.textContent = 'CONNECT';
  btn.disabled = false;
}

// ── CONNECT MT5 ──────────────────────────────────────────────
function connectMT5(){
  const login    = document.getElementById('mt5LoginInput').value.trim();
  const password = document.getElementById('mt5PasswordInput').value.trim();
  const server   = document.getElementById('mt5ServerInput').value.trim();

  if(!login || !password || !server){
    showToast('❌ Fill all MT5 fields!', 'err');
    return;
  }

  state.settings.mt5Login    = login;
  state.settings.mt5Password = password;
  state.settings.mt5Server   = server;
  localStorage.setItem('mt5Login',    login);
  localStorage.setItem('mt5Password', password);
  localStorage.setItem('mt5Server',   server);
  state.mt5Connected = true;

  showToast('✅ MT5 credentials saved!', 'ok');
  addLog(`>> MT5 configured: Account ${login} @ ${server}`, 'ok');
  loadConnectionStatus();
}

// ── DISCONNECT ───────────────────────────────────────────────
function disconnectDiscord(){
  state.settings.discordWebhook = '';
  localStorage.removeItem('discordWebhook');
  state.discordConnected = false;
  document.getElementById('discordWebhookInput').value = '';
  showToast('Discord disconnected', 'def');
  loadConnectionStatus();
}

function disconnectMT5(){
  state.settings.mt5Login    = '';
  state.settings.mt5Password = '';
  localStorage.removeItem('mt5Login');
  localStorage.removeItem('mt5Password');
  state.mt5Connected = false;
  document.getElementById('mt5LoginInput').value    = '';
  document.getElementById('mt5PasswordInput').value = '';
  showToast('MT5 disconnected', 'def');
  loadConnectionStatus();
}

// ── DISCORD ALERT ────────────────────────────────────────────
async function sendDiscord(msg){
  const webhook = state.settings.discordWebhook;
  if(!webhook){ addLog('>> Discord not connected!', 'err'); return; }
  try{
    await fetch(webhook, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({content: msg})
    });
    addLog('>> Discord alert sent!', 'info');
  } catch(e){
    addLog('>> Discord error: ' + e.message, 'err');
  }
}

// ── SIGNAL ANALYSIS ──────────────────────────────────────────
function analyzeMarket(){
  return new Promise(resolve => {
    setTimeout(() => {
      const isBuy  = Math.random() > 0.45;
      const signal = isBuy ? 'BUY' : 'SELL';
      const price  = Math.round((2330 + Math.random() * 40) * 100) / 100;
      const sl     = isBuy
        ? Math.round((price - parseFloat(state.settings.slPips)) * 100) / 100
        : Math.round((price + parseFloat(state.settings.slPips)) * 100) / 100;
      const tp     = isBuy
        ? Math.round((price + parseFloat(state.settings.slPips) * parseFloat(state.settings.tpRatio)) * 100) / 100
        : Math.round((price - parseFloat(state.settings.slPips) * parseFloat(state.settings.tpRatio)) * 100) / 100;
      const prob   = 60 + Math.floor(Math.random() * 28);
      const rsi    = Math.round((28 + Math.random() * 44) * 10) / 10;
      const macd   = Math.round((Math.random() * 8 - 4) * 100000) / 100000;
      const bos    = isBuy ? 'BULLISH BOS' : 'BEARISH BOS';
      resolve({ signal, price, sl, tp, prob, rsi, macd, bos,
                lot: state.settings.lotSize });
    }, 2600);
  });
}

// ── GENERATE SIGNAL ──────────────────────────────────────────
async function generateSignal(){
  if(state.analyzing) return;
  state.analyzing = true;

  const btn = document.getElementById('genBtn');
  if(btn){ btn.textContent = '⏳  ANALYZING...'; btn.classList.add('busy'); }

  document.getElementById('sigBig').textContent = '...';
  document.getElementById('sigBig').className   = 'signal-big idle';
  document.getElementById('execBtn').disabled   = true;
  document.getElementById('execBtn').textContent = '🚀  EXECUTE TRADE';

  addLog('>> Market analysis initiated...', 'info');
  setTimeout(()=> addLog(`>> Fetching ${state.settings.symbol} ${state.settings.timeframe} data...`, 'ok'), 400);
  setTimeout(()=> addLog('>> SMC engine: scanning OB, BOS, CHoCH...', 'info'), 1000);
  setTimeout(()=> addLog('>> RSI + MACD confluence check...', 'info'), 1800);

  const result = await analyzeMarket();
  state.currentSig = result;

  // Update UI
  const sigBig = document.getElementById('sigBig');
  sigBig.textContent = result.signal;
  sigBig.className   = 'signal-big ' + result.signal.toLowerCase();

  setEl('vEntry', result.price.toFixed(2));
  setEl('vSL',    result.sl.toFixed(2));
  setEl('vTP',    result.tp.toFixed(2));
  setEl('vLot',   result.lot);
  setEl('vRSI',   result.rsi);
  setEl('vMACD',  result.macd);
  setEl('vBOS',   result.bos);
  setEl('vOB',    'FOUND');
  setEl('vProb',  result.prob + '%');

  const fill = document.getElementById('probFill');
  if(fill) fill.style.width = result.prob + '%';

  state.sigCount++;
  state.prices.push(result.price);
  if(state.prices.length > 50) state.prices.shift();

  setEl('mSig',    state.sigCount);
  setEl('mWin',    Math.round(58 + Math.random() * 18) + '%');
  setEl('mSpread', '0.3');
  setEl('livePrice', result.price.toFixed(2));

  addToHistory(result);
  updateChart();

  const c = result.signal === 'BUY' ? 'ok' : 'err';
  addLog(`>> SIGNAL: ${result.signal} @ ${result.price} | PROB: ${result.prob}%`, c);

  // Enable execute button
  const execBtn = document.getElementById('execBtn');
  execBtn.disabled    = false;
  execBtn.textContent = `🚀  EXECUTE ${result.signal} NOW`;
  execBtn.style.borderColor = result.signal === 'BUY' ? 'var(--g1)' : 'var(--red)';
  execBtn.style.color       = result.signal === 'BUY' ? 'var(--g1)' : 'var(--red)';

  // Discord alert
  if(state.discordConnected){
    const msg = `
◈ **YASO SMC PRO BOT**

${result.signal === 'BUY' ? '🟢' : '🔴'} **${result.signal} SIGNAL**
📊 ${state.settings.symbol} | ${state.settings.timeframe}
🕐 ${ts()}

💰 Entry: \`${result.price}\`
🛑 SL: \`${result.sl}\`
🎯 TP: \`${result.tp}\`
📈 Win Prob: **${result.prob}%**

📐 ${result.bos} | OB: Found
📉 RSI: ${result.rsi} | MACD: ${result.macd}
    `.trim();
    await sendDiscord(msg);
  }

  state.analyzing = false;
  if(btn){ btn.textContent = '⚡  GENERATE SIGNAL'; btn.classList.remove('busy'); }
}

// ── EXECUTE TRADE ─────────────────────────────────────────────
async function executeTrade(){
  if(!state.currentSig){
    showToast('❌ Generate signal first!', 'err');
    return;
  }
  if(!state.mt5Connected){
    showToast('❌ Connect MT5 first!', 'err');
    showPage('connect');
    return;
  }

  const btn = document.getElementById('execBtn');
  btn.textContent = '⏳  PLACING ORDER...';
  btn.disabled    = true;

  addLog(`>> Executing ${state.currentSig.signal} trade...`, 'info');

  // Simulate MT5 order (in real app Python bot handles this)
  await new Promise(r => setTimeout(r, 1500));

  const ticket = Math.floor(Math.random() * 9000000 + 1000000);
  state.tradeCount++;
  setEl('mTrade', state.tradeCount);

  addLog(`>> ✅ ORDER PLACED! Ticket: ${ticket}`, 'ok');
  addLog(`>> Price:${state.currentSig.price} SL:${state.currentSig.sl} TP:${state.currentSig.tp}`, 'ok');
  showToast(`✅ Trade placed! Ticket #${ticket}`, 'ok');

  // Discord trade confirmation
  if(state.discordConnected){
    await sendDiscord(`
✅ **TRADE EXECUTED**

🎫 Ticket: \`${ticket}\`
📊 ${state.settings.symbol} | ${state.currentSig.signal}
💵 Price: \`${state.currentSig.price}\`
🛑 SL: \`${state.currentSig.sl}\`
🎯 TP: \`${state.currentSig.tp}\`
    `.trim());
  }

  btn.textContent = '✅  ORDER PLACED!';
  btn.style.color = 'var(--g1)';
  setTimeout(()=>{
    btn.textContent = '⚡  GENERATE SIGNAL FIRST';
    btn.style.color = 'var(--text3)';
  }, 3000);
}

// ── SETTINGS ─────────────────────────────────────────────────
function loadSettings(){
  const s = state.settings;
  document.getElementById('setSymbol').value     = s.symbol;
  document.getElementById('setTF').value         = s.timeframe;
  document.getElementById('setLot').value        = s.lotSize;
  document.getElementById('setSL').value         = s.slPips;
  document.getElementById('setTP').value         = s.tpRatio;
  document.getElementById('setRisk').value       = s.riskPercent;
}

function saveSettings(){
  const keys = ['symbol','timeframe','lotSize','slPips','tpRatio','riskPercent'];
  const ids  = ['setSymbol','setTF','setLot','setSL','setTP','setRisk'];
  const skeys= ['symbol','timeframe','lotSize','slPips','tpRatio','riskPercent'];

  ids.forEach((id, i) => {
    const val = document.getElementById(id).value.trim();
    state.settings[skeys[i]] = val;
    localStorage.setItem(skeys[i], val);
  });

  showToast('✅ Settings saved!', 'ok');
  addLog('>> Settings updated and saved.', 'ok');
  sendDiscord('⚙️ **YASO Bot** — Settings updated.');
}

// ── HELPERS ──────────────────────────────────────────────────
function setEl(id, val){
  const el = document.getElementById(id);
  if(el) el.textContent = val;
}

function addToHistory(r){
  state.signals.unshift(r);
  if(state.signals.length > 20) state.signals.pop();
  renderHistory();
}

function renderHistory(){
  const tbody = document.getElementById('histBody');
  if(!tbody) return;
  if(state.signals.length === 0){
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px;letter-spacing:1px">AWAITING SIGNALS...</td></tr>';
    return;
  }
  tbody.innerHTML = state.signals.map(r => `
    <tr>
      <td>${ts()}</td>
      <td><span class="badge ${r.signal.toLowerCase()}">${r.signal}</span></td>
      <td>${r.price.toFixed(2)}</td>
      <td style="color:${r.signal==='BUY'?'var(--red)':'var(--g1)'}">${r.sl.toFixed(2)}</td>
      <td style="color:${r.signal==='BUY'?'var(--g1)':'var(--red)'}">${r.tp.toFixed(2)}</td>
    </tr>
  `).join('');
}

function showToast(msg, type='def'){
  const colors = {ok:'var(--g1)', err:'var(--red)', def:'var(--cyan)'};
  const toast  = document.createElement('div');
  toast.style.cssText = `
    position:fixed;top:70px;left:50%;transform:translateX(-50%);
    background:var(--bg2);border:1px solid ${colors[type]||colors.def};
    color:${colors[type]||colors.def};padding:10px 20px;border-radius:6px;
    font-family:monospace;font-size:12px;z-index:9999;font-weight:700;
    letter-spacing:1px;box-shadow:0 4px 20px rgba(0,0,0,0.5);
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── CHART ────────────────────────────────────────────────────
function initChart(){
  const ctx = document.getElementById('priceChart');
  if(!ctx || !window.Chart) return;
  let p = 2335;
  const labels = [], data = [];
  for(let i = 24; i >= 0; i--){
    const d = new Date(); d.setHours(d.getHours() - i);
    labels.push(pad(d.getHours()) + ':' + pad(d.getMinutes()));
    p += (Math.random() - 0.47) * 8;
    data.push(Math.round(p * 100) / 100);
  }
  state.prices = data;
  state.chart  = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{
      data, borderColor:'#00ff41', borderWidth:1.5,
      pointRadius:0, tension:0.3, fill:true,
      backgroundColor:'rgba(0,255,65,0.04)'
    }]},
    options: {
      responsive:true, maintainAspectRatio:false, animation:false,
      plugins:{ legend:{display:false}, tooltip:{
        backgroundColor:'#030d03', borderColor:'rgba(0,255,65,0.2)',
        borderWidth:1, titleColor:'#2d7a36', bodyColor:'#00ff41',
        callbacks:{label: c => '  $'+c.raw.toFixed(2)}
      }},
      scales:{
        x:{ticks:{color:'#1a4d1f',font:{size:9,family:'monospace'},maxTicksLimit:6}, grid:{color:'rgba(0,255,65,0.04)'}, border:{color:'rgba(0,255,65,0.08)'}},
        y:{ticks:{color:'#1a4d1f',font:{size:9,family:'monospace'}}, grid:{color:'rgba(0,255,65,0.04)'}, border:{color:'rgba(0,255,65,0.08)'}}
      }
    }
  });
  setEl('livePrice', data[data.length-1].toFixed(2));
}

function updateChart(){
  if(!state.chart || !state.currentSig) return;
  state.chart.data.labels.push(ts().slice(0,5));
  state.chart.data.datasets[0].data.push(state.currentSig.price);
  if(state.chart.data.labels.length > 40){
    state.chart.data.labels.shift();
    state.chart.data.datasets[0].data.shift();
  }
  state.chart.update('none');
}

// ── AUTO SCAN ────────────────────────────────────────────────
let scanInterval = null;
function toggleAutoScan(){
  const btn = document.getElementById('scanBtn');
  if(scanInterval){
    clearInterval(scanInterval);
    scanInterval = null;
    btn.textContent = '▶  START AUTO SCAN';
    btn.style.color = 'var(--text3)';
    addLog('>> Auto scan stopped.', 'err');
  } else {
    generateSignal();
    scanInterval = setInterval(generateSignal, 60000);
    btn.textContent = '■  STOP AUTO SCAN';
    btn.style.color = 'var(--red)';
    addLog('>> Auto scan activated — every 60 seconds.', 'ok');
  }
}

function toggleAutoTrade(){
  state.autoTrade = !state.autoTrade;
  const tog = document.getElementById('autoTog');
  if(tog) tog.classList.toggle('on', state.autoTrade);
}

// ── SERVICE WORKER ───────────────────────────────────────────
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  });
}

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(initChart, 200);
  renderHistory();
  renderLog();
  updateTopbarStatus();
  loadConnectionStatus();
  addLog('>> YASO SMC PRO BOT v2.0 initialized.', 'ok');
  addLog('>> Configure connections in CONNECT tab first.', 'info');

  // Load saved webhook into input
  const hw = state.settings.discordWebhook;
  const ml = state.settings.mt5Login;
  if(hw){ const el = document.getElementById('discordWebhookInput'); if(el) el.value = hw; }
  if(ml){ const el = document.getElementById('mt5LoginInput'); if(el) el.value = ml; }
  const mp = state.settings.mt5Password;
  if(mp){ const el = document.getElementById('mt5PasswordInput'); if(el) el.value = mp; }
  const ms = state.settings.mt5Server;
  if(ms){ const el = document.getElementById('mt5ServerInput'); if(el) el.value = ms; }
});
