import urllib.request
import json
import base64

def test_features():
    # 1. Login with dedicated radiology doctor
    login_data = json.dumps({'email': 'radiology.doctor@scanova.health', 'password': 'Scanova2026!'}).encode()
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    token = data['access_token']
    user = data['user']
    print(f"[1] Radiology Doctor Login: {user['full_name']} | Role: {user['role']} | Email: {user['email']} -> SUCCESS")

    # 2. Test modality validator endpoint
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(base_dir, 'NORMAL_CHEST_XRAY.jpg'), 'rb') as f:
        cxr_bytes = f.read()
    
    with open(os.path.join(base_dir, 'sample_bone_fracture.jpg'), 'rb') as f:
        bone_bytes = f.read()

    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    def create_multipart(filename, content_type, file_bytes):
        body = (
            f'--{boundary}\r\n'
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f'Content-Type: {content_type}\r\n\r\n'
        ).encode('latin1') + file_bytes + f'\r\n--{boundary}--\r\n'.encode('latin1')
        return body

    # Validate CXR
    body_cxr = create_multipart('chest_normal.jpg', 'image/jpeg', cxr_bytes)
    req_cxr = urllib.request.Request('http://127.0.0.1:8000/api/v1/xrays/validate-image', data=body_cxr, headers={'Content-Type': f'multipart/form-data; boundary={boundary}', 'Authorization': f'Bearer {token}'})
    res_cxr = json.loads(urllib.request.urlopen(req_cxr).read().decode())
    print(f"[2] CXR Modality Validation: valid={res_cxr.get('is_valid_xray')} | modality={res_cxr.get('modality_detected')} | recommended_model={res_cxr.get('recommended_model')}")

    # Validate Bone Fracture
    body_bone = create_multipart('bone_test.jpg', 'image/jpeg', bone_bytes)
    req_bone = urllib.request.Request('http://127.0.0.1:8000/api/v1/xrays/validate-image', data=body_bone, headers={'Content-Type': f'multipart/form-data; boundary={boundary}', 'Authorization': f'Bearer {token}'})
    res_bone = json.loads(urllib.request.urlopen(req_bone).read().decode())
    print(f"[3] Bone Modality Validation: valid={res_bone.get('is_valid_xray')} | modality={res_bone.get('modality_detected')} | recommended_model={res_bone.get('recommended_model')}")

    # 3. Test Patient X-Ray Download
    import sys
    sys.path.insert(0, os.path.join(base_dir, 'backend'))
    from app.db.session import SessionLocal
    from app.models.entities import UploadedImage
    db = SessionLocal()
    first_img = db.query(UploadedImage).first()
    if first_img:
        img_id = first_img.id
        # Test download endpoint
        dl_url = f'http://127.0.0.1:8000/api/v1/xrays/download/{img_id}?token={token}'
        res_dl = urllib.request.urlopen(dl_url)
        content_disp = res_dl.headers.get('Content-Disposition')
        content_type = res_dl.headers.get('Content-Type')
        print(f"[4] Patient X-Ray Download: HTTP {res_dl.getcode()} | Content-Disposition: {content_disp} | Content-Type: {content_type} -> SUCCESS")

        # Test PDF download endpoint with token
        pdf_url = f'http://127.0.0.1:8000/api/v1/reports/case/{img_id}/pdf?token={token}'
        res_pdf = urllib.request.urlopen(pdf_url)
        pdf_bytes = res_pdf.read()
        print(f"[5] Case PDF Download: HTTP {res_pdf.getcode()} | Size: {len(pdf_bytes)} bytes | StartsWithPDF: {pdf_bytes.startswith(b'%PDF')} -> SUCCESS")

        # Test Surveillance PDF download endpoint with token
        surv_url = f'http://127.0.0.1:8000/api/v1/reports/surveillance/pdf?token={token}'
        res_surv = urllib.request.urlopen(surv_url)
        surv_bytes = res_surv.read()
        print(f"[6] Surveillance PDF Download: HTTP {res_surv.getcode()} | Size: {len(surv_bytes)} bytes | StartsWithPDF: {surv_bytes.startswith(b'%PDF')} -> SUCCESS")
    db.close()

if __name__ == '__main__':
    test_features()
