import cv2
import numpy as np
from ultralytics import YOLO
import torch

class PedestrianDetector:
    def __init__(self, model_path='yolov8m.pt', device=None):
        """
        Initializes the YOLOv8 detector.
        :param model_path: Path to the YOLOv8 model file.
        :param device: Device to run the model on ('cpu', 'cuda', etc.)
        """
        if device is None:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device
            
        print(f"Initializing YOLOv8 detector on {self.device}...")
        self.model = YOLO(model_path)
        self.model.to(self.device)
        
        # We only care about the "person" class (index 0 in COCO)
        self.target_class = 0 

    def detect(self, frame, conf=0.25):
        """
        Detects pedestrians in a frame.
        :param frame: The input image/frame.
        :param conf: Confidence threshold.
        :return: Detection results for the person class.
        """
        results = self.model.predict(
            source=frame,
            conf=conf,
            classes=[self.target_class],
            verbose=False,
            device=self.device
        )
        return results[0]

if __name__ == "__main__":
    # Quick test
    detector = PedestrianDetector()
    print("Detector ready.")
