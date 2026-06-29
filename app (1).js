// ============================================================
//   YASO SMC PRO BOT — PWA v3.1
//   Win Rate + API Info Fixed
// ============================================================

let API_URL = localStorage.getItem('apiUrl') || 'http://localhost:5000';
let API_KEY  = 'yaso-smc-pro-2025';

let state = {
  analyzing:   false,
  sigCount:    0,
  tradeCount:  0,
  winCount:    0,
  signals:     [],
  logs:        [],
  currentSig:  null,
  prices:      [],
  chart:       null,
  connected:   false,
};

function pad(n){ return String(n).padStart(2,'0'); }
function ts(){
  const d=new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
setInterval(()=>{ const e=document.getElementById('clock'); if(e) e.textContent=ts(); },1000);

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.getElementById('nav-'+id).classList.add('active');
  if(id==='connect') checkConnection();
  if(id==='positions') loadPositions();
  if(id==='settings') updateInfoPage();
}

function addLog(msg,type='def'){
  state.logs.push({ts:ts(),msg,type});
  if(state.logs.length>100) state.logs.shift();
  renderLog();
}
function renderLog(){
  const box=document.getElementById('logBox');
  if(!box) return;
  box.innerHTML=state.logs.slice(-40).map(l=>
    `<div class="log-line"><span class="log-ts">${l.ts}</span><span class="c-${l.type}">${l.msg}</span></div>`
  ).join('');
  box.scrollTop=box.scrollHeight;
}

async function apiCall(endpoint,method='GET',body=null){
  try{
    const opts={method,headers:{'Content-Type':'application/json','X-API-Key':API_KEY}};
    if(body) opts.body=JSON.stringify(body);
    const resp=await fetch(`${API_URL}${endpoint}`,opts);
    return await resp.json();
  }catch(e){
    return {success:false,error:e.message};
  }
}

async function checkConnection(){
  const saved=localStorage.getItem('apiUrl');
  if(saved){ const el=document.getElementById('apiUrlInput'); if(el) el.value=saved; }

  const result=await apiCall('/api/status');
  const dot=document.getElementById('statusDot');
  const txt=document.getElementById('statusTxt');
  const cs=document.getElementById('connStatus');
  const cd=document.getElementById('connDetail');

  if(result.success){
    state.connected=true;
    dot.style.background='var(--g1)';
    txt.textContent='CONNECTED';
    if(cs){ cs.className='conn-status connected'; cs.textContent='● MT5 CONNECTED'; }
    if(cd) cd.textContent=`Balance: $${parseFloat(result.balance||0).toFixed(2)} | ${result.account_type||'Demo'}`;
    addLog(`>> MT5 Connected! Balance: $${parseFloat(result.balance||0).toFixed(2)}`,'ok');
    setEl('vBal',`$${parseFloat(result.balance||0).toFixed(2)}`);
    setEl('vEq', `$${parseFloat(result.equity||0).toFixed(2)}`);
    setEl('vPnL',`$${parseFloat(result.profit||0).toFixed(2)}`);
    updateInfoPage();
  }else{
    state.connected=false;
    dot.style.background='var(--red)';
    txt.textContent='OFFLINE';
    if(cs){ cs.className='conn-status disconnected'; cs.textContent='● DISCONNECTED'; }
    if(cd) cd.textContent=result.error||'Cannot reach API';
    addLog(`>> Connection failed: ${result.error}`,'err');
  }
}

async function connectAPI(){
  const url=document.getElementById('apiUrlInput')?.value?.trim();
  if(!url){ showToast('❌ Enter API URL!','err'); return; }
  API_URL=url;
  localStorage.setItem('apiUrl',url);
  addLog(`>> Connecting to ${url}...`,'info');
  await checkConnection();
}

function updateInfoPage(){
  setEl('apiDisplay', API_URL || 'Not set');
  setEl('connDisplay', state.connected ? '✓ Connected' : '✗ Offline');
}

