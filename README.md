# Crowd Intelligence
Deployed link:  https://crowd-intelligence-l58l.vercel.app/

A high-performance visual pedestrian and traffic tracking system specifically designed for robust crowd density calculation. Built for scale, it handles intense scenarios like the **Shibuya Scramble Crossing** by automatically extracting trajectories, dwell times, and spatial flow vectors.

## Cloud-Ready Architecture
- **Backend:** FastAPI, YOLOv8 object detection, and ByteTrack with FFmpeg processing pipeline.
- **Frontend:** React + Tailwind CSS v4, dynamic components via Framer Motion, and synchronous real-time Area/Pie charts using Recharts.

## Supported Metrics
- **Unique Pedestrians Tracking**: Tracks people across frames despite occlusions.
- **Dwell Time Calculation**: Estimates the average seconds a target remains in frame.
- **Flow Velocity & Vectors**: Maps directional movement (`Left -> Right`, `Top -> Bottom`).
- **Density Over Time**: Provides frame-by-frame data points charting crowd compression levels.

## Deployment Instructions

### Vercel (Frontend)
1. Import repository to Vercel.
2. Root directory: `frontend/`
3. Framework Preset: `Vite`
4. Important Environment Variable:
   - `VITE_API_URL` = `YOUR_RENDER_BACKEND_URL`

### Render (Backend AI)
1. Connect this repo to Render as a New Web Service.
2. Select Environment: **Docker** (Uses the included `Dockerfile` containing OpenCV/FFmpeg system graphics dependencies).
3. (Suggested constraint): Default model is YOLOv8m. Due to Free Tier memory constraints, edit `api.py` or your configs to use `yolov8n.pt` if you experience OOMKilled errors.

## Local Development
**Run Backend:**
```bash
python3 -m uvicorn api:app --host 0.0.0.0 --port 8001
```

**Run Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Project developed for structural crowd analytics.
