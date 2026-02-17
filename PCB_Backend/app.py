import os
import io
import time
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image

# ── Path fix: find best.pt relative to this file ──────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'best.pt')

app = Flask(__name__)
CORS(app, origins="*")

# ── Load model at startup ──────────────────────────────────────
print(f"[INFO] Loading model from: {MODEL_PATH}")
print(f"[INFO] model exists: {os.path.exists(MODEL_PATH)}")
print(f"[INFO] Files in BASE_DIR: {os.listdir(BASE_DIR)}")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"best.pt not found at {MODEL_PATH}")

model = YOLO(MODEL_PATH)
print("[INFO] ✅ Model loaded successfully")

# ── Constants ─────────────────────────────────────────────────
CLASS_NAMES = {
    0: 'Missing Hole',
    1: 'Mouse Bite',
    2: 'Open Circuit',
    3: 'Short',
    4: 'Spur',
    5: 'Spurious Copper'
}

ICONS = {
    'Missing Hole':    '◆',
    'Mouse Bite':      '◈',
    'Open Circuit':    '◇',
    'Short':           '▣',
    'Spur':            '◉',
    'Spurious Copper': '△'
}

# ── Routes ────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'online', 'model': 'YOLOv8m'}), 200


@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']

    try:
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception as e:
        return jsonify({'error': f'Invalid image: {str(e)}'}), 400

    try:
        start = time.time()
        results = model(img, conf=0.25)[0]
        scan_time = round(time.time() - start, 2)
    except Exception as e:
        return jsonify({'error': f'Model inference failed: {str(e)}'}), 500

    # ── Parse detections ──────────────────────────────────────
    detections = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf   = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        detections.append({
            'class_id':   cls_id,
            'class_name': CLASS_NAMES.get(cls_id, 'Unknown'),
            'confidence': round(conf * 100, 1),
            'bbox': {
                'x1': round(x1), 'y1': round(y1),
                'x2': round(x2), 'y2': round(y2)
            }
        })

    # ── Build analysis bars (one per unique defect class) ─────
    analysis = []
    seen = set()
    for d in detections:
        name = d['class_name']
        if name not in seen:
            seen.add(name)
            conf_val = d['confidence']
            level = 'HIGH' if conf_val > 80 else 'MEDIUM' if conf_val > 55 else 'LOW'
            analysis.append({
                'label': name,
                'icon':  ICONS.get(name, '◈'),
                'bar':   round(conf_val),
                'level': level
            })

    # ── Affected area ─────────────────────────────────────────
    img_area = img.width * img.height
    total_box_area = sum(
        (d['bbox']['x2'] - d['bbox']['x1']) * (d['bbox']['y2'] - d['bbox']['y1'])
        for d in detections
    )
    affected_pct = round((total_box_area / img_area) * 100, 1) if img_area > 0 else 0

    is_defect   = len(detections) > 0
    top_conf    = round(max((d['confidence'] for d in detections), default=97))
    board_id    = f"PCB-{np.random.randint(100000, 999999)}"

    return jsonify({
        'result':       'defect' if is_defect else 'pass',
        'confidence':   top_conf,
        'scanTime':     scan_time,
        'fileName':     file.filename,
        'boardId':      board_id,
        'defectCount':  len(detections),
        'affectedArea': f"{affected_pct}%",
        'analysis':     analysis,
        'detections':   detections,
        'imageSize':    {'width': img.width, 'height': img.height}
    }), 200


# ── Entry point ───────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)