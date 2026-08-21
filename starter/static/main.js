const SIZE = 9;
const SCORE_KEY = 'sudoku-top-scores';
let puzzle = [];
let difficulty = 'medium';
let hintsUsed = 0;
let startedAt = 0;
let timerId = null;

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.setAttribute('role', 'gridcell');
      boardDiv.appendChild(input);
    }
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className = 'sudoku-cell prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  stopTimer();
  difficulty = document.getElementById('difficulty').value;
  const res = await fetch(`/new?difficulty=${difficulty}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  hintsUsed = 0;
  startedAt = Date.now();
  document.getElementById('hints-used').textContent = '0';
  setMessage('Fill the grid, then check your puzzle.', 'neutral');
  updateTimer();
  timerId = setInterval(updateTimer, 1000);
}

function getBoard() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  return { board, inputs };
}

function setMessage(text, type) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.className = `message ${type}`;
}

function updateTimer() {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  document.getElementById('timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

async function checkSolution() {
  const { board, inputs } = getBoard();
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  if (data.error) {
    setMessage(data.error, 'error');
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (incorrect.size === 0 && data.complete) {
    stopTimer();
    const time = document.getElementById('timer').textContent;
    setMessage(`Solved in ${time} with ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}!`, 'success');
    saveScore(time);
  } else if (incorrect.size === 0) {
    setMessage('The entries so far are correct. Keep going.', 'success');
  } else {
    setMessage(`${incorrect.size} cell${incorrect.size === 1 ? '' : 's'} need another look.`, 'error');
  }
}

async function giveHint() {
  const { board, inputs } = getBoard();
  const res = await fetch('/hint', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({board}) });
  const data = await res.json();
  if (data.error) {
    setMessage(data.error, 'error');
    return;
  }
  const index = data.row * SIZE + data.col;
  inputs[index].value = data.value;
  inputs[index].className = 'sudoku-cell hint';
  hintsUsed += 1;
  document.getElementById('hints-used').textContent = hintsUsed;
  setMessage('A helpful clue has been added.', 'neutral');
}

function saveScore(time) {
  const name = window.prompt('You made the top 10! Enter your name:', 'Player');
  if (!name) return;
  const scores = JSON.parse(localStorage.getItem(SCORE_KEY) || '[]');
  scores.push({ name: name.trim().slice(0, 20), time, seconds: parseTime(time), difficulty, hints: hintsUsed });
  scores.sort((a, b) => a.seconds - b.seconds);
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores.slice(0, 10)));
  renderScores();
}

function parseTime(time) {
  const parts = time.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function renderScores() {
  const scores = JSON.parse(localStorage.getItem(SCORE_KEY) || '[]');
  document.getElementById('score-list').innerHTML = scores.length ? scores.map((score, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(score.name)}</td><td>${score.time}</td><td>${score.difficulty}</td><td>${score.hints}</td></tr>`).join('') : '<tr><td colspan="5">Complete a puzzle to set the first time.</td></tr>';
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
}

function hasConflict(input) {
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);
  const value = input.value;
  const cells = Array.from(document.querySelectorAll('.sudoku-cell'));
  return cells.some(cell => {
    if (cell === input || cell.value !== value) return false;
    const cellRow = Number(cell.dataset.row);
    const cellCol = Number(cell.dataset.col);
    return cellRow === row || cellCol === col || (Math.floor(cellRow / 3) === Math.floor(row / 3) && Math.floor(cellCol / 3) === Math.floor(col / 3));
  });
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('hint').addEventListener('click', giveHint);
  document.getElementById('sudoku-board').addEventListener('input', event => {
    if (!event.target.matches('.sudoku-cell') || event.target.disabled) return;
    event.target.value = event.target.value.replace(/[^1-9]/g, '').slice(-1);
    event.target.className = 'sudoku-cell';
    if (event.target.value && hasConflict(event.target)) {
      event.target.className = 'sudoku-cell invalid';
    }
  });
  renderScores();
  newGame();
});