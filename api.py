from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os
import shutil
from main import process_video
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Enable CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories for data (Absolute Paths)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "data/uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "data/outputs")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Shared state for task tracking (In production, use Redis/DB)
tasks = {}

@app.post("/analyze")
async def analyze_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    task_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_DIR, f"{task_id}_{file.filename}")
    output_path = os.path.join(OUTPUT_DIR, f"{task_id}_annotated.mp4")
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    tasks[task_id] = {"status": "processing", "progress": 0}
    
    background_tasks.add_task(run_analysis_task, task_id, input_path, output_path)
    
    return {"task_id": task_id}

def run_analysis_task(task_id, input_path, output_path):
    def update_progress(p):
        tasks[task_id]["progress"] = int(p * 100)

    try:
        results = process_video(
            input_path, 
            output_path=output_path, 
            progress_callback=update_progress
        )
        
        analytics = results['analytics']
        dwell_times = analytics.calculate_dwell_times()
        
        tasks[task_id] = {
            "status": "completed",
            "progress": 100,
            "results": {
                "unique_count": analytics.get_unique_count(),
                "avg_dwell_time": sum(dwell_times.values()) / len(dwell_times) if dwell_times else 0,
                "directions": analytics.get_direction_distribution(),
                "density_data": analytics.get_density_df().to_dict(orient="records"),
                "output_video_url": f"/static/outputs/{os.path.basename(output_path)}"
            }
        }
    except Exception as e:
        tasks[task_id] = {"status": "failed", "error": str(e)}

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    return tasks.get(task_id, {"status": "not_found"})

# Serve static files (outputs)
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "data")), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
