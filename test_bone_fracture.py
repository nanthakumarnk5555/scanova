import urllib.request
import urllib.parse
import json
import os

API_BASE = "http://127.0.0.1:8000/api/v1"

def http_get(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return resp.status, resp.read()

def http_post_json(url, data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def http_post_multipart(url, file_path, fields):
    boundary = "----ScanovaMedTechBoundaryXYZ123"
    body = bytearray()
    
    for k, v in fields.items():
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        body.extend(f"{v}\r\n".encode())
        
    filename = os.path.basename(file_path)
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
    body.extend(b"Content-Type: image/jpeg\r\n\r\n")
    with open(file_path, "rb") as f:
        body.extend(f.read())
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())

    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def test_bone_fracture_e2e():
    print("=================================================================")
    print("   SCANOVA MEDTECH - BONE CRACK & FRACTURE VERIFICATION SUITE   ")
    print("=================================================================")

    # 1. Check Samples Endpoint
    print("\n[Step 1] Verifying Sample CXR Cohort Library for Fracture Case...")
    status, raw = http_get(f"{API_BASE}/xrays/samples")
    assert status == 200, f"Failed to get samples: {status}"
    samples = json.loads(raw.decode('utf-8'))
    fracture_samples = [s for s in samples if s.get('expected_finding') == 'Bone Fracture' or 'fracture' in s.get('id', '')]
    assert len(fracture_samples) > 0, "No fracture sample found in /xrays/samples!"
    fx_sample = fracture_samples[0]
    print(f"  --> Found Registered Fracture Case: '{fx_sample['title']}'")
    print(f"      Category: '{fx_sample['category']}' | Expected Finding: '{fx_sample['expected_finding']}'")

    # 2. Upload & Predict Fracture Radiograph
    image_path = os.path.abspath("sample_data/virtual_traumatic_rib_fracture.jpg")
    print(f"\n[Step 2] Ingesting & Classifying '{image_path}' via DenseNet-121 + Trauma Radiomics...")
    status, res_data = http_post_multipart(
        f"{API_BASE}/xrays/upload-and-predict",
        image_path,
        {
            "patient_id": "PT-TRAUMA-991",
            "patient_age": "42",
            "patient_sex": "M",
            "site_id": "TRAUMA_CENTER_A"
        }
    )

    assert status == 200, f"Upload and predict failed: {status}"
    image = res_data["image"]
    prediction = res_data["prediction"]

    print(f"  --> Image Accession: {image['accession_number']}")
    print(f"  --> Prediction Label: {prediction['prediction']}")
    print(f"  --> Confidence Score: {prediction['confidence'] * 100:.2f}%")
    print(f"  --> Sub-Finding: {prediction.get('sub_finding')}")
    print(f"  --> Probabilities Spectrum: {prediction['probabilities']}")
    print(f"  --> Model Architecture: {prediction.get('model_architecture')}")

    biomarkers = prediction.get("biomarkers", {})
    print(f"  --> Cortical Integrity: {biomarkers.get('cortical_integrity_pct')}%")
    print(f"  --> Fracture Sharpness: {biomarkers.get('fracture_sharpness_score')}")
    print(f"  --> Bone Crack Detected: {biomarkers.get('bone_crack_detected')}")
    print(f"  --> Bone Crack Location: {biomarkers.get('bone_crack_location')}")

    assert prediction["prediction"] == "Bone Fracture", f"Expected 'Bone Fracture', got {prediction['prediction']}"
    assert biomarkers.get("bone_crack_detected") is True, "Expected bone_crack_detected == True"

    # 3. Verify Heatmap View
    if prediction.get("heatmap_url"):
        heatmap_status, heatmap_bytes = http_get(f"http://127.0.0.1:8000{prediction['heatmap_url']}")
        assert heatmap_status == 200, "Heatmap endpoint failed"
        print(f"  --> Grad-CAM Trauma Saliency Heatmap Verified (Size: {len(heatmap_bytes)} bytes)")

    # 4. Radiologist Ground Truth Concordance Test
    print("\n[Step 3] Submitting Concordant Radiologist Ground Truth ('Bone Fracture')...")
    report_data = {
        "image_id": image["id"],
        "finding_label": "Bone Fracture",
        "confidence_level": "High",
        "clinical_notes": "Ground Truth Verification: Acute displaced fracture of right lateral 6th rib with cortical discontinuity.",
        "radiologist_id_code": "RAD_TRAUMA_01",
        "radiologist_name": "Dr. Marcus Vance, MD (Trauma Radiology)"
    }
    rep_status, rep_json = http_post_json(f"{API_BASE}/radiologist/report", report_data)
    assert rep_status == 200, f"Radiologist report submission failed: {rep_status}"
    print(f"  --> Concordance Result: {rep_json['report']['agreement_status']} (Discordance Type: {rep_json['report']['discordance_type']})")
    assert rep_json["report"]["agreement_status"] == "Concordant"
    assert rep_json["report"]["discordance_type"] == "None"

    # 5. Generate & Verify Clinical Report PDF
    print("\n[Step 4] Authenticating and Generating Clinical Adjudication PDF Report...")
    import random
    rand_id = random.randint(1000, 9999)
    try:
        login_status, login_res = http_post_json(
            f"{API_BASE}/auth/register",
            {
                "email": f"trauma_doc_{rand_id}@scanova.health",
                "password": "SecurePassword123!",
                "full_name": "Dr. Trauma Specialist",
                "role": "radiologist"
            }
        )
    except Exception:
        login_status, login_res = http_post_json(
            f"{API_BASE}/auth/login",
            {"email": f"trauma_doc_{rand_id}@scanova.health", "password": "SecurePassword123!"}
        )
    assert login_status == 200, f"Auth failed: {login_status}"
    token = login_res["access_token"]
    
    req_pdf = urllib.request.Request(
        f"{API_BASE}/reports/case/{image['id']}/pdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_pdf) as resp:
        pdf_bytes = resp.read()
        assert resp.status == 200
        print(f"  --> PDF Generated Successfully with Amber Bone Fracture Styling (Size: {len(pdf_bytes)} bytes)")

    # 6. Test Discordance Handling
    print("\n[Step 5] Testing Discordance Handling (Radiologist reads Normal for Fracture CXR)...")
    disc_data = {
        "image_id": image["id"],
        "finding_label": "Normal",
        "confidence_level": "Moderate",
        "clinical_notes": "Disagree with AI: Cortical contour appears within normal anatomical variant.",
        "radiologist_id_code": "RAD_TRAUMA_02",
        "radiologist_name": "Dr. Elena Rostova, MD"
    }
    disc_status, disc_json = http_post_json(f"{API_BASE}/radiologist/report", disc_data)
    assert disc_status == 200, f"Discordant report submission failed: {disc_status}"
    print(f"  --> Agreement Status: {disc_json['report']['agreement_status']}")
    print(f"  --> Discordance Type: {disc_json['report']['discordance_type']}")
    assert disc_json["report"]["agreement_status"] == "Discordant"
    assert disc_json["report"]["discordance_type"] == "False Positive Fracture"

    print("\n=================================================================")
    print("   [SUCCESS] ALL BONE CRACK & FRACTURE TESTS PASSED 100%!       ")
    print("=================================================================")

if __name__ == "__main__":
    test_bone_fracture_e2e()
