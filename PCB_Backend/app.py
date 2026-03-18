import os
import io
import time
import numpy as np
import jwt
import bcrypt
import requests as http_requests
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, make_response, redirect
from ultralytics import YOLO
from PIL import Image
from huggingface_hub import hf_hub_download
from pymongo import MongoClient
from bson import ObjectId

# ── Download model from Hugging Face Hub ──────────────────────
HF_REPO_ID  = "shiwank05/pcb-defect-model"
HF_FILENAME = "best.pt"

print("[INFO] Downloading model from Hugging Face Hub...")
MODEL_PATH = hf_hub_download(repo_id=HF_REPO_ID, filename=HF_FILENAME)
print(f"[INFO] ✅ Model downloaded to: {MODEL_PATH}")

# ── Flask App ─────────────────────────────────────────────────
app = Flask(__name__)

# ── Config from environment ───────────────────────────────────
JWT_SECRET          = os.environ.get("JWT_SECRET", "pcb_super_secret_key_change_in_prod")
JWT_EXPIRES_HOURS   = int(os.environ.get("JWT_EXPIRES_HOURS", 24))
MONGO_URI           = os.environ.get("MONGO_URI", "")
GOOGLE_CLIENT_ID    = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET= os.environ.get("GOOGLE_CLIENT_SECRET", "")
CLIENT_URL          = os.environ.get("CLIENT_URL", "http://localhost:5173")
SERVER_URL          = os.environ.get("SERVER_URL", "http://localhost:7860")

# ── MongoDB ───────────────────────────────────────────────────
mongo_client = None
db           = None
users_col    = None

def get_db():
    global mongo_client, db, users_col
    if db is None:
        if not MONGO_URI:
            raise Exception("MONGO_URI environment variable not set")
        mongo_client = MongoClient(MONGO_URI)
        db           = mongo_client["pcb_defect_db"]
        users_col    = db["users"]
        # unique index on email
        users_col.create_index("email", unique=True)
        print("[INFO] ✅ Connected to MongoDB Atlas")
    return users_col

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
    r.headers['Access-Control-Allow-Origin']  = CLIENT_URL
    r.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return r

def cors_preflight():
    r = make_response(jsonify({}), 200)
    r.headers['Access-Control-Allow-Origin']  = CLIENT_URL
    r.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return r

