// ==========================================
// ★ここにGASのURLを貼り付けてください
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxuGvcGzahjM8VWR0V8e90TMOJE2nV-L9W6R44hBpNa3rHqpqssij5xEL8jQGuByHDR/exec';
// ==========================================

let currentPass = localStorage.getItem('kintore_pass') || '';
let editingRow = null;
let cachedStatsHistory = {};
let isProcessing = false;

function setOperatingState(operating) {
  isProcessing = operating;
  submitBtn.disabled = operating;
  cancelBtn.disabled = operating;
  historyList.querySelectorAll('button').forEach(btn => btn.disabled = operating);
}

const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');

const dateSelect = document.getElementById('date-select');
const totalsList = document.getElementById('totals-list');
const historyList = document.getElementById('history-list');
const exerciseSelect = document.getElementById('exercise-select');
const customExerciseGroup = document.getElementById('custom-exercise-group');
const customExerciseInput = document.getElementById('custom-exercise');
const weightInput = document.getElementById('weight-input');
const repsInput = document.getElementById('reps-input');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

const volumeChartContainer = document.getElementById('volume-chart-container');
const statsExerciseSelect = document.getElementById('stats-exercise-select');
const statsHistoryList = document.getElementById('stats-history-list');

const tabInput = document.getElementById('tab-input');
const tabStats = document.getElementById('tab-stats');
const navInput = document.getElementById('nav-input');
const navStats = document.getElementById('nav-stats');
const navLogout = document.getElementById('nav-logout');

init();

function init() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateSelect.value = `${yyyy}-${mm}-${dd}`;
  checkLoginState();
}

function checkLoginState() {
  if (currentPass) {
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    loadDailyData();
  } else {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }
}

loginBtn.addEventListener('click', () => {
  const pass = passwordInput.value.trim();
  if (!pass) return;
  currentPass = pass;
  localStorage.setItem('kintore_pass', pass);
  passwordInput.value = '';
  checkLoginState();
});

function forceLogout(message) {
  if (message) alert(message);
  currentPass = '';
  localStorage.removeItem('kintore_pass');
  checkLoginState();
}
navLogout.addEventListener('click', () => {
  if(confirm("ログアウトしますか？")) forceLogout();
});

navInput.addEventListener('click', () => {
  tabInput.classList.add('active'); tabStats.classList.remove('active');
  navInput.classList.add('active'); navStats.classList.remove('active');
  loadDailyData();
});

navStats.addEventListener('click', () => {
  tabStats.classList.add('active'); tabInput.classList.remove('active');
  navStats.classList.add('active'); navInput.classList.remove('active');
  loadStatsData();
});

dateSelect.addEventListener('change', () => { resetForm(); loadDailyData(); });

exerciseSelect.addEventListener('change', (e) => {
  if (e.target.value === 'その他') { customExerciseGroup.classList.remove('hidden'); } 
  else { customExerciseGroup.classList.add('hidden'); customExerciseInput.value = ''; }
});

cancelBtn.addEventListener('click', resetForm);

submitBtn.addEventListener('click', async () => {
  if (isProcessing) return;
  const date = dateSelect.value;
  let exercise = exerciseSelect.value;
  if (exercise === 'その他') exercise = customExerciseInput.value.trim();
  const weight = parseFloat(weightInput.value) || 0;
  const reps = parseInt(repsInput.value, 10);

  if (!date || !exercise || !reps || reps <= 0) { alert("種目と回数は正しく入力してください。"); return; }

  setOperatingState(true);
  submitBtn.textContent = "送信中...";

  const payload = { action: editingRow ? 'update' : 'add', row: editingRow, date: date, exercise: exercise, weight: weight, reps: reps, pass: currentPass };
  try {
    const response = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (result.error === 'auth_error') { forceLogout(result.message); return; }
    else if (result.error) { alert(result.error); return; }
    resetForm(); await loadDailyData();
  } catch (error) { alert("エラー: " + error.message); } 
  finally { 
    setOperatingState(false);
    if (editingRow) {
      submitBtn.textContent = "更新する";
    } else {
      submitBtn.textContent = "記録する";
    }
  }
});

async function deleteRecord(row) {
  if (isProcessing) return;
  if (!confirm("削除しますか？")) return;
  setOperatingState(true);
  historyList.innerHTML = '<li style="color: #888;">削除中...</li>';
  try {
    const response = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'delete', row: row, pass: currentPass }) });
    const result = await response.json();
    if (result.error === 'auth_error') { forceLogout(result.message); return; }
    else if (result.error) { alert("削除エラー: " + (result.message || result.error)); }
    // 削除後は行番号がズレるため、編集中だった場合は安全のためフォームをリセット
    if (editingRow !== null) resetForm();
    await loadDailyData();
  } catch (error) { alert("エラー: " + error.message); await loadDailyData(); }
  finally { setOperatingState(false); }
}

