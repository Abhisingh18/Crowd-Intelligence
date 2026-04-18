import cv2
import os
import time
import subprocess
import shutil
from src.tracker import PedestrianTracker
from src.analytics import AnalyticsEngine
from src.visualization import draw_annotations, overlay_heatmap

def get_real_fps(video_path):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()
    if fps <= 0 or fps > 120:
        return 30.0
    return fps

def convert_input_if_needed(video_path):
    converted_path = video_path + ".ready.mp4"
    try:
        # Standardize input to 720p/30fps to ensure smooth processing and playback
        subprocess.run([
            'ffmpeg', '-y', '-i', video_path,
            '-vf', 'scale=-2:720',
            '-r', '30',
            '-c:v', 'libopenh264',
            '-pix_fmt', 'yuv420p',
            '-an',
            converted_path
        ], capture_output=True, timeout=120)
        
        if os.path.exists(converted_path):
            return converted_path
    except:
        pass
    return video_path

def convert_to_browser_mp4(temp_path, final_path, fps=30):
    try:
        # Use libopenh264 which we verified works on your system
        subprocess.run([
            'ffmpeg', '-y', '-i', temp_path,
            '-c:v', 'libopenh264',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-r', str(fps),
            final_path
        ], capture_output=True, timeout=300)
        
        if os.path.exists(final_path):
            if os.path.exists(temp_path): os.remove(temp_path)
            return True
    except:
        pass
    
    if os.path.exists(temp_path):
        shutil.move(temp_path, final_path)
    return False

def process_video(video_path, output_path=None, model_path='yolov8m.pt', progress_callback=None):
    print(f"DEBUG: Starting process_video for {video_path}")
    if progress_callback: progress_callback(0.02) # Early signal
    working_path = convert_input_if_needed(video_path)
    print(f"DEBUG: Input converted to {working_path}")
    
    cap = cv2.VideoCapture(working_path)
    if not cap.isOpened(): 
        print(f"ERROR: Cannot open video {working_path}")
        return None

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"DEBUG: Video info: {width}x{height} @ {fps}fps, Total: {total_frames} frames")
    
    if fps <= 0: fps = 30.0
    
    tracker = PedestrianTracker(model_path=model_path)
    analytics = AnalyticsEngine(fps=fps, width=width, height=height)
    
    temp_output = output_path + ".raw.avi" if output_path else None
    writer = None
    if temp_output:
        # Using MJPG in AVI is very stable for raw output before conversion
        fourcc = cv2.VideoWriter_fourcc(*'MJPG')
        writer = cv2.VideoWriter(temp_output, fourcc, fps, (width, height))

    frame_count = 0
    start_time = time.time()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        
        frame_count += 1
        results = tracker.track(frame)
        analytics.update_tracks(results, frame_count)
        
        if writer:
            # THIS IS THE CRITICAL PART: Bake rectangles into the frame
            annotated_frame = draw_annotations(frame, results, analytics.tracks)
            writer.write(annotated_frame)
        
        if progress_callback:
            progress_callback(frame_count / max(total_frames, 1))

    cap.release()
    if writer: writer.release()
    
    if working_path != video_path and os.path.exists(working_path):
        os.remove(working_path)
    
    if temp_output and os.path.exists(temp_output):
        convert_to_browser_mp4(temp_output, output_path, fps=fps)
    
    end_time = time.time()
    return {
        "analytics": analytics,
        "processing_time": end_time - start_time,
        "fps": frame_count / (end_time - start_time + 0.001)
    }
