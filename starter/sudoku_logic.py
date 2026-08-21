import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def count_solutions(board, limit=2):
    """Count solutions, stopping as soon as the requested limit is reached."""
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                total = 0
                for candidate in range(1, SIZE + 1):
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        total += count_solutions(board, limit - total)
                        board[row][col] = EMPTY
                        if total >= limit:
                            return total
                return total
    return 1


def has_unique_solution(board):
    """Return True when the supplied board has exactly one valid completion."""
    board = deep_copy(board)
    solution_count = 0

    def backtrack():
        nonlocal solution_count
        if solution_count > 1:
            return

        for row in range(SIZE):
            for col in range(SIZE):
                if board[row][col] == EMPTY:
                    for candidate in range(1, SIZE + 1):
                        if is_safe(board, row, col, candidate):
                            board[row][col] = candidate
                            backtrack()
                            board[row][col] = EMPTY
                            if solution_count > 1:
                                return
                    return

        solution_count += 1

    backtrack()
    return solution_count == 1


def remove_cells(board, clues):
    cells = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(cells)
    for row, col in cells:
        if sum(cell != EMPTY for current_row in board for cell in current_row) <= clues:
            break
        value = board[row][col]
        board[row][col] = EMPTY
        candidate = deep_copy(board)
        if count_solutions(candidate) != 1:
            board[row][col] = value

def generate_puzzle(clues=35):
    clues = max(17, min(81, int(clues)))
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution
