# PCB Defect Detection

An end-to-end deep learning system that automatically detects manufacturing defects in PCB images. Upload a PCB image and the model highlights defects with bounding boxes, confidence scores, and class labels.

**Live:** https://pcb-defect-detection.vercel.app

---

## Model

- **Architecture:** YOLOv8m — 25.8M parameters, 93 layers
- **Trained on:** 693 labeled PCB images across 6 defect classes
- **Accuracy:** 93.6% mAP@0.5
- **Transfer learning** from COCO pretrained weights

### Defect Classes

| Class | AP |
|---|---|
| Missing Hole | ~97-99% |
| Short | ~97-98% |
| Open Circuit | ~91-93% |
| Spurious Copper | ~89-91% |
| Spur | ~87-88% |
| Mouse Bite | ~85-88% |

---

## Tech Stack

- **Model:** YOLOv8m (Ultralytics + PyTorch)
- **Backend:** Flask + Gunicorn + Pillow
- **Frontend:** React + Vite + HTML Canvas API
- **Deployed:** Vercel (frontend) + HuggingFace Spaces (backend)

---

## How It Works

1. User uploads a PCB image on the React frontend
2. Image sent to Flask backend via `POST /detect`
3. YOLOv8m runs inference — detects defects in a single forward pass
4. Backend returns JSON with bounding boxes, class names, and confidence scores
5. Frontend draws bounding boxes on the image using HTML Canvas

---

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check if backend is live |
| POST | `/detect` | Upload image, returns detections as JSON |

**Sample response:**
```json
{
  "result": "defect",
  "defectCount": 3,
  "detections": [
    {
      "class_name": "Short",
      "confidence": 91.0,
      "bbox": { "x1": 120, "y1": 85, "x2": 198, "y2": 142 }
    }
  ]
}
```

---

## Getting Started

### Backend
```bash
cd PCB_Backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
npm install
npm run dev
```

Make sure the backend URL in the frontend points to your running Flask server.

---

## Deployment

| | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://pcb-defect-detection.vercel.app |
| Backend | HuggingFace Spaces | https://shiwank05-pcb-backend.hf.space |
| Model weights | Git LFS | `best.pt` (~52MB) |
