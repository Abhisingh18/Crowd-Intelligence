import cv2
import numpy as np

# Premium color palette for different classes
CLASS_COLORS = {
    0: (59, 130, 246),   # Person -> Blue
    1: (245, 158, 11),   # Bicycle -> Amber
    2: (16, 185, 129),   # Car -> Green
    3: (139, 92, 246),   # Motorcycle -> Purple
    5: (239, 68, 68),    # Bus -> Red
    7: (14, 165, 233),   # Truck -> Sky
}

# Mapping class IDs to names
CLASS_NAMES = {
    0: "Person",
    1: "Bicycle",
    2: "Car",
    3: "Motorcycle",
    5: "Bus",
    7: "Truck"
}

def get_color(class_id, track_id=None):
    if class_id in CLASS_COLORS:
        return CLASS_COLORS[class_id]
    return (150, 150, 150)

def draw_annotations(frame, results, tracks_history=None):
    annotated_frame = frame.copy()
    
    if results.boxes is None or len(results.boxes) == 0:
        cv2.putText(annotated_frame, "AI ENGINE SCANNING...", (20, 40), 
                    cv2.FONT_HERSHEY_DUPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
        return annotated_frame

    boxes = results.boxes.xyxy.cpu().numpy()
    confs = results.boxes.conf.cpu().numpy()
    classes = results.boxes.cls.cpu().numpy().astype(int)
    
    has_ids = results.boxes.id is not None
    ids = results.boxes.id.cpu().numpy().astype(int) if has_ids else [None] * len(boxes)
    
    for i, (box, track_id, cls_id) in enumerate(zip(boxes, ids, classes)):
        x1, y1, x2, y2 = map(int, box)
        color = get_color(cls_id, track_id)
        class_name = CLASS_NAMES.get(cls_id, "Object")
        
        # 1. Draw Bounding Box
        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)
        
        # 2. Draw Corner Accents
        cl = min(15, (x2-x1)//4)
        cv2.line(annotated_frame, (x1, y1), (x1+cl, y1), color, 4)
        cv2.line(annotated_frame, (x1, y1), (x1, y1+cl), color, 4)
        cv2.line(annotated_frame, (x2, y1), (x2-cl, y1), color, 4)
        cv2.line(annotated_frame, (x2, y1), (x2, y1+cl), color, 4)
        cv2.line(annotated_frame, (x1, y2), (x1+cl, y2), color, 4)
        cv2.line(annotated_frame, (x1, y2), (x1, y2-cl), color, 4)
        cv2.line(annotated_frame, (x2, y2), (x2-cl, y2), color, 4)
        cv2.line(annotated_frame, (x2, y2), (x2, y2-cl), color, 4)

        # 3. Enhanced Label (Class + ID + Conf)
        id_str = f"#{track_id}" if track_id is not None else ""
        label = f"{class_name} {id_str} {confs[i]:.2f}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_DUPLEX, 0.45, 1)
        
        # Draw background pill
        cv2.rectangle(annotated_frame, (x1, y1 - th - 12), (x1 + tw + 10, y1), color, -1)
        cv2.putText(annotated_frame, label, (x1 + 5, y1 - 8), cv2.FONT_HERSHEY_DUPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
        
        # 4. Draw Trails (Only for important movements)
        if has_ids and tracks_history and track_id in tracks_history:
            history = tracks_history[track_id][-15:]
            pts = np.array([[int(p[0]), int(p[1])] for p in history], np.int32).reshape((-1, 1, 2))
            cv2.polylines(annotated_frame, [pts], False, color, 2, cv2.LINE_AA)

    # 5. Summary Info
    counts_str = f"DETECTIONS: {len(boxes)}"
    cv2.putText(annotated_frame, f"AI VISUAL LAB | {counts_str}", (20, 40), 
                cv2.FONT_HERSHEY_DUPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
    
    return annotated_frame

def overlay_heatmap(frame, heatmap):
    heatmap_resized = cv2.resize(heatmap, (frame.shape[1], frame.shape[0]))
    heatmap_colored = cv2.applyColorMap(heatmap_resized, cv2.COLORMAP_JET)
    return cv2.addWeighted(frame, 0.7, heatmap_colored, 0.3, 0)
