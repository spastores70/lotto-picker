const GAMES = {
  powerball: {
    whiteBalls: 69,
    specialBall: 26,
    specialClass: 'special-ball',
    specialHistClass: 'red',
    rule: 'Pick 5 white balls (1–69) + 1 red Powerball (1–26)',
    label: 'POWERBALL',
  },
  mega: {
    whiteBalls: 70,
    specialBall: 25,
    specialClass: 'mega-ball',
    specialHistClass: 'gold',
    rule: 'Pick 5 white balls (1–70) + 1 gold Mega Ball (1–25)',
    label: 'MEGA MILLIONS',
  },
};

let currentGame = 'powerball';
let currentNumbers = null;

function selectGame(game) {
  currentGame = game;
  currentNumbers = null;
  document.getElementById('btnPowerball').classList.toggle('active', game === 'powerball');
  document.getElementById('btnMega').classList.toggle('active', game === 'mega');
  document.getElementById('gameRule').textContent = GAMES[game].rule;
  resetBalls();
}

function resetBalls() {
  for (let i = 1; i <= 5; i++) {
    const b = document.getElementById('b' + i);
    b.className = 'ball white-ball';
    b.querySelector('.ball-text').textContent = '?';
    b.querySelector('.ball-text').classList.remove('small');
  }
  const b6 = document.getElementById('b6');
  b6.className = 'ball ' + GAMES[currentGame].specialClass;
  b6.querySelector('.ball-text').textContent = '?';
  b6.querySelector('.ball-text').classList.remove('small');
}

function pickUnique(max, count) {
  const pool = Array.from({ length: max }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

function generateNumbers() {
  const g = GAMES[currentGame];
  const whites = pickUnique(g.whiteBalls, 5);
  const special = Math.floor(Math.random() * g.specialBall) + 1;
  currentNumbers = { whites, special };

  whites.forEach((n, idx) => {
    const ball = document.getElementById('b' + (idx + 1));
    const span = ball.querySelector('.ball-text');
    span.textContent = n;
    span.classList.toggle('small', n >= 100);
    ball.classList.remove('pop');
    void ball.offsetWidth;
    ball.classList.add('pop');
  });

  const b6 = document.getElementById('b6');
  b6.className = 'ball ' + g.specialClass;
  const s6 = b6.querySelector('.ball-text');
  s6.textContent = special;
  s6.classList.toggle('small', special >= 100);
  b6.classList.remove('pop');
  void b6.offsetWidth;
  b6.classList.add('pop');
}

function savePick() {
  if (!currentNumbers) { showToast('Generate numbers first!'); return; }
  const history = getHistory();
  history.unshift({
    game: currentGame,
    numbers: currentNumbers,
    date: new Date().toLocaleString(),
  });
  localStorage.setItem('lotto_history', JSON.stringify(history.slice(0, 50)));
  showToast('Pick saved!');
}

function copyPick() {
  if (!currentNumbers) { showToast('Generate numbers first!'); return; }
  const g = GAMES[currentGame];
  const text = `${g.label}: ${currentNumbers.whites.join(' - ')} | ${g.specialClass.includes('mega') ? 'Mega Ball' : 'Powerball'}: ${currentNumbers.special}`;
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!')).catch(() => showToast('Copy failed'));
}

function getDailyPick() {
  const key = `daily_${currentGame}_${todayKey()}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    const { whites, special } = JSON.parse(cached);
    currentNumbers = { whites, special };
    applyNumbers(whites, special);
    showToast("Today's pick loaded!");
  } else {
    generateNumbers();
    localStorage.setItem(key, JSON.stringify(currentNumbers));
    showToast("Here's your daily lucky pick!");
  }
}

function applyNumbers(whites, special) {
  const g = GAMES[currentGame];
  whites.forEach((n, idx) => {
    const ball = document.getElementById('b' + (idx + 1));
    const span = ball.querySelector('.ball-text');
    span.textContent = n;
    span.classList.toggle('small', n >= 100);
    ball.classList.remove('pop');
    void ball.offsetWidth;
    ball.classList.add('pop');
  });
  const b6 = document.getElementById('b6');
  b6.className = 'ball ' + g.specialClass;
  const s6 = b6.querySelector('.ball-text');
  s6.textContent = special;
  s6.classList.toggle('small', special >= 100);
  b6.classList.remove('pop');
  void b6.offsetWidth;
  b6.classList.add('pop');
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem('lotto_history')) || []; }
  catch { return []; }
}

function showHistory() {
  const history = getHistory();
  const list = document.getElementById('historyList');
  if (!history.length) {
    list.innerHTML = '<div class="empty-history">No picks saved yet.</div>';
  } else {
    list.innerHTML = history.map(item => {
      const g = GAMES[item.game] || GAMES.powerball;
      const whites = item.numbers.whites.map(n =>
        `<div class="h-ball white">${n}</div>`).join('');
      const sp = `<div class="h-ball ${g.specialHistClass}">${item.numbers.special}</div>`;
      return `
        <div class="history-item">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div class="history-item-game">${g.label}</div>
            <div class="history-item-date">${item.date}</div>
          </div>
          <div class="history-balls">${whites}${sp}</div>
        </div>`;
    }).join('');
  }
  document.getElementById('historyModal').classList.add('open');
}

function closeHistory(e) {
  if (e.target === document.getElementById('historyModal')) closeHistoryBtn();
}

function closeHistoryBtn() {
  document.getElementById('historyModal').classList.remove('open');
}

function clearHistory() {
  localStorage.removeItem('lotto_history');
  showHistory();
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

document.getElementById('dayLabel').textContent = 'JOE';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Init special ball class on load
document.getElementById('b6').className = 'ball ' + GAMES[currentGame].specialClass;
