import os
import sys

# Ensure backend and model paths are available
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "model"))
sys.path.insert(0, backend_dir)
sys.path.insert(0, model_dir)

from model.densenet_model import get_inference_service

service = get_inference_service()

test_cases = [
    # Pneumonia cases
    ("sample_data/sample_bacterial_pneumonia.jpg", "pneumonia", "Pneumonia"),
    ("sample_data/sample_viral_pneumonia.jpg", "pneumonia", "Pneumonia"),
    ("sample_data/virtual_bacterial_lobar_pneumonia_rll.jpg", "pneumonia", "Pneumonia"),
    ("sample_data/virtual_covid19_ground_glass_pneumonitis.jpg", "pneumonia", "Pneumonia"),
    ("sample_data/sample_normal_cxr_1.jpg", "pneumonia", "Normal"),
    ("sample_data/sample_normal_cxr_2.jpg", "pneumonia", "Normal"),
    ("sample_data/virtual_normal_male_adult.jpg", "pneumonia", "Normal"),
    ("sample_data/virtual_normal_female_adult.jpg", "pneumonia", "Normal"),

    # Bone crack cases
    ("sample_data/sample_bone_fracture.jpg", "bone_crack", "Bone Fracture"),
    ("sample_data/virtual_traumatic_rib_fracture.jpg", "bone_crack", "Bone Fracture"),
    ("sample_data/sample_bone_intact.jpg", "bone_crack", "Intact Bone"),
]

passed = 0
total = len(test_cases)

print(f"\n========================================================")
print(f"       SCANOVA AI INFERENCE ACCURACY TEST RUNNER        ")
print(f"========================================================\n")

for filepath, model_type, expected in test_cases:
    if not os.path.exists(filepath):
        print(f"[SKIP] File not found: {filepath}")
        continue
    res = service.predict(filepath, model_type=model_type, generate_heatmap=False)
    actual = res["prediction"]
    conf = res["confidence"]
    arch = res["model_architecture"]
    
    is_match = (actual == expected)
    status_str = "PASS" if is_match else "FAIL"
    if is_match:
        passed += 1
    
    print(f"[{status_str}] Model: {model_type.upper():<10} | File: {os.path.basename(filepath):<45} | Expected: {expected:<14} | Got: {actual:<14} | Conf: {conf*100:.1f}%")

accuracy = (passed / total) * 100
print(f"\n========================================================")
print(f" RESULTS: {passed}/{total} Passed ({accuracy:.1f}% Accuracy)")
print(f"========================================================\n")

if passed == total:
    print(">>> ALL RADIOGRAPH PREDICTIONS 100% ACCURATE AND VERIFIED! <<<")
else:
    sys.exit(1)
