import cv2
import requests
import base64
import time
from ultralytics import YOLO

# --- CONFIGURATION ---
SERVER_URL = "http://localhost:5000/api/alert"

# 10+ TARGETS (Mapped from Standard COCO Dataset)
# We categorize them into threat levels below.
TARGET_CLASSES = [
    "cell phone", "knife", "scissors", "baseball bat", 
    "fork", "bottle", "wine glass", 
    "backpack", "suitcase", "laptop"
]

CONFIDENCE_THRESHOLD = 0.5    # 50% sure
COOLDOWN_SECONDS = 3          # Faster alerts (3s)

# --- INITIALIZATION ---
print(f"[EDGE] Initializing Vigil-Edge Multi-Threat System...")
model = YOLO('yolov8n.pt') 

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("[EDGE] ❌ Error: Could not open webcam.")
    exit()

last_alert_time = 0
print(f"[EDGE] ✅ System Ready. Scanning for 10 Threats...")

# --- MAIN LOOP ---
while True:
    ret, frame = cap.read()
    if not ret: break

    # 1. AI DETECTION
    results = model(frame, stream=True, verbose=False)
    
    object_detected_name = None 
    threat_level = "LOW"

    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = model.names[cls_id]

            # 2. CHECK AGAINST TARGET LIST
            if class_name in TARGET_CLASSES and confidence > CONFIDENCE_THRESHOLD:
                object_detected_name = class_name
                
                # --- THREAT CLASSIFICATION LOGIC ---
                
                # LEVEL 1: HIGH DANGER (Weapons) -> RED
                if class_name in ["knife", "scissors", "baseball bat"]:
                    color = (0, 0, 255) # Red
                    label = f"⚠️ WEAPON: {class_name.upper()}"
                    threat_level = "HIGH"
                
                # LEVEL 2: POTENTIAL DANGER (Sharp/Glass) -> ORANGE
                elif class_name in ["fork", "bottle", "wine glass"]:
                    color = (0, 165, 255) # Orange
                    label = f"⚠️ SHARP/GLASS: {class_name.upper()}"
                    threat_level = "MEDIUM"
                
                # LEVEL 3: SUSPICIOUS PACKAGE (Bomb Threat) -> PURPLE
                elif class_name in ["backpack", "suitcase"]:
                    color = (128, 0, 128) # Purple
                    label = f"❓ SUSPICIOUS: {class_name.upper()}"
                    threat_level = "MEDIUM"

                # LEVEL 4: UNAUTHORIZED/THEFT (Electronics) -> YELLOW
                else: 
                    # cell phone, laptop
                    color = (0, 255, 255) # Yellow
                    label = f"🚫 UNAUTHORIZED: {class_name.upper()}"
                    threat_level = "LOW"

                # Draw Box
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
                # Background for text to make it readable
                cv2.rectangle(frame, (x1, y1 - 30), (x1 + 250, y1), color, -1)
                cv2.putText(frame, label, (x1, y1 - 8), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    # 3. SEND ALERT 
    current_time = time.time()
    
    if object_detected_name and (current_time - last_alert_time > COOLDOWN_SECONDS):
        print(f"[EDGE] 🚨 {threat_level} THREAT: {object_detected_name} DETECTED!")
        
        _, buffer = cv2.imencode('.jpg', frame)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')

        # We append the Threat Level to the name so it shows on Dashboard
        # e.g., "HIGH THREAT: KNIFE"
        display_name = f"[{threat_level}] {object_detected_name.upper()}"

        payload = {
            "objectDetected": display_name,
            "image": jpg_as_text
        }
        
        try:
            requests.post(SERVER_URL, json=payload)
            print("[EDGE] ✅ Evidence Sent to Cloud")
            last_alert_time = current_time 
        except Exception as e:
            print(f"[EDGE] ❌ Upload Failed: {e}")

    cv2.imshow("Vigil-Edge (Multi-Threat Monitor)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()