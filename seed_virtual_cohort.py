import urllib.request
import json
import time

def seed_virtual_cohort():
    print("=== SEEDING VIRTUAL IMAGES COHORT INTO LIVE SCANOVA AI ENGINE ===")
    
    # 1. Login to obtain clinician token
    login_payload = json.dumps({"email": "clinician@scanova.health", "password": "Scanova2026!"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/auth/login", data=login_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read().decode())["access_token"]
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get samples list from API
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/xrays/samples", headers=headers)
    with urllib.request.urlopen(req) as r:
        samples = json.loads(r.read().decode())
        print(f"Discovered {len(samples)} virtual and sample images in engine library.")

    # 3. Load & predict each virtual image
    success_count = 0
    for s in samples:
        filename = s["filename"]
        try:
            load_req = urllib.request.Request(f"http://127.0.0.1:8000/api/v1/xrays/load-sample/{filename}", data=b"", headers=headers)
            with urllib.request.urlopen(load_req) as resp:
                res_data = json.loads(resp.read().decode())
                img = res_data["image"]
                pred = res_data["prediction"]
                print(f"  [+] Ingested {filename:<45} -> Acc: {img['accession_number']} | AI: {pred['prediction']:<10} ({pred['confidence']*100:.1f}%) | Latency: {pred['latency_ms']}ms")
                success_count += 1
                
                # Automatically file radiologist ground truth for rich concordance stats
                is_pneu = s.get("expected_finding") == "Pneumonia"
                rad_label = "Pneumonia" if is_pneu else "Normal"
                rad_payload = json.dumps({
                    "image_id": img["id"],
                    "finding_label": rad_label,
                    "confidence_level": "High",
                    "clinical_notes": f"Ground-truth radiologist review for {s.get('title', filename)}: {s.get('description', 'Verified concordant.')}",
                    "radiologist_id_code": "RAD_401",
                    "radiologist_name": "Dr. Julian Reed, MD"
                }).encode()
                rad_req = urllib.request.Request("http://127.0.0.1:8000/api/v1/radiologist/report", data=rad_payload, headers={"Content-Type": "application/json", **headers})
                with urllib.request.urlopen(rad_req) as rad_resp:
                    pass
        except Exception as e:
            print(f"  [-] Failed for {filename}: {e}")

    print(f"\nSuccessfully ingested and evaluated {success_count} virtual clinical radiographs!")

if __name__ == "__main__":
    seed_virtual_cohort()
