# GitHub Copilot Instructions for Sudoku Flask App

## Code Quality & Architecture
- Use modular, clean Python 3 and Flask code structure.
- Maintain a clear separation of concerns: routes in `app.py`, puzzle generation and validation logic in helper modules.
- Use explicit error handling (try/except blocks with clear responses).

## Sudoku Logic Standards
- Ensure generated puzzles have strictly one unique solvable solution using backtracking validation.
- Prefilled cells must be locked (read-only).
- Validate moves against Sudoku rules (rows, columns, 3x3 grids) and trigger visual error highlighting for invalid entries.

## Frontend & Accessibility
- Use semantic HTML5, clean CSS (CSS Modules or BEM rules), and responsive design.
- Alternating 3x3 Sudoku grid blocks must have contrasting background colors.
- Ensure full keyboard accessibility and high contrast for light/dark modes.

## Feature Expectations
- **Check Button:** Highlight incorrect cells in red.
- **Hint Button:** Fill a single valid empty cell and lock it.
- **Top 10 Persistence:** Maintain top 10 scores (Name, Time, Difficulty, Hints) in browser `localStorage`.