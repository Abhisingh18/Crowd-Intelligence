import numpy as np
from scipy.ndimage import gaussian_filter
import pandas as pd

class AnalyticsEngine:
    def __init__(self, fps=30, width=1920, height=1080):
        self.fps = fps
        self.width = width
        self.height = height
        # tracks = { id: [(x, y, frame_number), ...] }
        self.tracks = {}
        # density_over_time = { frame_number: count }
        self.density_over_time = {}
        # heatmap_accumulator: 2D array to store visits
        self.heatmap_grid = np.zeros((height // 10, width // 10)) 

    def update_tracks(self, results, frame_number):
        """
        Updates the tracks dictionary with new detections.
        """
        if results.boxes is None or results.boxes.id is None:
            self.density_over_time[frame_number] = 0
            return

        ids = results.boxes.id.cpu().numpy().astype(int)
        boxes = results.boxes.xywh.cpu().numpy() # x, y, w, h (center coordinates)
        
        self.density_over_time[frame_number] = len(ids)

        for track_id, box in zip(ids, boxes):
            x, y, w, h = box
            if track_id not in self.tracks:
                self.tracks[track_id] = []
            
            self.tracks[track_id].append((x, y, frame_number))
            
            # Update heatmap grid (downsampled)
            grid_x = min(int(x / 10), (self.width // 10) - 1)
            grid_y = min(int(y / 10), (self.height // 10) - 1)
            self.heatmap_grid[grid_y, grid_x] += 1

    def get_unique_count(self):
        return len(self.tracks)

    def calculate_dwell_times(self):
        dwell_times = {}
        for track_id, trajectory in self.tracks.items():
            if len(trajectory) < 2:
                continue
            first_frame = trajectory[0][2]
            last_frame = trajectory[-1][2]
            dwell_seconds = (last_frame - first_frame) / self.fps
            dwell_times[track_id] = dwell_seconds
        return dwell_times

    def classify_direction(self, trajectory):
        """
        Classifies direction based on first and last points.
        """
        if len(trajectory) < 2:
            return "Unknown"
        
        start_x, start_y, _ = trajectory[0]
        end_x, end_y, _ = trajectory[-1]
        
        dx = end_x - start_x
        dy = end_y - start_y
        
        if abs(dx) > abs(dy):
            return "Left -> Right" if dx > 0 else "Right -> Left"
        else:
            return "Top -> Bottom" if dy > 0 else "Bottom -> Top"

    def get_direction_distribution(self):
        directions = {"Left -> Right": 0, "Right -> Left": 0, "Top -> Bottom": 0, "Bottom -> Top": 0, "Unknown": 0}
        for track_id, trajectory in self.tracks.items():
            dir_label = self.classify_direction(trajectory)
            directions[dir_label] += 1
        return directions

    def get_heatmap(self, sigma=5):
        """
        Returns a smoothed heatmap.
        """
        smoothed = gaussian_filter(self.heatmap_grid, sigma=sigma)
        # Normalize
        if np.max(smoothed) > 0:
            smoothed = (smoothed / np.max(smoothed)) * 255
        return smoothed.astype(np.uint8)

    def get_density_df(self):
        """
        Returns density over time as a Pandas DataFrame.
        """
        df = pd.DataFrame(list(self.density_over_time.items()), columns=['Frame', 'Count'])
        df['Time (s)'] = df['Frame'] / self.fps
        return df

    def check_roi_crossing(self, roi_polygon):
        """
        Checks how many unique IDs crossed or entered a specific ROI.
        roi_polygon: List of (x, y) coordinates.
        Simple implementation: center point inside polygon.
        """
        # (This is a simplified version, can be enhanced with Shapely)
        from matplotlib.path import Path
        path = Path(roi_polygon)
        crossed_ids = set()
        
        for track_id, trajectory in self.tracks.items():
            for x, y, _ in trajectory:
                if path.contains_point((x, y)):
                    crossed_ids.add(track_id)
                    break
        return len(crossed_ids)
