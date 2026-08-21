# starter/app.py
from flask import Flask, render_template, jsonify, request
from sudoku_logic import generate_puzzle

app = Flask(__name__)
CURRENT = {"puzzle": None, "solution": None}
CLUES_BY_DIFFICULTY = {"easy": 45, "medium": 35, "hard": 28}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/new-game/<difficulty>", methods=["GET"])
def new_game(difficulty):
    try:
        clean_difficulty = str(difficulty).lower().strip()
        if clean_difficulty not in CLUES_BY_DIFFICULTY:
            raise ValueError(f"Invalid difficulty '{difficulty}'. Must be one of {tuple(CLUES_BY_DIFFICULTY)}.")
        puzzle, solution = generate_puzzle(CLUES_BY_DIFFICULTY[clean_difficulty])
        CURRENT["puzzle"] = puzzle
        CURRENT["solution"] = solution
        return jsonify({"status": "success", "board": puzzle, "solution": solution})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": f"Server processing error: {str(err)}"}), 500

@app.route("/new", methods=["GET"])
def new_game_compatibility():
    clues = request.args.get("clues", default=35, type=int)
    puzzle, solution = generate_puzzle(clues)
    CURRENT["puzzle"] = puzzle
    CURRENT["solution"] = solution
    return jsonify({"puzzle": puzzle})

@app.route("/check", methods=["POST"])
def check_solution():
    if CURRENT["solution"] is None:
        return jsonify({"error": "No game in progress"}), 400

    data = request.get_json(silent=True) or {}
    board = data.get("board")
    if not isinstance(board, list) or len(board) != 9:
        return jsonify({"error": "Invalid board"}), 400

    incorrect = []
    for row in range(9):
        if not isinstance(board[row], list) or len(board[row]) != 9:
            return jsonify({"error": "Invalid board"}), 400
        for col in range(9):
            if board[row][col] != CURRENT["solution"][row][col]:
                incorrect.append([row, col])
    return jsonify({"incorrect": incorrect})

@app.route("/api/hint", methods=["POST"])
def get_hint():
    try:
        data = request.get_json()
        if not data or "current_board" not in data or "solution" not in data:
            return jsonify({"error": "Missing current_board or solution payload"}), 400

        current_board = data["current_board"]
        solution = data["solution"]

        for r in range(9):
            for c in range(9):
                if current_board[r][c] == 0 or current_board[r][c] == "":
                    return jsonify({"row": r, "col": c, "value": solution[r][c]})

        return jsonify({"message": "No empty cells remaining"}), 400
    except Exception as err:
        return jsonify({"error": f"Hint processing failed: {str(err)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)