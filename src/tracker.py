from ultralytics import YOLO
import torch

class PedestrianTracker:
    def __init__(self, model_path='yolov8m.pt', device=None):
        if device is None:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device
            
        self.model = YOLO(model_path)
        self.model.to(self.device)

    def track(self, frame, conf=0.25, persist=True):
        """
        Tracks multiple classes: People (0), Bicycle (1), Car (2), Motorcycle (3), Bus (5), Truck (7).
        """
        results = self.model.track(
            source=frame,
            conf=conf,
            persist=persist,
            tracker="bytetrack.yaml",
            classes=[0, 1, 2, 3, 5, 7], # Person + All major vehicles
            verbose=False,
            device=self.device
        )
        return results[0]