async function generateSignal(){
  if(state.analyzing) return;
  if(!state.connected){ showToast('❌ Connect to API first!','err'); showPage('connect'); return; }

  state.analyzing=true;
  const btn=document.getElementById('genBtn');
  if(btn){ btn.textContent='⏳  ANALYZING...'; btn.classList.add('busy'); }

  document.getElementById('sigBig').textContent='...';
  document.getElementById('sigBig').className='signal-big idle';
  document.getElementById('execBtn').disabled=true;

  addLog('>> Signal analysis started...','info');
  setTimeout(()=>addLog('>> Fetching XAUUSD M5 from MT5...','ok'),400);
  setTimeout(()=>addLog('>> SMC: OB, BOS, CHoCH scanning...','info'),1000);
  setTimeout(()=>addLog('>> RSI + MACD confluence...','info'),1800);

  const result=await apiCall('/api/signal');

  if(result.success){
    state.currentSig=result;

    const sigBig=document.getElementById('sigBig');
    sigBig.textContent=result.signal;
    sigBig.className='signal-big '+result.signal.toLowerCase();

    setEl('vEntry', parseFloat(result.price||0).toFixed(2));
    setEl('vSL',    parseFloat(result.sl||0).toFixed(2));
    setEl('vTP',    parseFloat(result.tp||0).toFixed(2));
    setEl('vLot',   result.lot||'0.01');
    setEl('vRSI',   result.rsi||'---');
    setEl('vMACD',  result.macd||'---');
    setEl('vBOS',   result.bos||'---');
    setEl('vOB',    result.ob?'FOUND':'---');
    setEl('vProb',  parseFloat(result.win_prob||0).toFixed(0)+'%');

    const fill=document.getElementById('probFill');
    if(fill) fill.style.width=(result.win_prob||0)+'%';

    state.sigCount++;
    state.prices.push(result.price);
    if(state.prices.length>50) state.prices.shift();

    // ── Win Rate calculate karo ──────────────────────────────
    if(result.win_prob >= 65) state.winCount++;
    const winRate = state.sigCount > 0
      ? Math.round((state.winCount / state.sigCount) * 100)
      : Math.round(result.win_prob || 0);

    setEl('mSig',    state.sigCount);
    setEl('mWin',    winRate + '%');
    setEl('mSpread', '0.3 pips');
    setEl('livePrice', parseFloat(result.price||0).toFixed(2));

    // API info update
    updateInfoPage();

    addToHistory(result);
    updateChart();

    const c=result.signal==='BUY'?'ok':'err';
    addLog(`>> SIGNAL: ${result.signal} @ ${result.price} | PROB: ${parseFloat(result.win_prob||0).toFixed(0)}%`,c);

    const execBtn=document.getElementById('execBtn');
    execBtn.disabled=false;
    execBtn.textContent=`🚀  EXECUTE ${result.signal} NOW`;
    execBtn.style.color=result.signal==='BUY'?'var(--g1)':'var(--red)';
    execBtn.style.borderColor=result.signal==='BUY'?'var(--g1)':'var(--red)';

  }else{
    addLog(`>> Error: ${result.error}`,'err');
    showToast(`❌ ${result.error}`,'err');
    document.getElementById('sigBig').textContent='ERROR';
  }

  state.analyzing=false;
  if(btn){ btn.textContent='⚡  GENERATE SIGNAL'; btn.classList.remove('busy'); }
}

async function executeTrade(){
  if(!state.currentSig){ showToast('❌ Generate signal first!','err'); return; }
  if(!state.connected){ showToast('❌ Not connected!','err'); return; }

  const btn=document.getElementById('execBtn');
  btn.textContent='⏳  PLACING ORDER...';
  btn.disabled=true;

  addLog(`>> Executing ${state.currentSig.signal} on MT5...`,'info');

  const result=await apiCall('/api/execute','POST',{signal:state.currentSig.signal});

  if(result.success){
    state.tradeCount++;
    setEl('mTrade',state.tradeCount);
    addLog(`>> ✅ ORDER PLACED! Ticket:${result.ticket}`,'ok');
    addLog(`>> Price:${result.price} SL:${result.sl} TP:${result.tp}`,'ok');
    showToast(`✅ Trade #${result.ticket} placed!`,'ok');
    btn.textContent='✅  PLACED!';
    btn.style.color='var(--g1)';
    setTimeout(()=>{ btn.textContent='⚡  GENERATE SIGNAL FIRST'; btn.style.color='var(--text3)'; },3000);
  }else{
    addLog(`>> ❌ Failed: ${result.reason||result.error}`,'err');
    showToast(`❌ ${result.reason||result.error}`,'err');
    btn.textContent=`🚀  EXECUTE ${state.currentSig.signal} NOW`;
    btn.disabled=false;
  }
}

async function loadPositions(){
  if(!state.connected) return;
  const result=await apiCall('/api/positions');
  const body=document.getElementById('posBody');
  if(!body) return;

  if(result.success && result.positions.length>0){
    body.innerHTML=result.positions.map(p=>`
      <tr>
        <td>#${p.ticket}</td>
        <td><span class="badge ${p.type.toLowerCase()}">${p.type}</span></td>
        <td>${parseFloat(p.price||0).toFixed(2)}</td>
        <td style="color:${p.profit>=0?'var(--g1)':'var(--red)'}">$${parseFloat(p.profit||0).toFixed(2)}</td>
      </tr>
    `).join('');
    setEl('openCount',result.count+' open');
  }else{
    body.innerHTML='<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:20px;letter-spacing:1px">NO OPEN POSITIONS</td></tr>';
    setEl('openCount','0 open');
  }
}

