# starter/app.py
from flask import Flask, render_template, jsonify, request
from services.puzzle_service import generate_sudoku_board

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/new-game/<difficulty>", methods=["GET"])
def new_game(difficulty):
    try:
        board = generate_sudoku_board(difficulty)
        return jsonify({"status": "success", "board": board})
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": f"Server processing error: {str(err)}"}), 500

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