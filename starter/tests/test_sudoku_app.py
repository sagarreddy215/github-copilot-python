import pytest

from app import CURRENT, app
import sudoku_logic


@pytest.fixture
def client():
    app.config["TESTING"] = True
    CURRENT["puzzle"] = None
    CURRENT["solution"] = None
    with app.test_client() as test_client:
        yield test_client


def is_valid_board(board):
    assert len(board) == 9
    for row in board:
        assert len(row) == 9
        for value in row:
            assert value in range(0, 10)

    for row in board:
        values = [value for value in row if value != 0]
        assert len(values) == len(set(values))

    for col in range(9):
        values = [board[row][col] for row in range(9) if board[row][col] != 0]
        assert len(values) == len(set(values))

    for start_row in range(0, 9, 3):
        for start_col in range(0, 9, 3):
            values = []
            for row in range(start_row, start_row + 3):
                for col in range(start_col, start_col + 3):
                    value = board[row][col]
                    if value != 0:
                        values.append(value)
            assert len(values) == len(set(values))

    return True


def test_is_safe_rejects_duplicate_values_in_row_column_and_box():
    board = [[0 for _ in range(9)] for _ in range(9)]

    assert sudoku_logic.is_safe(board, 0, 0, 5) is True

    board[0][1] = 5
    assert sudoku_logic.is_safe(board, 0, 0, 5) is False

    board = [[0 for _ in range(9)] for _ in range(9)]
    board[1][0] = 5
    assert sudoku_logic.is_safe(board, 0, 0, 5) is False

    board = [[0 for _ in range(9)] for _ in range(9)]
    board[0][0] = 1
    board[0][1] = 2
    board[0][2] = 3
    board[1][0] = 4
    board[1][1] = 5
    board[1][2] = 6
    board[2][0] = 7
    board[2][1] = 8
    board[2][2] = 9
    assert sudoku_logic.is_safe(board, 2, 2, 1) is False


def test_generate_puzzle_returns_valid_puzzle_and_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(35)

    assert isinstance(puzzle, list)
    assert isinstance(solution, list)
    assert len(puzzle) == 9
    assert len(solution) == 9
    assert all(len(row) == 9 for row in puzzle)
    assert all(len(row) == 9 for row in solution)

    assert is_valid_board(solution)

    for row in range(9):
        for col in range(9):
            if puzzle[row][col] != 0:
                assert puzzle[row][col] == solution[row][col]

    clue_count = sum(cell != 0 for row in puzzle for cell in row)
    assert 17 <= clue_count <= 81


def test_has_unique_solution_detects_exactly_one_completion():
    solved_board = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ]
    empty_board = [[0 for _ in range(9)] for _ in range(9)]

    assert sudoku_logic.has_unique_solution(solved_board) is True
    assert sudoku_logic.has_unique_solution(empty_board) is False


def test_new_game_endpoint_returns_puzzle_and_sets_current_solution(client):
    response = client.get("/new?clues=30")

    assert response.status_code == 200
    payload = response.get_json()
    assert "puzzle" in payload
    assert len(payload["puzzle"]) == 9
    assert all(len(row) == 9 for row in payload["puzzle"])
    assert CURRENT["solution"] is not None
    assert is_valid_board(CURRENT["solution"])


def test_check_solution_endpoint_reports_incorrect_cells_and_handles_missing_game(client):
    valid_board = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ]

    CURRENT["solution"] = valid_board
    incorrect_board = [row[:] for row in valid_board]
    incorrect_board[0][0] = 9

    response = client.post("/check", json={"board": incorrect_board})

    assert response.status_code == 200
    payload = response.get_json()
    assert [0, 0] in payload["incorrect"]

    CURRENT["solution"] = None
    response = client.post("/check", json={"board": incorrect_board})

    assert response.status_code == 400
    assert response.get_json()["error"] == "No game in progress"

    CURRENT["solution"] = valid_board
    response = client.post("/check", json={"board": valid_board})
    assert response.status_code == 200
    assert response.get_json()["incorrect"] == []
