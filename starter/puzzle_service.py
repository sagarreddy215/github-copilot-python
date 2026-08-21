# starter/services/puzzle_service.py

def validate_difficulty(difficulty: str) -> str:
    """Validates difficulty input and raises explicit errors."""
    allowed = ("easy", "medium", "hard")
    clean_diff = str(difficulty).lower().strip()
    if clean_diff not in allowed:
        raise ValueError(f"Invalid difficulty '{difficulty}'. Must be one of {allowed}.")
    return clean_diff

def generate_sudoku_board(difficulty: str) -> list[list[int]]:
    """Generates a Sudoku board using modular service logic."""
    diff = validate_difficulty(difficulty)
    try:
        # Sample starter board array
        return [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ]
    except Exception as err:
        raise RuntimeError(f"Failed to generate board: {str(err)}")