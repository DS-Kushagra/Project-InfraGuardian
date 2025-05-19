import cv2
import time
import requests
from ultralytics import YOLO

# ─── CONFIG ───────────────────────────────────────────────────────────────────
MODEL_PATH = r"D:\InfraGuardian\mobile\inference\runs\finetune-potholes\weights\best.pt"      # your fine‑tuned weights
VIDEO_PATH = "sample_video.mp4"      # sample video file
API_URL    = "http://127.0.0.1:8000/hazards/"

CONF_THRESH = 0.3                    # minimum confidence
POST_INTERVAL = 1.0                  # seconds between HTTP posts
# ──────────────────────────────────────────────────────────────────────────────

# Load the YOLOv8 model
model = YOLO(MODEL_PATH)

def get_current_gps():
    """
    Stub for GPS reading.
    Replace this with real GPS on a device (e.g. from Expo Location).
    """
    # Example fixed coordinates of Bangalore
    return 12.9716, 77.5946

def compute_severity(box, frame_shape):
    """
    Simple heuristic: severity ∝ box area fraction, scaled 1–5
    """
    x1, y1, x2, y2 = box
    frame_area = frame_shape[0] * frame_shape[1]
    box_area = (x2 - x1) * (y2 - y1)
    ratio = box_area / frame_area
    # scale ratio [0,1] → [1,5]
    sev = int(min(5, max(1, ratio * 10)))
    return sev

def detect_and_send(frame):
    results = model(frame)[0]
    for box, conf, cls in zip(results.boxes.xyxy, results.boxes.conf, results.boxes.cls):
        conf = float(conf.cpu().numpy())
        if conf < CONF_THRESH:
            continue

        # Bounding box
        bbox = box.cpu().numpy().tolist()  # [x1,y1,x2,y2]
        label = model.names[int(cls.cpu().numpy())]
        severity = compute_severity(bbox, frame.shape)

        lat, lon = get_current_gps()
        payload = {
            "latitude": lat,
            "longitude": lon,
            "type": label,
            "severity": severity
        }

        # Send detection to backend
        try:
            resp = requests.post(API_URL, json=payload, timeout=5)
            print(f"[{time.strftime('%H:%M:%S')}] Sent {label} @({lat:.4f},{lon:.4f}) "
                  f"sev={severity} ⇒ {resp.status_code}")
        except Exception as e:
            print("Error sending to API:", e)

def main():
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video {VIDEO_PATH}")

    last_post = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        now = time.time()
        if now - last_post >= POST_INTERVAL:
            detect_and_send(frame)
            last_post = now

        # Optional: show frame with detections
        # for vis: uncomment to draw boxes
        results = model(frame)[0]
        for box in results.boxes.xyxy.cpu().numpy():
            x1,y1,x2,y2 = map(int, box)
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
        cv2.imshow("InfraGuardian", frame)
        if cv2.waitKey(1) == ord('q'):
            break

    cap.release()
    # cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