# ── JWT helpers ───────────────────────────────────────────────
def generate_token(user_id, email, name):
    payload = {
        "user_id": str(user_id),
        "email":   email,
        "name":    name,
        "exp":     datetime.utcnow() + timedelta(hours=JWT_EXPIRES_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_token(token):
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

# ── Auth middleware ───────────────────────────────────────────
def protect(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return cors(jsonify({"error": "No token provided"}), 401)
        token = auth_header.split(" ")[1]
        try:
            payload = decode_token(token)
            request.user = payload
        except jwt.ExpiredSignatureError:
            return cors(jsonify({"error": "Token expired"}), 401)
        except jwt.InvalidTokenError:
            return cors(jsonify({"error": "Invalid token"}), 401)
        return f(*args, **kwargs)
    return decorated

# ── Constants ─────────────────────────────────────────────────
CLASS_NAMES = {
    0: 'Missing Hole', 1: 'Mouse Bite', 2: 'Open Circuit',
    3: 'Short',        4: 'Spur',       5: 'Spurious Copper'
}
ICONS = {
    'Missing Hole': '◆', 'Mouse Bite': '◈', 'Open Circuit': '◇',
    'Short': '▣',        'Spur': '◉',       'Spurious Copper': '△'
}

# ═══════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ═══════════════════════════════════════════════════════════════

# ── POST /auth/register ───────────────────────────────────────
@app.route('/auth/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return cors_preflight()
    try:
        data = request.get_json()
        name     = data.get("name", "").strip()
        email    = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not name or not email or not password:
            return cors(jsonify({"error": "Name, email and password are required"}), 400)
        if len(password) < 6:
            return cors(jsonify({"error": "Password must be at least 6 characters"}), 400)

        col = get_db()

        # check duplicate
        if col.find_one({"email": email}):
            return cors(jsonify({"error": "Email already registered"}), 409)

        # hash password
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

        result = col.insert_one({
            "name":       name,
            "email":      email,
            "password":   hashed,
            "provider":   "local",
            "created_at": datetime.utcnow()
        })

        token = generate_token(result.inserted_id, email, name)
        return cors(jsonify({
            "message": "Account created successfully",
            "token":   token,
            "user":    {"id": str(result.inserted_id), "name": name, "email": email}
        }), 201)

    except Exception as e:
        print(f"[ERROR] register: {e}")
        return cors(jsonify({"error": "Registration failed"}), 500)


# ── POST /auth/login ──────────────────────────────────────────
@app.route('/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return cors_preflight()
    try:
        data = request.get_json()
        email    = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return cors(jsonify({"error": "Email and password are required"}), 400)

        col  = get_db()
        user = col.find_one({"email": email})

        if not user:
            return cors(jsonify({"error": "Invalid email or password"}), 401)

        if user.get("provider") == "google":
            return cors(jsonify({"error": "This email is registered with Google. Use Google Sign-In."}), 401)

        if not bcrypt.checkpw(password.encode(), user["password"]):
            return cors(jsonify({"error": "Invalid email or password"}), 401)

        token = generate_token(user["_id"], email, user["name"])
        return cors(jsonify({
            "message": "Login successful",
            "token":   token,
            "user":    {"id": str(user["_id"]), "name": user["name"], "email": email}
        }))

    except Exception as e:
        print(f"[ERROR] login: {e}")
        return cors(jsonify({"error": "Login failed"}), 500)


# ── GET /auth/me ──────────────────────────────────────────────
@app.route('/auth/me', methods=['GET', 'OPTIONS'])
@protect
def me():
    if request.method == 'OPTIONS':
        return cors_preflight()
    return cors(jsonify({"user": request.user}))


# ═══════════════════════════════════════════════════════════════
#  GOOGLE OAUTH ROUTES
# ═══════════════════════════════════════════════════════════════

# ── GET /auth/google ──────────────────────────────────────────
@app.route('/auth/google', methods=['GET'])
def google_login():
    callback = f"{SERVER_URL}/auth/google/callback"
    google_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={callback}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
    )
    return redirect(google_url)


# ── GET /auth/google/callback ─────────────────────────────────
@app.route('/auth/google/callback', methods=['GET'])
def google_callback():
    code = request.args.get("code")
    if not code:
        return redirect(f"{CLIENT_URL}/login?error=oauth_failed")

    callback = f"{SERVER_URL}/auth/google/callback"

    try:
        # Exchange code for tokens
        token_resp = http_requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code":          code,
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri":  callback,
                "grant_type":    "authorization_code",
            },
            timeout=10
        )
        token_data = token_resp.json()

        if "error" in token_data:
            print(f"[ERROR] Google token exchange: {token_data}")
            return redirect(f"{CLIENT_URL}/login?error=oauth_failed")

        access_token = token_data["access_token"]

        # Get user profile from Google
        profile_resp = http_requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        profile = profile_resp.json()

        g_email = profile.get("email", "").lower()
        g_name  = profile.get("name", "")
        g_id    = profile.get("id", "")

        if not g_email:
            return redirect(f"{CLIENT_URL}/login?error=no_email")

        col  = get_db()
        user = col.find_one({"email": g_email})

        if not user:
            # Create new user
            result = col.insert_one({
                "name":       g_name,
                "email":      g_email,
                "provider":   "google",
                "google_id":  g_id,
                "created_at": datetime.utcnow()
            })
            user_id = result.inserted_id
        else:
            user_id = user["_id"]
            # Update google_id if missing
            if not user.get("google_id"):
                col.update_one({"_id": user_id}, {"$set": {"google_id": g_id, "provider": "google"}})

        jwt_token = generate_token(user_id, g_email, g_name)

        # Redirect to frontend with token in URL param
        return redirect(f"{CLIENT_URL}/oauth-success?token={jwt_token}&name={g_name}&email={g_email}")

    except Exception as e:
        print(f"[ERROR] google_callback: {e}")
        return redirect(f"{CLIENT_URL}/login?error=oauth_failed")


# ═══════════════════════════════════════════════════════════════
#  EXISTING ROUTES (unchanged)
# ═══════════════════════════════════════════════════════════════

@app.route('/', methods=['GET'])
def index():
    return cors(jsonify({
        'message': 'PCB Defect Detection API is running!',
        'endpoints': {
            'health':          '/health',
            'detect':          '/detect  [POST] — requires JWT',
            'register':        '/auth/register  [POST]',
            'login':           '/auth/login  [POST]',
            'google_login':    '/auth/google  [GET]',
            'me':              '/auth/me  [GET] — requires JWT',
        }
    }))


@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return cors_preflight()
    return cors(jsonify({'status': 'online', 'model': 'YOLOv8m', 'repo': HF_REPO_ID}))


@app.route('/detect', methods=['POST', 'OPTIONS'])
@protect
def detect():
    if request.method == 'OPTIONS':
        return cors_preflight()

    if 'image' not in request.files:
        return cors(jsonify({'error': 'No image provided'}), 400)

    file = request.files['image']
    if file.filename == '':
        return cors(jsonify({'error': 'Empty filename'}), 400)

    try:
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception as e:
        return cors(jsonify({'error': f'Invalid image: {str(e)}'}), 400)

    try:
        start     = time.time()
        results   = get_model()(img, conf=0.25)[0]
        scan_time = round(time.time() - start, 2)
    except Exception as e:
        return cors(jsonify({'error': f'Model inference failed: {str(e)}'}), 500)

    detections = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf   = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        detections.append({
            'class_id':   cls_id,
            'class_name': CLASS_NAMES.get(cls_id, 'Unknown'),
            'confidence': round(conf * 100, 1),
            'bbox': {'x1': round(x1), 'y1': round(y1), 'x2': round(x2), 'y2': round(y2)}
        })

    analysis = []
    seen = set()
    for d in detections:
        name = d['class_name']
        if name not in seen:
            seen.add(name)
            conf_val = d['confidence']
            level = 'HIGH' if conf_val > 80 else 'MEDIUM' if conf_val > 55 else 'LOW'
            analysis.append({'label': name, 'icon': ICONS.get(name, '◈'), 'bar': round(conf_val), 'level': level})

    img_area       = img.width * img.height
    total_box_area = sum((d['bbox']['x2'] - d['bbox']['x1']) * (d['bbox']['y2'] - d['bbox']['y1']) for d in detections)
    affected_pct   = round((total_box_area / img_area) * 100, 1) if img_area > 0 else 0

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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    app.run(host='0.0.0.0', port=port, debug=False)