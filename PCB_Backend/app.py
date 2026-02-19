import os
import io
import time
import numpy as np
from flask import Flask, request, jsonify, make_response
from ultralytics import YOLO
from PIL import Image
from huggingface_hub import hf_hub_download

# ── Download model from Hugging Face Hub ──────────────────────
HF_REPO_ID  = "shiwank05/pcb-defect-model"  
HF_FILENAME = "best.pt"                         

print("[INFO] Downloading model from Hugging Face Hub...")
MODEL_PATH = hf_hub_download(
    repo_id=HF_REPO_ID,
    filename=HF_FILENAME
)
print(f"[INFO] ✅ Model downloaded to: {MODEL_PATH}")

# ── Flask App ─────────────────────────────────────────────────
app = Flask(__name__)

# ── Lazy model loading ─────────────────────────────────────────
model = None

def get_model():
    global model
    if model is None:
        print("[INFO] Loading YOLOv8m model...")
        model = YOLO(MODEL_PATH)
        print("[INFO] ✅ Model loaded successfully")
    return model

# ── CORS helper ───────────────────────────────────────────────
def cors(response, status=200):
    r = make_response(response, status)
    r.headers['Access-Control-Allow-Origin']  = '*'
    r.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return r

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

@app.route('/', methods=['GET'])
def index():
    return cors(jsonify({
        'message': 'PCB Defect Detection API is running!',
        'endpoints': {
            'health': '/health',
            'detect': '/detect  [POST]'
        }
    }))


@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return cors(jsonify({}))
    return cors(jsonify({
        'status': 'online',
        'model':  'YOLOv8m',
        'repo':   HF_REPO_ID
    }))


@app.route('/detect', methods=['POST', 'OPTIONS'])
def detect():
    # ── Preflight ─────────────────────────────────────────────
    if request.method == 'OPTIONS':
        return cors(jsonify({}))

    # ── Validate input ────────────────────────────────────────
    if 'image' not in request.files:
        return cors(jsonify({'error': 'No image provided. Send image as multipart/form-data with key "image"'}), 400)

    file = request.files['image']

    if file.filename == '':
        return cors(jsonify({'error': 'Empty filename. Please select a valid image file.'}), 400)

    # ── Read & open image ─────────────────────────────────────
    try:
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception as e:
        return cors(jsonify({'error': f'Invalid image: {str(e)}'}), 400)

    # ── Run inference ─────────────────────────────────────────
    try:
        start     = time.time()
        results   = get_model()(img, conf=0.25)[0]
        scan_time = round(time.time() - start, 2)
    except Exception as e:
        return cors(jsonify({'error': f'Model inference failed: {str(e)}'}), 500)

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

    # ── Build analysis bars ───────────────────────────────────
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

    # ── Summary ───────────────────────────────────────────────
    is_defect = len(detections) > 0
    top_conf  = round(max((d['confidence'] for d in detections), default=0))
    board_id  = f"PCB-{np.random.randint(100000, 999999)}"

    return cors(jsonify({
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
    }))


# ── Entry point ───────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))  # HF Spaces uses 7860
    app.run(host='0.0.0.0', port=port, debug=False)