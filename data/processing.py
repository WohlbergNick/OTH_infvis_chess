import csv
import json
import chess
import os

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "raw", "games.csv")
MOVES_FILE = os.path.join(BASE_DIR, "processed", "moves.json")
GAMES_FILE = os.path.join(BASE_DIR, "processed", "games.json")

PIECE_MAP = {
    chess.PAWN:   "P",
    chess.KNIGHT: "N",
    chess.BISHOP: "B",
    chess.ROOK:   "R",
    chess.QUEEN:  "Q",
    chess.KING:   "K",
}

def square_to_coords(square):
    """Convert a square (0-63) to a field name like 'e4'."""
    return chess.square_name(square)

def parse_moves(moves_str):
    """
    Returns a list of moves as arrays:
    [from, to, origin, piece, color, move_number]
        from:        square from where the piece is moved
        to:          square to where the piece is moved
        origin:      original square of the piece at game start
        piece:       piece type (P N B R Q K)
        color:       color of the piece (w or b)
        move_number: turn number
    """
    board = chess.Board()
    origins = {sq: square_to_coords(sq) for sq in chess.SQUARES if board.piece_at(sq)}
    result = []
    move_number = 1

    for san in moves_str.strip().split():
        try:
            move    = board.parse_san(san)
            from_sq = move.from_square
            to_sq   = move.to_square

            # Rochade: Turm-Origin und Zug manuell eintragen
            if board.is_castling(move):
                if board.is_kingside_castling(move):
                    rook_from = chess.H1 if board.turn == chess.WHITE else chess.H8
                    rook_to   = chess.F1 if board.turn == chess.WHITE else chess.F8
                else:
                    rook_from = chess.A1 if board.turn == chess.WHITE else chess.A8
                    rook_to   = chess.D1 if board.turn == chess.WHITE else chess.D8
                rook_origin = origins.get(rook_from, square_to_coords(rook_from))
                origins[rook_to] = rook_origin
                if rook_from in origins:
                    del origins[rook_from]
                result.append([
                    square_to_coords(rook_from),
                    square_to_coords(rook_to),
                    rook_origin,
                    "R",
                    "w" if board.turn == chess.WHITE else "b",
                    move_number
                ])

            piece      = board.piece_at(from_sq)
            color      = "w" if piece.color == chess.WHITE else "b"
            piece_char = PIECE_MAP[piece.piece_type]
            origin     = origins.get(from_sq, square_to_coords(from_sq))

            result.append([
                square_to_coords(from_sq),
                square_to_coords(to_sq),
                origin,
                piece_char,
                color,
                move_number,
            ])

            origins[to_sq] = origin
            if from_sq in origins:
                del origins[from_sq]

            board.push(move)
            move_number += 1

        except Exception:
            break

    return result

def parse_fens(moves_str):
    """Returns list of {fen, from, to} dicts — fen after move, next move's from/to."""
    board    = chess.Board()
    san_list = moves_str.strip().split()
    result   = []

    # Starteintrag: Grundstellung + erster Zug
    if san_list:
        try:
            first_move = board.parse_san(san_list[0])
            result.append({
                "fen":  board.fen().split(" ")[0],
                "from": square_to_coords(first_move.from_square),
                "to":   square_to_coords(first_move.to_square),
            })
        except Exception:
            pass

    for i, san in enumerate(san_list):
        try:
            move = board.parse_san(san)
            board.push(move)
            fen  = board.fen().split(" ")[0]

            if i + 1 < len(san_list):
                try:
                    next_move = board.parse_san(san_list[i + 1])
                    result.append({
                        "fen":  fen,
                        "from": square_to_coords(next_move.from_square),
                        "to":   square_to_coords(next_move.to_square),
                    })
                except Exception:
                    result.append({ "fen": fen, "from": None, "to": None })
            else:
                result.append({ "fen": fen, "from": None, "to": None })

        except Exception:
            break

    return result

def get_square_data(moves_str):
    """Returns flat move list for heatmap."""
    return parse_moves(moves_str)

def get_game_data(row, moves_str):
    """Returns game object with opening info, result and FENs."""
    winner = row.get("winner", "")
    result = "w" if winner == "white" else "b" if winner == "black" else "d"
    return {
        "id":           row.get("id", ""),
        "opening_eco":  row.get("opening_eco", ""),
        "opening_name": row.get("opening_name", ""),
        "result":       result,
        "fens":         parse_fens(moves_str),
    }

def process(input_file):
    all_moves = []
    all_games = []
    total = 0

    with open(input_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            moves_str = row.get("moves", "")
            if not moves_str:
                continue

            all_moves.extend(get_square_data(moves_str))
            all_games.append(get_game_data(row, moves_str))

            total += 1
            if total % 5000 == 0:
                print(f"  {total} Partien verarbeitet...")

    print(f"\nFertig: {total} Partien, {len(all_moves)} Züge total")
    return all_moves, all_games

def save(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))
    mb = os.path.getsize(path) / 1024 / 1024
    print(f"Gespeichert: {path} ({mb:.1f} MB)")

if __name__ == "__main__":
    moves, games = process(INPUT_FILE)
    save(moves, MOVES_FILE)
    save(games, GAMES_FILE)