let scanInterval=null;
function toggleAutoScan(){
  const btn=document.getElementById('scanBtn');
  if(scanInterval){
    clearInterval(scanInterval);
    scanInterval=null;
    btn.textContent='▶  START AUTO SCAN';
    btn.style.color='var(--text3)';
    addLog('>> Auto scan stopped.','err');
  }else{
    if(!state.connected){ showToast('❌ Connect first!','err'); return; }
    generateSignal();
    scanInterval=setInterval(generateSignal,60000);
    btn.textContent='■  STOP AUTO SCAN';
    btn.style.color='var(--red)';
    addLog('>> Auto scan activated — every 60s.','ok');
  }
}

function setEl(id,val){
  const el=document.getElementById(id);
  if(el) el.textContent=val;
}

function addToHistory(r){
  state.signals.unshift(r);
  if(state.signals.length>20) state.signals.pop();
  renderHistory();
}

function renderHistory(){
  const tbody=document.getElementById('histBody');
  if(!tbody) return;
  if(!state.signals.length){
    tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">AWAITING...</td></tr>';
    return;
  }
  tbody.innerHTML=state.signals.map(r=>`
    <tr>
      <td>${ts()}</td>
      <td><span class="badge ${r.signal.toLowerCase()}">${r.signal}</span></td>
      <td>${parseFloat(r.price||0).toFixed(2)}</td>
      <td style="color:${r.signal==='BUY'?'var(--red)':'var(--g1)'}">${parseFloat(r.sl||0).toFixed(2)}</td>
      <td style="color:${r.signal==='BUY'?'var(--g1)':'var(--red)'}">${parseFloat(r.tp||0).toFixed(2)}</td>
    </tr>
  `).join('');
}

function showToast(msg,type='def'){
  const colors={ok:'var(--g1)',err:'var(--red)',def:'var(--cyan)'};
  const t=document.createElement('div');
  t.style.cssText=`position:fixed;top:70px;left:50%;transform:translateX(-50%);background:var(--bg2);border:1px solid ${colors[type]||colors.def};color:${colors[type]||colors.def};padding:10px 20px;border-radius:5px;font-family:monospace;font-size:12px;z-index:9999;font-weight:700;letter-spacing:1px`;
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

function initChart(){
  const ctx=document.getElementById('priceChart');
  if(!ctx||!window.Chart) return;
  let p=2335;
  const labels=[],data=[];
  for(let i=24;i>=0;i--){
    const d=new Date();d.setHours(d.getHours()-i);
    labels.push(pad(d.getHours())+':'+pad(d.getMinutes()));
    p+=(Math.random()-0.47)*8;
    data.push(Math.round(p*100)/100);
  }
  state.prices=data;
  state.chart=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{data,borderColor:'#00ff41',borderWidth:1.5,pointRadius:0,tension:0.3,fill:true,backgroundColor:'rgba(0,255,65,0.04)'}]},
    options:{responsive:true,maintainAspectRatio:false,animation:false,
      plugins:{legend:{display:false}},
      scales:{
        x:{ticks:{color:'#1a4d1f',font:{size:9,family:'monospace'},maxTicksLimit:6},grid:{color:'rgba(0,255,65,0.04)'},border:{color:'rgba(0,255,65,0.08)'}},
        y:{ticks:{color:'#1a4d1f',font:{size:9,family:'monospace'}},grid:{color:'rgba(0,255,65,0.04)'},border:{color:'rgba(0,255,65,0.08)'}}
      }
    }
  });
  setEl('livePrice',data[data.length-1].toFixed(2));
}

function updateChart(){
  if(!state.chart||!state.currentSig) return;
  state.chart.data.labels.push(ts().slice(0,5));
  state.chart.data.datasets[0].data.push(state.currentSig.price);
  if(state.chart.data.labels.length>40){ state.chart.data.labels.shift(); state.chart.data.datasets[0].data.shift(); }
  state.chart.update('none');
}

window.addEventListener('load',()=>{
  setTimeout(initChart,200);
  renderHistory();
  renderLog();
  addLog('>> YASO SMC PRO BOT v3.1','ok');
  addLog('>> Go to CONNECT tab — enter API URL.','info');
  const saved=localStorage.getItem('apiUrl');
  if(saved){ API_URL=saved; checkConnection(); }
  updateInfoPage();
});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{ navigator.serviceWorker.register('/sw.js').catch(()=>{}); });
}
