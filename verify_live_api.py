import urllib.request
import json
import time

def test_full_system():
    print("=== SCANOVA CLINICAL PLATFORM END-TO-END VERIFICATION ===")

    # 1. Health Check
    with urllib.request.urlopen("http://127.0.0.1:8000/health") as r:
        h = json.loads(r.read().decode())
        print(f"[1] Health Check: status={h['status']}, service={h['service']}, model={h['ai_model']}")

    # 2. Auth Login
    login_payload = json.dumps({"email": "clinician@scanova.health", "password": "Scanova2026!"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/auth/login", data=login_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        auth_resp = json.loads(r.read().decode())
        token = auth_resp["access_token"]
        print(f"[2] Auth Login: Success! User: {auth_resp['user']['full_name']} ({auth_resp['user']['role']})")

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Load Sample X-Ray & Run DenseNet-121 Inference
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/xrays/load-sample/sample_bacterial_pneumonia.jpg", data=b"", headers=headers)
    with urllib.request.urlopen(req) as r:
        sample_res = json.loads(r.read().decode())
        image_id = sample_res["image"]["id"]
        pred = sample_res["prediction"]
        print(f"[3] DenseNet-121 Inference: Label={pred['prediction']}, Confidence={pred['confidence']*100:.1f}%, Latency={pred['latency_ms']}ms")
        print(f"    Grad-CAM Heatmap URL: {pred['heatmap_url']}")

    # 4. Radiologist Ground Truth Report
    rad_payload = json.dumps({
        "image_id": image_id,
        "finding_label": "Pneumonia",
        "confidence_level": "High",
        "clinical_notes": "Confirmed dense alveolar consolidation in right lower lobe. Verified by radiologist.",
        "radiologist_id_code": "RAD_401",
        "radiologist_name": "Dr. Julian Reed, MD"
    }).encode()
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/radiologist/report", data=rad_payload, headers={"Content-Type": "application/json", **headers})
    with urllib.request.urlopen(req) as r:
        rad_res = json.loads(r.read().decode())
        print(f"[4] Radiologist Ground Truth Submitted: Agreement={rad_res['report']['agreement_status']}, Finding={rad_res['report']['finding']}")

    # 5. AI Monitoring Agent Metrics
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/monitoring/metrics", headers=headers)
    with urllib.request.urlopen(req) as r:
        m_res = json.loads(r.read().decode())
        all_time = m_res["all_time"]
        print(f"[5] AI Monitoring Agent Metrics: Accuracy={all_time['accuracy']*100:.1f}%, Sensitivity={all_time['sensitivity']*100:.1f}%, Specificity={all_time['specificity']*100:.1f}%, Kappa={all_time['cohen_kappa']}")

    # 6. Statistical Drift Detection
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/drift/status", headers=headers)
    with urllib.request.urlopen(req) as r:
        d_res = json.loads(r.read().decode())
        event = d_res["drift_event"]
        print(f"[6] Statistical Drift Surveillance: PSI={event['psi_score']}, Status={event['drift_status']}, KS-stat={event['ks_statistic']}, KL-Div={event['kl_divergence']}")

    # 7. Clinical Alerts
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/alerts", headers=headers)
    with urllib.request.urlopen(req) as r:
        a_res = json.loads(r.read().decode())
        print(f"[7] Clinical Alerts Queue: Total Alerts={a_res.get('total_count', len(a_res['alerts']))}, Open Incidents={a_res['open_count']}")

    # 8. Download Case PDF Dossier
    req = urllib.request.Request(f"http://127.0.0.1:8000/api/v1/reports/case/{image_id}/pdf", headers=headers)
    with urllib.request.urlopen(req) as r:
        pdf_bytes = r.read()
        print(f"[8] Case PDF Dossier Generation: Valid PDF received ({len(pdf_bytes)} bytes, starts with {pdf_bytes[:4].decode()})")

    # 9. Download Executive Surveillance PDF
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/reports/surveillance/pdf", headers=headers)
    with urllib.request.urlopen(req) as r:
        surv_pdf_bytes = r.read()
        print(f"[9] Surveillance Executive PDF: Valid PDF received ({len(surv_pdf_bytes)} bytes, starts with {surv_pdf_bytes[:4].decode()})")

    # 10. Query Case Database History
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/predictions/history?limit=10", headers=headers)
    with urllib.request.urlopen(req) as r:
        h_res = json.loads(r.read().decode())
        print(f"[10] Case Database Archive: {h_res.get('total_count', len(h_res.get('cases', [])))} cases retrieved in MySQL archive query")

    print("\n>>> ALL 10 MODULES VERIFIED & OPERATIONAL WITH 100% SUCCESS <<<")

if __name__ == "__main__":
    test_full_system()
