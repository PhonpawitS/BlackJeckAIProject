# ♠ Blackjack AI Extension

> Chrome Extension ที่ช่วยแนะนำการตัดสินใจใน Blackjack โดยใช้ XGBoost Model — กรอกไพ่แล้วรับคำแนะนำ **HIT / STAND** ทันที

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=flat&logo=flask)
![XGBoost](https://img.shields.io/badge/XGBoost-2.0+-E65C00?style=flat)
![Chrome](https://img.shields.io/badge/Chrome_Extension-MV3-4285F4?style=flat&logo=googlechrome&logoColor=white)

---

## 📋 Overview

```
┌─────────────────────────────────────────────────────┐
│  Browser (Chrome Extension)                         │
│                                                     │
│  content.js  →  UI กรอกไพ่ dealer / player         │
│       ↓                                             │
│  background.js  →  ส่ง request ไป backend          │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP POST /play
┌──────────────────────▼──────────────────────────────┐
│  Flask Backend (localhost:5000)                     │
│                                                     │
│  app.py  →  รับไพ่  →  XGBoost Model               │
│                ↓                                    │
│         HIT (1) / STAND (0)                         │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
BJextension/
├── app.py                        # Flask API server
├── requirements.txt              # Python dependencies
├── Blackjack_Best_Model-1.json   # XGBoost model
└── extension/
    ├── manifest.json             # Chrome Extension config (Manifest V3)
    ├── content.js                # UI overlay — กรอกไพ่ในเบราว์เซอร์
    └── background.js             # Service worker — relay ข้อมูลไป backend
```

---

## ⚙️ Requirements

### Python (backend)

| Library | Version |
|---------|---------|
| flask | `>=3.0` |
| flask-cors | `>=4.0` |
| xgboost | `>=2.0` |
| pandas | `>=2.0` |
| numpy | `>=1.24` |

### Browser (frontend)

- Chrome `88+` (รองรับ Manifest V3)
- ไม่ต้องติดตั้ง Node.js หรือ dependency เพิ่มเติม

---

## 🚀 Quick Start

### 1. Clone repository

```bash
git clone https://github.com/PhonpawitS/BlackJeckAIProject.git
cd BJPROJECT
```

### 2. ติดตั้ง Python dependencies

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. รัน Flask Backend

```bash
python app.py
```

ตรวจสอบว่า backend ทำงานปกติ:

```bash
curl http://127.0.0.1:5000
# {"model_loaded": true, "status": "running"}
```

### 4. ติดตั้ง Chrome Extension

1. เปิด Chrome → ไปที่ `chrome://extensions/`
2. เปิด **Developer mode** (มุมขวาบน)
3. กด **Load unpacked** → เลือกโฟลเดอร์ root ของ project (ที่มี `manifest.json`)
4. Extension จะปรากฏใน toolbar

---

## 🎮 วิธีใช้งาน

1. เปิดเกม Blackjack ในเบราว์เซอร์
2. Panel **♠ BJ AI** จะปรากฏมุมขวาบน (ลากย้ายได้)
3. กดปุ่มไพ่ของ **Dealer** ที่เปิดอยู่ (อย่างน้อย 1 ใบ)
4. กดปุ่มไพ่ของ **Player** (อย่างน้อย 2 ใบ)
5. กด **ยืนยัน** → Model แนะนำ **HIT** หรือ **STAND** ทันที
6. คลิก tag ไพ่เพื่อลบแต่ละใบ หรือกด 🗑 ล้างทั้งหมด

---

## 🧠 Model Input / Output

### Input — 3 features

| Feature | Type | Description |
|---------|------|-------------|
| `initial_player_value` | int | ผลรวมไพ่ player (Ace = 11 หรือ 1 อัตโนมัติ) |
| `dealer_upcard` | int | ค่าไพ่ใบแรกของ dealer |
| `is_soft_hand` | 0 / 1 | `1` = มี Ace ที่ยังนับเป็น 11 อยู่ |

### Output

| `pred` | `action` | ความหมาย |
|--------|----------|-----------|
| 0.00 – 0.49 | `0` | **STAND** |
| 0.50 – 1.00 | `1` | **HIT** |

### API Example

```bash
curl -X POST http://127.0.0.1:5000/play \
  -H "Content-Type: application/json" \
  -d '{"player_cards": [10, 6], "dealer_cards": [9]}'
```

```json
{
  "action": 1,
  "confidence": 0.82,
  "dealer_cards": [9],
  "dealer_upcard": 9,
  "player_cards": [10, 6],
  "player_sum": 16
}
```

---

## 🔧 Troubleshooting

| ปัญหา | วิธีแก้ |
|-------|---------|
| เชื่อมต่อ Backend ไม่ได้ | ตรวจสอบว่า `python app.py` รันอยู่ที่ port 5000 |
| CORS error ใน Console | ตรวจสอบว่า `flask-cors` ติดตั้งแล้ว |
| `Model not found` | ตรวจสอบ path: `backend/Blackjack_Best_Model-1.json` |
| Panel ไม่แสดงในเกม | Reload extension ใน `chrome://extensions/` แล้ว refresh หน้าเกม |

---