function startEdit(row, exercise, weight, reps) {
  editingRow = row;
  const options = [...exerciseSelect.options].map(o => o.value);
  if (options.includes(exercise)) {
    exerciseSelect.value = exercise; customExerciseGroup.classList.add('hidden');
  } else {
    exerciseSelect.value = 'その他'; customExerciseGroup.classList.remove('hidden'); customExerciseInput.value = exercise;
  }
  weightInput.value = weight > 0 ? weight : ''; repsInput.value = reps;
  formTitle.textContent = "記録を修正する"; formTitle.style.color = "var(--edit)"; submitBtn.textContent = "更新する"; submitBtn.style.backgroundColor = "var(--edit)";
  cancelBtn.classList.remove('hidden'); document.getElementById('input-form-card').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  editingRow = null; formTitle.textContent = "新しく記録する"; formTitle.style.color = "#aaa"; submitBtn.textContent = "記録する"; submitBtn.style.backgroundColor = "var(--primary)";
  cancelBtn.classList.add('hidden'); weightInput.value = ''; repsInput.value = ''; exerciseSelect.value = ''; customExerciseGroup.classList.add('hidden');
}

async function loadDailyData() {
  if (!GAS_URL.startsWith('http')) return;
  totalsList.innerHTML = '<li style="color: #888;">読み込み中...</li>'; historyList.innerHTML = '<li style="color: #888;">読み込み中...</li>';
  try {
    const response = await fetch(`${GAS_URL}?date=${dateSelect.value}&pass=${currentPass}`);
    const data = await response.json();
    if (data.error === 'auth_error') { forceLogout(data.message); return; }

    const currentSelection = exerciseSelect.value;
    exerciseSelect.innerHTML = '';
    data.choices.forEach(choice => {
      const option = document.createElement('option'); option.value = choice; option.textContent = choice; exerciseSelect.appendChild(option);
    });
    if (currentSelection && [...exerciseSelect.options].some(o => o.value === currentSelection)) { exerciseSelect.value = currentSelection; }

    totalsList.innerHTML = '';
    if (Object.keys(data.totals).length === 0) { totalsList.innerHTML = '<li style="color: #888;">この日の記録はありません</li>'; } 
    else {
      for (const [ex, stats] of Object.entries(data.totals)) {
        const li = document.createElement('li'); const nameSpan = document.createElement('span'); nameSpan.textContent = ex; const countSpan = document.createElement('span');
        countSpan.textContent = stats.volume > 0 ? `${stats.volume}kg (${stats.reps}回)` : `${stats.reps}回`;
        li.appendChild(nameSpan); li.appendChild(countSpan); totalsList.appendChild(li);
      }
    }

    historyList.innerHTML = '';
    if (data.history.length === 0) { historyList.innerHTML = '<li style="color: #888;">この日の記録はありません</li>'; } 
    else {
      data.history.forEach(item => {
        const li = document.createElement('li'); const textSpan = document.createElement('span'); textSpan.className = 'history-text';
        textSpan.textContent = item.weight > 0 ? `${item.exercise} - ${item.weight}kg × ${item.reps}回` : `${item.exercise} - ${item.reps}回`;
        
        const btnGroup = document.createElement('div'); btnGroup.className = 'btn-group';
        const editBtn = document.createElement('button'); editBtn.className = 'btn-small btn-edit'; editBtn.textContent = '編集'; editBtn.onclick = () => startEdit(item.row, item.exercise, item.weight, item.reps);
        const delBtn = document.createElement('button'); delBtn.className = 'btn-small btn-delete'; delBtn.textContent = '削除'; delBtn.onclick = () => deleteRecord(item.row);
        
        btnGroup.appendChild(editBtn); btnGroup.appendChild(delBtn);
        li.appendChild(textSpan); li.appendChild(btnGroup); historyList.appendChild(li);
      });
    }
  } catch (error) { totalsList.innerHTML = `<li class="error-msg">読込エラー: ${error.message}</li>`; }
}

async function loadStatsData() {
  volumeChartContainer.innerHTML = '<div style="color: #888; font-size: 14px; margin: auto;">読み込み中...</div>';
  try {
    const response = await fetch(`${GAS_URL}?mode=stats&pass=${currentPass}`);
    const data = await response.json();
    if (data.error === 'auth_error') { forceLogout(data.message); return; }

    renderVolumeChart(data.volumeByDate);

    const currentSelection = statsExerciseSelect.value;
    statsExerciseSelect.innerHTML = '<option value="">種目を選択してください</option>';
    data.choices.forEach(choice => {
      const option = document.createElement('option'); option.value = choice; option.textContent = choice; statsExerciseSelect.appendChild(option);
    });
    if (currentSelection && [...statsExerciseSelect.options].some(o => o.value === currentSelection)) { statsExerciseSelect.value = currentSelection; }
    
    cachedStatsHistory = data.historyByExercise;
    renderStatsHistory();
  } catch (error) { volumeChartContainer.innerHTML = `<div class="error-msg" style="margin: auto;">読込エラー: ${error.message}</div>`; }
}

