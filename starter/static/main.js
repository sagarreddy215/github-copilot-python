const boardElement = document.getElementById("sudoku-board");
const difficultyElement = document.getElementById("difficulty");
const timerElement = document.getElementById("timer");
const hintsElement = document.getElementById("hints-used");
const messageElement = document.getElementById("message");
const scoreListElement = document.getElementById("score-list");
const themeToggle = document.getElementById("theme-toggle");

let solution = null;
let hintsUsed = 0;
let elapsedSeconds = 0;
let timerId = null;
let gameComplete = false;

function getScores() {
  try {
    return JSON.parse(localStorage.getItem("sudokuScores") || "[]");
  } catch (error) {
    return [];
  }
}

function renderScores() {
  scoreListElement.replaceChildren();
  getScores().forEach((score, index) => {
    const row = document.createElement("tr");
    [index + 1, score.name, formatTime(score.time), score.difficulty, score.hints].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });
    scoreListElement.appendChild(row);
  });
}

function saveScore() {
  const name = window.prompt("You solved it! Enter your name for the scoreboard:", "Player");
  if (!name) return;
  const scores = [...getScores(), {
    name: name.trim().slice(0, 30),
    time: elapsedSeconds,
    difficulty: difficultyElement.value,
    hints: hintsUsed,
  }].sort((first, second) => first.time - second.time).slice(0, 10);
  localStorage.setItem("sudokuScores", JSON.stringify(scores));
  renderScores();
}

function showMessage(text, isError = false) {
  messageElement.textContent = text;
  messageElement.classList.toggle("error", isError);
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function startTimer() {
  clearInterval(timerId);
  elapsedSeconds = 0;
  gameComplete = false;
  timerElement.textContent = formatTime(elapsedSeconds);
  timerId = setInterval(() => {
    elapsedSeconds += 1;
    timerElement.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function renderBoard(puzzle) {
  boardElement.replaceChildren();
  puzzle.forEach((row, rowIndex) => row.forEach((value, colIndex) => {
    const cell = document.createElement("input");
    const boxRow = Math.floor(rowIndex / 3);
    const boxCol = Math.floor(colIndex / 3);
    // Rejected flat-cell styling so each 3x3 block remains visually distinct.
    cell.type = "text";
    cell.inputMode = "numeric";
    cell.maxLength = 1;
    cell.className = `cell ${(boxRow + boxCol) % 2 === 0 ? "box-shade" : "box-plain"}`;
    cell.dataset.row = rowIndex;
    cell.dataset.col = colIndex;
    cell.setAttribute("aria-label", `Row ${rowIndex + 1}, column ${colIndex + 1}`);
    if (value) {
      cell.value = value;
      cell.readOnly = true;
      cell.classList.add("given");
    }
    boardElement.appendChild(cell);
  }));
}

async function newGame() {
  showMessage("Loading puzzle...");
  try {
    const response = await fetch(`/api/new-game/${difficultyElement.value}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load puzzle");
    solution = data.solution;
    hintsUsed = 0;
    hintsElement.textContent = hintsUsed;
    renderBoard(data.board);
    startTimer();
    showMessage("");
  } catch (error) {
    showMessage(error.message, true);
  }
}

function currentBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  boardElement.querySelectorAll(".cell").forEach((cell) => {
    board[cell.dataset.row][cell.dataset.col] = Number(cell.value) || 0;
  });
  return board;
}

function findInvalidCells(board) {
  const invalidCells = [];
  board.forEach((row, rowIndex) => row.forEach((value, colIndex) => {
    if (!value) return;
    const sameRow = row.some((otherValue, otherCol) => otherCol !== colIndex && otherValue === value);
    const sameColumn = board.some((otherRow, otherRowIndex) => otherRowIndex !== rowIndex && otherRow[colIndex] === value);
    const boxRow = Math.floor(rowIndex / 3) * 3;
    const boxCol = Math.floor(colIndex / 3) * 3;
    let sameBox = false;
    for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
      for (let colOffset = 0; colOffset < 3; colOffset += 1) {
        const otherRow = boxRow + rowOffset;
        const otherCol = boxCol + colOffset;
        if ((otherRow !== rowIndex || otherCol !== colIndex) && board[otherRow][otherCol] === value) {
          sameBox = true;
        }
      }
    }
    if (sameRow || sameColumn || sameBox) invalidCells.push([rowIndex, colIndex]);
  }));
  return invalidCells;
}

function updateInvalidCells() {
  const invalidCells = findInvalidCells(currentBoard());
  boardElement.querySelectorAll(".cell").forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    cell.classList.toggle("incorrect", invalidCells.some(([badRow, badCol]) => badRow === row && badCol === col));
  });
  return invalidCells;
}

boardElement.addEventListener("input", (event) => {
  if (!event.target.classList.contains("cell")) return;
  event.target.value = event.target.value.replace(/[^1-9]/g, "");
  updateInvalidCells();
});

document.getElementById("new-game").addEventListener("click", newGame);
difficultyElement.addEventListener("change", newGame);

document.getElementById("hint").addEventListener("click", () => {
  const cell = Array.from(boardElement.querySelectorAll(".cell")).find((item) => !item.value);
  if (!cell || !solution) return showMessage("There are no empty cells to hint.");
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  cell.value = solution[row][col];
  cell.readOnly = true;
  cell.classList.add("hint");
  hintsUsed += 1;
  hintsElement.textContent = hintsUsed;
});

document.getElementById("check-solution").addEventListener("click", () => {
  const board = currentBoard();
  const invalidCells = updateInvalidCells();
  const incorrect = [];
  const emptyCells = [];
  board.forEach((row, rowIndex) => row.forEach((value, colIndex) => {
    if (!value) emptyCells.push([rowIndex, colIndex]);
    if (value && solution && value !== solution[rowIndex][colIndex]) incorrect.push([rowIndex, colIndex]);
  }));
  boardElement.querySelectorAll(".cell").forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (incorrect.some(([badRow, badCol]) => badRow === row && badCol === col)) cell.classList.add("incorrect");
  });
  if (invalidCells.length) {
    showMessage(`${invalidCells.length} entries conflict with Sudoku rules.`, true);
  } else if (incorrect.length) {
    showMessage(`${incorrect.length} entries need correcting.`, true);
  } else if (emptyCells.length) {
    showMessage(`${emptyCells.length} cells remain.`);
  } else if (!gameComplete) {
    gameComplete = true;
    clearInterval(timerId);
    showMessage(`Puzzle complete in ${formatTime(elapsedSeconds)}.`);
    saveScore();
  }
});

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("sudokuTheme", isDark ? "dark" : "light");
});

if (localStorage.getItem("sudokuTheme") === "dark") themeToggle.click();
renderScores();
newGame();