from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import numpy as np
from PIL import Image
import io
import time

app = Flask(__name__)
CORS(app)  # Allow React to call this API

# Load your trained model once at startup
model = YOLO('best.pt')

CLASS_NAMES = {
    0: 'Missing Hole',
    1: 'Mouse Bite',
    2: 'Open Circuit',
    3: 'Short',
    4: 'Spur',
    5: 'Spurious Copper'
}

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    img_bytes = file.read()
    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')

    start = time.time()
    results = model(img, conf=0.25)[0]
    scan_time = round(time.time() - start, 2)

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

    # Build response matching your Result.jsx format
    is_defect = len(detections) > 0
    unique_defects = list({d['class_name'] for d in detections})

    # Build analysis array for Result.jsx bars
    icons = {'Missing Hole':'◆','Mouse Bite':'◈','Open Circuit':'◇','Short':'▣','Spur':'◉','Spurious Copper':'△'}
    analysis = []
    seen = {}
    for d in detections:
        name = d['class_name']
        if name not in seen:
            seen[name] = d['confidence']
            conf_val = d['confidence']
            level = 'HIGH' if conf_val > 80 else 'MEDIUM' if conf_val > 55 else 'LOW'
            analysis.append({
                'label': name,
                'icon':  icons.get(name, '◈'),
                'bar':   round(conf_val),
                'level': level
            })

    # Estimate affected area
    img_area = img.width * img.height
    total_box_area = sum(
        (d['bbox']['x2'] - d['bbox']['x1']) * (d['bbox']['y2'] - d['bbox']['y1'])
        for d in detections
    )
    affected_pct = round((total_box_area / img_area) * 100, 1) if img_area > 0 else 0

    return jsonify({
        'result':       'defect' if is_defect else 'pass',
        'confidence':   round(max((d['confidence'] for d in detections), default=97)),
        'scanTime':     scan_time,
        'fileName':     file.filename,
        'boardId':      f"PCB-{np.random.randint(100000,999999)}",
        'defectCount':  len(detections),
        'affectedArea': f"{affected_pct}%",
        'analysis':     analysis,
        'detections':   detections,
        'imageSize':    {'width': img.width, 'height': img.height}
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'online', 'model': 'YOLOv8m'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)