const hintButton = document.getElementById("hint-btn");

if (hintButton) {
  hintButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_board: getCurrentBoardState(), // Function returning current 9x9 board array
          solution: solvedBoard                 // Global or stored 9x9 solved array
        })
      });

      if (!response.ok) throw new Error("Hint fetch failed");

      const hint = await response.json();
      const cellInput = document.querySelector(`input[data-row="${hint.row}"][data-col="${hint.col}"]`);

      if (cellInput) {
        cellInput.value = hint.value;
        cellInput.readOnly = true; // Lock hint cell
        cellInput.classList.add("hinted");
      }
    } catch (error) {
      console.error("Hint button error:", error);
    }
  });
}