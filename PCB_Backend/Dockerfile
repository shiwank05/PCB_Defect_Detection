FROM python:3.10-slim

WORKDIR /app

# Install all system dependencies needed by OpenCV + ultralytics
RUN apt-get update && apt-get install -y \
    libxcb1 \
    libx11-6 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    libgl1-mesa-dri \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 7860

CMD ["python", "app.py"]