import urllib.request
import json
import os
import uuid

test_files = [
    ('sample_data/virtual_normal_male_adult.jpg', 'Normal Male Adult'),
    ('sample_data/virtual_normal_female_adult.jpg', 'Normal Female Adult'),
    ('sample_data/virtual_normal_geriatric.jpg', 'Normal Geriatric'),
    ('sample_data/virtual_normal_pediatric.jpg', 'Normal Pediatric'),
    ('backend/uploads/xrays/xray_1b6ddc94-c4f9-4747-8ea5-e4e5cf17e51e.webp', 'User Google CXR 1'),
    ('backend/uploads/xrays/xray_3a2e4892-5568-4b77-89a2-8c2274a41222.jpeg', 'User Google CXR 2'),
    ('PNEUMONIA_CASE_CXR.jpg', 'Lobar Pneumonia Case'),
    ('PNEUMONIA_CHEST_XRAY.jpg', 'Severe Pneumonia CXR')
]

print("=== VERIFYING DYNAMIC IMAGE-SPECIFIC PREDICTIONS VIA LIVE FASTAPI API ===")
for p, label in test_files:
    if not os.path.exists(p):
        continue
    with open(p, 'rb') as f:
        img_data = f.read()
        
    mime = 'image/webp' if p.endswith('.webp') else 'image/jpeg'
    boundary = '----Boundary' + uuid.uuid4().hex
    parts = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{os.path.basename(p)}"\r\nContent-Type: {mime}\r\n\r\n'.encode('utf-8'),
        img_data,
        f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="patient_age"\r\n\r\n45\r\n'.encode('utf-8'),
        f'--{boundary}--\r\n'.encode('utf-8')
    ]
    body = b''.join(parts)

    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/xrays/upload-and-predict',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        pred = res['prediction']
        p_label = pred['prediction']
        conf = f"{pred['confidence']*100:.1f}%"
        ctr = pred.get('biomarkers', {}).get('cardiothoracic_ratio', 'N/A')
        sym = f"{pred.get('biomarkers', {}).get('bilateral_symmetry_pct', 'N/A')}%"
        sub = pred.get('sub_finding', 'N/A')
        print(f"{label:<24}: {p_label:<10} Conf={conf:<7} [CTR={ctr}, Symmetry={sym}] -> {sub}")