function renderVolumeChart(volumeByDate) {
  volumeChartContainer.innerHTML = '';
  const last7Days = [];
  for(let i=6; i>=0; i--) {
    let d = new Date(); d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0');
    last7Days.push(`${yyyy}-${mm}-${dd}`);
  }

  let maxVol = 1;
  const volumes = last7Days.map(date => { const v = volumeByDate[date] || 0; if(v > maxVol) maxVol = v; return v; });

  last7Days.forEach((date, i) => {
    const vol = volumes[i]; const heightPct = (vol / maxVol) * 100; const dayLabel = date.substring(5).replace('-', '/');
    const barCol = document.createElement('div'); barCol.className = 'chart-col';
    barCol.innerHTML = `
      <div class="chart-val">${vol > 0 ? vol : ''}</div>
      <div class="chart-bar-bg"><div class="chart-bar-fill" style="height: ${heightPct}%;"></div></div>
      <div class="chart-label">${dayLabel}</div>
    `;
    volumeChartContainer.appendChild(barCol);
  });
}

statsExerciseSelect.addEventListener('change', renderStatsHistory);

document.querySelectorAll('input[name="stats-sort"]').forEach(radio => {
  radio.addEventListener('change', renderStatsHistory);
});

document.querySelectorAll('input[name="stats-filter"]').forEach(radio => {
  radio.addEventListener('change', renderStatsHistory);
});

function renderStatsHistory() {
  const selected = statsExerciseSelect.value;
  const sortMode = document.querySelector('input[name="stats-sort"]:checked').value;
  const filterMode = document.querySelector('input[name="stats-filter"]:checked').value;
  
  statsHistoryList.innerHTML = '';
  
  if (!selected) { statsHistoryList.innerHTML = '<li style="color: #888;">上に種目を選んでください</li>'; return; }
  
  let historyData = cachedStatsHistory[selected] || [];
  
  // 絞り込みフィルターの適用
  if (filterMode === 'bodyweight') {
    historyData = historyData.filter(item => item.weight === 0);
  } else if (filterMode === 'weighted') {
    historyData = historyData.filter(item => item.weight > 0);
  }

  if (historyData.length === 0) { statsHistoryList.innerHTML = '<li style="color: #888;">この条件の記録はまだありません</li>'; return; }

  if (sortMode === 'single') {
    // ① 1セットの総負荷量（重量 × 回数）順（自重は回数）
    const sorted = [...historyData].sort((a, b) => {
      const volA = a.weight > 0 ? a.weight * a.reps : a.reps;
      const volB = b.weight > 0 ? b.weight * b.reps : b.reps;
      if (volB !== volA) return volB - volA;
      if (b.weight !== a.weight) return b.weight - a.weight;
      return b.date > a.date ? 1 : -1;
    });

    sorted.slice(0, 10).forEach((item, index) => {
      const li = document.createElement('li');
      const singleVol = item.weight * item.reps;
      const displayVal = item.weight > 0 
        ? `${item.weight}kg × ${item.reps}回 <span style="font-size:12px;color:var(--primary);">(${singleVol}kg)</span>` 
        : `${item.reps}回`;

      li.innerHTML = `
        <span style="color:#aaa; font-size:12px; margin-right:10px; width:25px;">${index + 1}位</span>
        <span style="color:#888; font-size:13px; flex:1;">${item.date.replace(/-/g, '/')}</span>
        <span style="font-weight:bold; color:#e0e0e0;">${displayVal}</span>
      `;
      statsHistoryList.appendChild(li);
    });

  } else {
    // ② 一日の総負荷記録順
    let dailyMap = {};
    historyData.forEach(item => {
      if (!dailyMap[item.date]) dailyMap[item.date] = { volume: 0, sets: 0 };
      dailyMap[item.date].volume += (item.weight > 0 ? item.weight * item.reps : item.reps);
      dailyMap[item.date].sets += 1;
    });

    let dailyArr = Object.keys(dailyMap).map(date => ({ date: date, volume: dailyMap[date].volume, sets: dailyMap[date].sets }));
    
    dailyArr.sort((a, b) => {
      if (b.volume !== a.volume) return b.volume - a.volume;
      return b.date > a.date ? 1 : -1;
    });

    const isWeightMode = historyData.some(h => h.weight > 0);

    dailyArr.slice(0, 10).forEach((item, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span style="color:#aaa; font-size:12px; margin-right:10px; width:25px;">${index + 1}位</span>
        <span style="color:#888; font-size:13px; flex:1;">${item.date.replace(/-/g, '/')}</span>
        <span style="font-weight:bold; color:var(--primary);">${item.volume}${isWeightMode ? 'kg' : '回'} <span style="font-size:11px;color:#888;font-weight:normal;">(${item.sets}set)</span></span>
      `;
      statsHistoryList.appendChild(li);
    });
  }
}
