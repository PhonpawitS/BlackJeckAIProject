from flask import Flask, request, jsonify
from flask_cors import CORS
import xgboost as xgb
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

model_path = "Blackjack_Best_Model-1.json"
model = None

if os.path.exists(model_path):
    model = xgb.Booster()
    model.load_model(model_path)
    print("✅ Model loaded")
else:
    print(f"❌ Model not found: {model_path}")


def calculate_sum(cards):
    s = sum(cards)
    if s > 21 and 11 in cards:
        s -= 10
    return s


@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "running", "model_loaded": model is not None})


@app.route("/play", methods=["POST"])
def play():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data"}), 400

        player_cards  = data.get("player_cards", [])   # list of int
        dealer_cards  = data.get("dealer_cards", [])   # list of int

        if not player_cards or not dealer_cards:
            return jsonify({"error": "กรุณากรอกไพ่ทั้งสองฝั่ง"}), 400
        if len(player_cards) < 2:
            return jsonify({"error": "Player ต้องมีไพ่อย่างน้อย 2 ใบ"}), 400
        if len(dealer_cards) < 1:
            return jsonify({"error": "Dealer ต้องมีไพ่อย่างน้อย 1 ใบ"}), 400

        player_sum    = calculate_sum(player_cards)
        dealer_upcard = dealer_cards[0]
        is_soft       = 1 if 11 in player_cards else 0

        if model is None:
            return jsonify({"error": "Model ไม่ได้โหลด"}), 500

        X = pd.DataFrame([{
            "initial_player_value": player_sum,
            "dealer_upcard":        dealer_upcard,
            "is_soft_hand":         is_soft
        }])

        pred   = float(model.predict(xgb.DMatrix(X))[0])
        action = int(pred > 0.5)  # 0=HIT 1=STAND

        return jsonify({
            "player_cards":  player_cards,
            "player_sum":    player_sum,
            "dealer_cards":  dealer_cards,
            "dealer_upcard": dealer_upcard,
            "action":        action,
            "confidence":    pred
        })

    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)