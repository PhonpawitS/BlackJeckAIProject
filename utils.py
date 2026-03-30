import cv2
import numpy as np
import re

# pip install pytesseract pillow
# Linux: sudo apt install tesseract-ocr
# Windows: https://github.com/UB-Mannheim/tesseract/wiki
import pytesseract
from PIL import Image


CARD_VALUES = {
    'A': 11, 'J': 10, 'Q': 10, 'K': 10,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10
}


def preprocess_for_ocr(img):
    """
    เตรียมภาพให้ Tesseract อ่านง่าย:
    1. แปลงเป็น grayscale
    2. crop เฉพาะมุมซ้ายบนของไพ่แต่ละใบ (ตัวเลขอยู่ที่นั้น)
    3. threshold ให้ contrast สูง
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ขยายภาพให้ใหญ่ขึ้น → Tesseract แม่นขึ้นมาก
    scale = 3
    h, w = gray.shape
    gray = cv2.resize(gray, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)

    # ลด noise
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # Adaptive threshold (จัดการแสงไม่สม่ำเสมอ)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )

    return thresh


def find_card_corners(img):
    """
    หาตำแหน่งมุมบนซ้ายของไพ่แต่ละใบในภาพ
    ตัวเลขของไพ่ Playtech อยู่ที่มุมบนซ้ายเสมอ
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # หา edge ของไพ่
    edges = cv2.Canny(blurred, 50, 150)

    # หา contour ที่มีขนาดเหมือนไพ่
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    img_area = img.shape[0] * img.shape[1]
    card_regions = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        # กรองเฉพาะ contour ที่มีขนาดพอเหมาะกับไพ่ (1%–40% ของภาพ)
        if img_area * 0.01 < area < img_area * 0.40:
            x, y, w, h = cv2.boundingRect(cnt)
            # ไพ่มี aspect ratio ประมาณ 0.6–0.8
            aspect = w / h if h > 0 else 0
            if 0.5 < aspect < 0.9:
                card_regions.append((x, y, w, h))

    # เรียงจากซ้ายไปขวา
    card_regions.sort(key=lambda r: r[0])

    # กรอง overlap ออก
    filtered = []
    for r in card_regions:
        if not any(abs(r[0] - f[0]) < 30 for f in filtered):
            filtered.append(r)

    return filtered


def ocr_card_value(img, x, y, w, h):
    """
    OCR ตัวเลขจากมุมบนซ้ายของไพ่
    ใช้แค่ 20%×25% ของพื้นที่ไพ่ตรงมุมนั้น
    """
    # crop เฉพาะมุมบนซ้าย
    corner_w = max(int(w * 0.25), 20)
    corner_h = max(int(h * 0.30), 20)

    # ระวัง out of bounds
    x2 = min(x + corner_w, img.shape[1])
    y2 = min(y + corner_h, img.shape[0])
    corner = img[y:y2, x:x2]

    if corner.size == 0:
        return None

    processed = preprocess_for_ocr(corner)

    # Tesseract config: อ่านแบบ single word, แค่ตัวอักษรที่เป็นไพ่
    config = '--psm 8 --oem 3 -c tessedit_char_whitelist=A234567890JQK'
    text = pytesseract.image_to_string(
        Image.fromarray(processed),
        config=config
    ).strip().upper()

    # ดึงแค่ตัวอักษรที่ match
    match = re.search(r'(10|[A2-9JQK])', text)
    if match:
        label = match.group(1)
        return CARD_VALUES.get(label)

    return None


def detect_cards(img, templates=None, threshold=0.7):
    """
    ตรวจจับไพ่จากภาพโดยใช้ OCR (ไม่ต้องใช้ templates)
    signature เหมือนเดิมเพื่อ compatibility กับ app.py
    """
    if img is None:
        return []

    values = []

    # วิธีที่ 1: หาตำแหน่งไพ่ก่อนแล้วค่อย OCR
    card_regions = find_card_corners(img)
    print(f"  📍 Found {len(card_regions)} card region(s)")

    if card_regions:
        for (x, y, w, h) in card_regions:
            val = ocr_card_value(img, x, y, w, h)
            if val is not None:
                values.append(val)
                print(f"    ✓ Card at ({x},{y}) → {val}")

    # วิธีที่ 2: fallback — OCR ทั้งภาพถ้าหา contour ไม่เจอ
    if not values:
        print("  ⚠️  Contour method failed — trying full-image OCR")
        processed = preprocess_for_ocr(img)
        config = '--psm 6 --oem 3 -c tessedit_char_whitelist=A234567890JQK'
        text = pytesseract.image_to_string(
            Image.fromarray(processed),
            config=config
        ).strip().upper()

        print(f"  📝 Full OCR text: {repr(text)}")
        tokens = re.findall(r'10|[A2-9JQK]', text)
        for t in tokens:
            val = CARD_VALUES.get(t)
            if val:
                values.append(val)

    return values


def load_templates():
    """stub — ไม่ใช้แล้ว แต่คงไว้เพื่อ compatibility"""
    return {}