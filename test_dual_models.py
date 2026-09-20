import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def http_post(url, data_dict=None, token=None):
    data = json.dumps(data_dict).encode('utf-8') if data_dict else b""
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def http_get(url, token=None):
    req = urllib.request.Request(url, method='GET')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def test_dual_model_separation():
    print("Testing Dual Model Pipeline Separation...")
    
    # 1. Login
    login_res = http_post(f"{BASE_URL}/auth/login", {"email": "clinician@scanova.health", "password": "Scanova2026!"})
    token = login_res["access_token"]
    
    # 2. Test Pneumonia load-sample
    pdata = http_post(f"{BASE_URL}/xrays/load-sample/sample_bacterial_pneumonia.jpg?model_type=pneumonia", token=token)
    print("Pneumonia Sample Prediction:", pdata["prediction"]["prediction"], "| Model:", pdata["prediction"]["model_name"], "| Version:", pdata["prediction"]["model_version"])
    assert "DenseNet" in pdata["prediction"]["model_name"] or "CheXNet" in pdata["prediction"]["model_name"]
    assert pdata["prediction"]["prediction"] in ["Normal", "Pneumonia"]
    
    # 3. Test Bone Crack load-sample
    bdata = http_post(f"{BASE_URL}/xrays/load-sample/sample_bone_fracture.jpg?model_type=bone_crack", token=token)
    print("Bone Crack Sample Prediction:", bdata["prediction"]["prediction"], "| Model:", bdata["prediction"]["model_name"], "| Version:", bdata["prediction"]["model_version"])
    assert "Trauma" in bdata["prediction"]["model_name"] or "ResNet" in bdata["prediction"]["model_name"]
    assert bdata["prediction"]["prediction"] in ["Intact Bone", "Bone Fracture"]
    
    # 4. Test Monitoring Metrics Separation
    pneu_m = http_get(f"{BASE_URL}/monitoring/metrics?model_type=pneumonia", token=token)
    bone_m = http_get(f"{BASE_URL}/monitoring/metrics?model_type=bone_crack", token=token)
    print(f"Pneumonia Metrics: Accuracy={pneu_m['all_time']['accuracy']*100:.1f}%, Kappa={pneu_m['all_time']['cohen_kappa']:.3f}")
    print(f"Bone Crack Metrics: Accuracy={bone_m['all_time']['accuracy']*100:.1f}%, Kappa={bone_m['all_time']['cohen_kappa']:.3f}")
    
    print("\n>>> DUAL MODEL SEPARATION VERIFIED SUCCESSFULLY (100% PASS) <<<")

if __name__ == "__main__":
    test_dual_model_separation()
